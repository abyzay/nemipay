import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { resolveOrderTotalAndConcept } from '../_shared/chargeFlow.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse, logStructured } from '../_shared/errors.ts';
import { sha256Hex } from '../_shared/money.ts';
import {
  createBillBodySchema,
  uuidSchema,
  type CreateBillBodyInput,
  type CreateChargeItemInput,
  type SplitCustomShareInput,
} from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  toBillParticipantDto,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CreateBillDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
  getMaxChargeCents?: () => number;
  getBillTtlSeconds?: () => number;
}

export function createBillHandler(deps: CreateBillDeps) {
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
    const idempotencyKey: string = keyParsed.data;

    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return errorResponse(req, 400, 'INVALID_JSON', 'Cuerpo JSON inválido.');
    }

    const bodyParsed = createBillBodySchema.safeParse(rawJson);
    if (!bodyParsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'Datos de cuenta compartida inválidos.', {
        issues: bodyParsed.error.issues,
      });
    }

    const maxChargeCents =
      deps.getMaxChargeCents?.() ??
      (Number.parseInt(Deno.env.get('MAX_CHARGE_CENTS') ?? '9999900', 10) || 9999900);
    const billTtlSeconds =
      deps.getBillTtlSeconds?.() ??
      (Number.parseInt(Deno.env.get('BILL_TTL_SECONDS') ?? '600', 10) || 600);

    const payload: CreateBillBodyInput = bodyParsed.data;

    const resolved = await resolveOrderTotalAndConcept({
      req,
      repo: deps.repo,
      merchantId: user.userId,
      payload:
        'items' in payload && payload.items
          ? { items: payload.items }
          : { amountCents: payload.amountCents!, concept: payload.concept },
      minAmountCents: 200,
      maxChargeCents,
      defaultConcept: 'Cuenta compartida',
    });
    if (!resolved.ok) {
      return resolved.response;
    }

    // Validación de reglas de reparto antes de llamar SQL
    const split = payload.split;
    if (split.mode === 'EQUAL') {
      const base = Math.floor(resolved.amountCents / split.people);
      if (base < 100) {
        return errorResponse(
          req,
          400,
          'SHARE_BELOW_MINIMUM',
          'Cada parte debe ser de al menos $1.00 MXN.'
        );
      }
    } else if (split.mode === 'CUSTOM') {
      const sum = split.shares.reduce(
        (acc: number, s: SplitCustomShareInput) => acc + s.amountCents,
        0
      );
      if (sum !== resolved.amountCents) {
        return errorResponse(
          req,
          400,
          'CUSTOM_SUM_MISMATCH',
          'La suma de las partes debe ser exactamente igual al total de la cuenta.'
        );
      }
    }

    const canonicalBody = {
      order:
        'items' in payload && payload.items
          ? {
              mode: 'items',
              items: payload.items.map((item: CreateChargeItemInput) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            }
          : {
              mode: 'free',
              amountCents: resolved.amountCents,
              concept: resolved.concept,
            },
      split:
        split.mode === 'EQUAL'
          ? { mode: 'EQUAL', people: split.people }
          : split.mode === 'CUSTOM'
            ? {
                mode: 'CUSTOM',
                shares: split.shares.map((s: SplitCustomShareInput) => ({
                  label: (s.label ?? '').trim(),
                  amountCents: s.amountCents,
                })),
              }
            : { mode: 'FREE' },
    };
    const requestHash = await sha256Hex(JSON.stringify(canonicalBody));

    try {
      const result = await deps.repo.createBill({
        merchantId: user.userId,
        concept: resolved.concept,
        items: resolved.itemsSnapshot,
        totalCents: resolved.amountCents,
        splitMode: split.mode,
        idempotencyKey,
        requestHash,
        ttlSeconds: billTtlSeconds,
        people: split.mode === 'EQUAL' ? split.people : null,
        shares: split.mode === 'CUSTOM' ? split.shares : null,
      });

      logStructured('info', 'bill.created', {
        billId: result.bill.id,
        merchantId: user.userId,
        totalCents: result.bill.total_cents,
        splitMode: result.bill.split_mode,
        isReplay: result.isReplay,
      });

      return jsonResponse(req, result.isReplay ? 200 : 201, {
        billId: result.bill.id,
        totalCents: result.bill.total_cents,
        status: result.bill.status,
        splitMode: result.bill.split_mode,
        concept: result.bill.concept,
        expiresAt: result.bill.expires_at,
        participants: result.participants.map(toBillParticipantDto),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('IDEMPOTENCY_CONFLICT')) {
        return errorResponse(
          req,
          409,
          'IDEMPOTENCY_CONFLICT',
          'La llave de idempotencia ya fue usada con datos distintos.'
        );
      }
      if (message.includes('SHARE_BELOW_MINIMUM')) {
        return errorResponse(
          req,
          400,
          'SHARE_BELOW_MINIMUM',
          'Cada parte debe ser de al menos $1.00 MXN.'
        );
      }
      if (message.includes('CUSTOM_SUM_MISMATCH')) {
        return errorResponse(
          req,
          400,
          'CUSTOM_SUM_MISMATCH',
          'La suma de las partes debe ser exactamente igual al total.'
        );
      }
      throw err;
    }
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createBillHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
  });
  Deno.serve(handler);
}
