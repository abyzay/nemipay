import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { requestPeyQrForCharge } from '../_shared/chargeFlow.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';
import { sha256Hex } from '../_shared/money.ts';
import { RealPeyAdapter, type PeyAdapter } from '../_shared/pey.ts';
import { createShareChargeBodySchema, uuidSchema } from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  type ChargeRow,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CreateShareChargeDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
  pey: PeyAdapter;
  getChargeTtlSeconds?: () => number;
  getMaxLiveShares?: () => number;
}

function toShareChargeDto(row: ChargeRow) {
  return {
    chargeId: row.id,
    billId: row.bill_id ?? null,
    participantId: row.participant_id ?? null,
    amountCents: row.amount_cents,
    qrPayload: row.qr_payload,
    expiresAt: row.expires_at,
    status: row.status,
  };
}

export function createShareChargeHandler(deps: CreateShareChargeDeps) {
  return async (req: Request): Promise<Response> => {
    const preflight = handleCorsPreflight(req);
    if (preflight) return preflight;

    if (req.method !== 'POST') {
      return errorResponse(req, 405, 'METHOD_NOT_ALLOWED', 'Método no permitido.');
    }

    const user = await deps.authenticate(req);
    if (!user) {
      return errorResponse(req, 401, 'UNAUTHORIZED', 'Sesión requerida.');
    }

    const rawIdempotencyKey = req.headers.get('idempotency-key')?.trim() ?? '';
    const keyParsed = uuidSchema.safeParse(rawIdempotencyKey);
    if (!keyParsed.success) {
      return errorResponse(
        req,
        400,
        'INVALID_IDEMPOTENCY_KEY',
        'El header Idempotency-Key debe ser un UUID válido.'
      );
    }
    const idempotencyKey = keyParsed.data;

    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return errorResponse(req, 400, 'INVALID_JSON', 'Cuerpo JSON inválido.');
    }

    const bodyParsed = createShareChargeBodySchema.safeParse(rawJson);
    if (!bodyParsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'Datos de parte inválidos.', {
        issues: bodyParsed.error.issues,
      });
    }

    const payload = bodyParsed.data;
    const ttlSeconds =
      deps.getChargeTtlSeconds?.() ??
      (Number.parseInt(Deno.env.get('CHARGE_TTL_SECONDS') ?? '600', 10) || 600);
    // VERIFY: Mantener MAX_LIVE_SHARES=2 mientras Pey permita >=2 QR activos simultáneos;
    // bajar a 1 vía variable de entorno MAX_LIVE_SHARES si Pey limita a 1 QR vivo por cuenta.
    const maxLiveShares =
      deps.getMaxLiveShares?.() ??
      (Number.parseInt(Deno.env.get('MAX_LIVE_SHARES') ?? '2', 10) || 2);

    const requestHash = await sha256Hex(
      JSON.stringify({
        billId: payload.billId,
        participantId: payload.participantId ?? null,
        amountCents: payload.amountCents ?? null,
        label: (payload.label ?? '').trim(),
      })
    );

    let reservedCharge: ChargeRow;
    try {
      reservedCharge = await deps.repo.reserveShare({
        merchantId: user.userId,
        billId: payload.billId,
        participantId: payload.participantId ?? null,
        amountCents: payload.amountCents ?? null,
        label: payload.label ?? null,
        idempotencyKey,
        requestHash,
        ttlSeconds,
        maxLiveShares,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('BILL_NOT_FOUND') || msg.includes('PARTICIPANT_NOT_FOUND')) {
        return errorResponse(req, 404, 'BILL_NOT_FOUND', 'La cuenta o participante no existe.');
      }
      if (msg.includes('BILL_CLOSED')) {
        return errorResponse(
          req,
          410,
          'BILL_CLOSED',
          'La cuenta ya fue liquidada, cancelada o venció.'
        );
      }
      if (msg.includes('SHARE_IN_PROGRESS')) {
        return errorResponse(
          req,
          409,
          'SHARE_IN_PROGRESS',
          'Esta parte ya tiene un cobro activo o confirmado.'
        );
      }
      if (msg.includes('TOO_MANY_LIVE_SHARES')) {
        return errorResponse(
          req,
          409,
          'TOO_MANY_LIVE_SHARES',
          'Ya hay demasiados QR activos al mismo tiempo para esta cuenta.'
        );
      }
      if (msg.includes('AMOUNT_EXCEEDS_BALANCE')) {
        return errorResponse(
          req,
          409,
          'AMOUNT_EXCEEDS_BALANCE',
          'El monto supera el saldo disponible por cobrar en esta cuenta.'
        );
      }
      if (msg.includes('IDEMPOTENCY_CONFLICT')) {
        return errorResponse(
          req,
          409,
          'IDEMPOTENCY_CONFLICT',
          'La llave de idempotencia ya fue usada con datos distintos.'
        );
      }
      if (
        msg.includes('PARTICIPANT_REQUIRED') ||
        msg.includes('INVALID_PARTICIPANT_FOR_FREE') ||
        msg.includes('INVALID_SHARE_AMOUNT') ||
        msg.includes('INVALID_PARTICIPANT_LABEL')
      ) {
        return errorResponse(req, 400, 'VALIDATION_ERROR', 'Datos inválidos para reservar parte.');
      }
      throw err;
    }

    // Si ya tiene QR o avanzó más allá de CREATING (idempotencia), devolver sin llamar a Pey
    if (reservedCharge.status !== 'CREATING') {
      return jsonResponse(req, 200, toShareChargeDto(reservedCharge));
    }

    const qrFlow = await requestPeyQrForCharge({
      req,
      repo: deps.repo,
      pey: deps.pey,
      charge: reservedCharge,
      merchantId: user.userId,
    });
    if (!qrFlow.ok) {
      return qrFlow.response;
    }

    return jsonResponse(req, 201, toShareChargeDto(qrFlow.charge));
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createShareChargeHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
    pey: new RealPeyAdapter(),
  });
  Deno.serve(handler);
}
