import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { requestPeyQrForCharge, resolveOrderTotalAndConcept } from '../_shared/chargeFlow.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';
import { sha256Hex } from '../_shared/money.ts';
import { RealPeyAdapter, type PeyAdapter } from '../_shared/pey.ts';
import { createChargeBodySchema, uuidSchema } from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  toChargeDto,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CreateChargeDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
  pey: PeyAdapter;
  getMaxChargeCents?: () => number;
  getChargeTtlSeconds?: () => number;
  getRateLimitPerMinute?: () => number;
}

export function createChargeHandler(deps: CreateChargeDeps) {
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

    const bodyParsed = createChargeBodySchema.safeParse(rawJson);
    if (!bodyParsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'Datos de cobro inválidos.', {
        issues: bodyParsed.error.issues,
      });
    }

    const maxChargeCents =
      deps.getMaxChargeCents?.() ??
      (Number.parseInt(Deno.env.get('MAX_CHARGE_CENTS') ?? '9999900', 10) || 9999900);
    const ttlSeconds =
      deps.getChargeTtlSeconds?.() ??
      (Number.parseInt(Deno.env.get('CHARGE_TTL_SECONDS') ?? '600', 10) || 600);
    const rateLimitPerMinute = deps.getRateLimitPerMinute?.() ?? 30;

    const payload = bodyParsed.data;
    const canonicalBody =
      'items' in payload && payload.items
        ? {
            mode: 'items',
            items: payload.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }
        : {
            mode: 'free',
            amountCents: payload.amountCents,
            concept: (payload.concept ?? 'Cobro NemiPay').trim(),
          };
    const requestHash = await sha256Hex(JSON.stringify(canonicalBody));

    const existing = await deps.repo.findChargeByIdempotencyKey(user.userId, idempotencyKey);
    if (existing) {
      if (existing.request_hash !== requestHash) {
        return errorResponse(
          req,
          409,
          'IDEMPOTENCY_CONFLICT',
          'La llave de idempotencia ya fue usada con datos distintos.'
        );
      }
      return jsonResponse(req, 200, toChargeDto(existing));
    }

    const oneMinuteAgoIso = new Date(Date.now() - 60_000).toISOString();
    const recentCount = await deps.repo.countRecentCharges(user.userId, oneMinuteAgoIso);
    if (recentCount >= rateLimitPerMinute) {
      return errorResponse(
        req,
        429,
        'RATE_LIMITED',
        'Demasiados cobros en el último minuto. Espera unos segundos.'
      );
    }

    const resolved = await resolveOrderTotalAndConcept({
      req,
      repo: deps.repo,
      merchantId: user.userId,
      payload:
        'items' in payload && payload.items
          ? { items: payload.items }
          : { amountCents: payload.amountCents!, concept: payload.concept },
      minAmountCents: 100,
      maxChargeCents,
    });
    if (!resolved.ok) {
      return resolved.response;
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    let createdCharge;
    try {
      createdCharge = await deps.repo.insertCreatingCharge({
        merchantId: user.userId,
        amountCents: resolved.amountCents,
        concept: resolved.concept,
        items: resolved.itemsSnapshot,
        idempotencyKey,
        requestHash,
        expiresAt,
      });
    } catch (err) {
      // Posible carrera concurrente con la misma idempotency_key
      const raceExisting = await deps.repo.findChargeByIdempotencyKey(user.userId, idempotencyKey);
      if (raceExisting) {
        if (raceExisting.request_hash !== requestHash) {
          return errorResponse(
            req,
            409,
            'IDEMPOTENCY_CONFLICT',
            'La llave de idempotencia ya fue usada con datos distintos.'
          );
        }
        return jsonResponse(req, 200, toChargeDto(raceExisting));
      }
      throw err;
    }

    const qrFlow = await requestPeyQrForCharge({
      req,
      repo: deps.repo,
      pey: deps.pey,
      charge: createdCharge,
      merchantId: user.userId,
    });
    if (!qrFlow.ok) {
      return qrFlow.response;
    }

    return jsonResponse(req, 201, toChargeDto(qrFlow.charge));
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createChargeHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
    pey: new RealPeyAdapter(),
  });
  Deno.serve(handler);
}
