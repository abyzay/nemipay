import { createSupabaseAuthResolver, type AuthResolver } from '../_shared/auth.ts';
import { handleCorsPreflight } from '../_shared/cors.ts';
import { errorResponse, jsonResponse } from '../_shared/errors.ts';
import { RealPeyAdapter, type PeyAdapter } from '../_shared/pey.ts';
import { reconcileSingleAwaitingCharge } from '../_shared/reconcileLogic.ts';
import { chargeIdBodySchema } from '../_shared/schemas.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  toChargeDto,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface CheckChargeDeps {
  authenticate: AuthResolver;
  repo: EdgeRepository;
  pey: PeyAdapter;
  minCheckIntervalSeconds?: number;
}

const TERMINAL_OR_REVIEW = new Set(['CONFIRMED', 'FAILED', 'UNDER_REVIEW']);

export function createCheckChargeHandler(deps: CheckChargeDeps) {
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

    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return errorResponse(req, 400, 'INVALID_JSON', 'Cuerpo JSON inválido.');
    }

    const parsed = chargeIdBodySchema.safeParse(rawJson);
    if (!parsed.success) {
      return errorResponse(req, 400, 'VALIDATION_ERROR', 'chargeId inválido.');
    }

    const charge = await deps.repo.getChargeById(parsed.data.chargeId);
    if (!charge || charge.merchant_id !== user.userId) {
      return errorResponse(req, 404, 'CHARGE_NOT_FOUND', 'Cobro no encontrado.');
    }

    if (TERMINAL_OR_REVIEW.has(charge.status)) {
      return jsonResponse(req, 200, toChargeDto(charge));
    }

    const minInterval = deps.minCheckIntervalSeconds ?? 10;
    const claimed = await deps.repo.claimCheckTurn(charge.id, minInterval);
    if (!claimed) {
      return jsonResponse(req, 200, toChargeDto(charge));
    }

    if (claimed.status === 'AWAITING_PAYMENT') {
      const updated = await reconcileSingleAwaitingCharge(claimed, deps.repo, deps.pey);
      return jsonResponse(req, 200, toChargeDto(updated));
    }

    if ((claimed.status === 'EXPIRED' || claimed.status === 'CANCELLED') && claimed.pey_reference) {
      const tx = await deps.pey.getTransaction(claimed.pey_reference);
      if (tx.status === 'PAID') {
        const updated =
          tx.amountCents !== null && tx.amountCents !== claimed.amount_cents
            ? claimed
            : await deps.repo.applyTransition({
                chargeId: claimed.id,
                to: 'CONFIRMED',
                peyReference: claimed.pey_reference,
                peyTransactionId: tx.transactionId,
                paidAt: tx.paidAt,
              });
        return jsonResponse(req, 200, toChargeDto(updated));
      }
    }

    return jsonResponse(req, 200, toChargeDto(claimed));
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createCheckChargeHandler({
    authenticate: createSupabaseAuthResolver(adminClient),
    repo: createSupabaseEdgeRepository(adminClient),
    pey: new RealPeyAdapter(),
  });
  Deno.serve(handler);
}
