import { errorResponse, jsonResponse, logStructured } from '../_shared/errors.ts';
import { timingSafeEqualStrings } from '../_shared/money.ts';
import { RealPeyAdapter, type PeyAdapter } from '../_shared/pey.ts';
import { reconcileSingleAwaitingCharge } from '../_shared/reconcileLogic.ts';
import {
  createSupabaseAdminClient,
  createSupabaseEdgeRepository,
  type EdgeRepository,
} from '../_shared/supabaseAdmin.ts';

export interface ReconcileDeps {
  repo: EdgeRepository;
  pey: PeyAdapter;
  getCronSecret?: () => string;
}

export function createReconcileChargesHandler(deps: ReconcileDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== 'POST') {
      return errorResponse(req, 405, 'METHOD_NOT_ALLOWED', 'Método no permitido.');
    }

    const expectedSecret = deps.getCronSecret?.() ?? Deno.env.get('CRON_SECRET') ?? '';
    const providedSecret = req.headers.get('x-cron-secret') ?? '';

    if (
      !expectedSecret ||
      !providedSecret ||
      !timingSafeEqualStrings(providedSecret, expectedSecret)
    ) {
      return errorResponse(req, 401, 'UNAUTHORIZED', 'Secreto de cron inválido.');
    }

    const nowMs = Date.now();
    const candidates = await deps.repo.listChargesForReconciliation(20);
    let processed = 0;
    let transitioned = 0;

    for (const charge of candidates) {
      try {
        if (charge.status === 'CREATING') {
          const ageMs = nowMs - new Date(charge.created_at).getTime();
          if (ageMs < 60_000) {
            continue;
          }
          processed += 1;

          if (charge.pey_reference) {
            const tx = await deps.pey.getTransaction(charge.pey_reference);
            if (tx.status === 'PAID') {
              await deps.repo.applyTransition({
                chargeId: charge.id,
                to: 'AWAITING_PAYMENT',
                peyReference: charge.pey_reference,
              });
              await deps.repo.applyTransition({
                chargeId: charge.id,
                to: 'CONFIRMED',
                peyReference: charge.pey_reference,
                peyTransactionId: tx.transactionId,
                paidAt: tx.paidAt,
              });
              transitioned += 1;
              continue;
            }
          }

          await deps.repo.applyTransition({
            chargeId: charge.id,
            to: 'FAILED',
            failureReason: 'CREATION_TIMEOUT',
          });
          transitioned += 1;
          continue;
        }

        if (charge.status === 'AWAITING_PAYMENT') {
          const expiresAtMs = new Date(charge.expires_at).getTime();
          const pastGrace = nowMs > expiresAtMs + 30_000;
          const lastCheckedMs = charge.last_checked_at
            ? new Date(charge.last_checked_at).getTime()
            : 0;
          const staleCheck = !charge.last_checked_at || nowMs - lastCheckedMs >= 20_000;

          if (!pastGrace && !staleCheck) {
            continue;
          }

          const claimed = await deps.repo.claimCheckTurn(charge.id, pastGrace ? 0 : 20);
          if (!claimed) {
            continue;
          }

          processed += 1;
          const updated = await reconcileSingleAwaitingCharge(claimed, deps.repo, deps.pey, nowMs);
          if (updated.status !== charge.status) {
            transitioned += 1;
          }
        }
      } catch (error) {
        logStructured('warn', 'reconcile.charge_error', {
          chargeId: charge.id,
          error: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    return jsonResponse(req, 200, {
      scanned: candidates.length,
      processed,
      transitioned,
    });
  };
}

if (import.meta.main) {
  const adminClient = createSupabaseAdminClient();
  const handler = createReconcileChargesHandler({
    repo: createSupabaseEdgeRepository(adminClient),
    pey: new RealPeyAdapter(),
  });
  Deno.serve(handler);
}
