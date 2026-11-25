import { logStructured } from './errors.ts';
import type { PeyAdapter } from './pey.ts';
import type { ChargeRow, EdgeRepository } from './supabaseAdmin.ts';

export async function reconcileSingleAwaitingCharge(
  charge: ChargeRow,
  repo: EdgeRepository,
  pey: PeyAdapter,
  nowMs = Date.now(),
  gracePeriodMs = 30_000
): Promise<ChargeRow> {
  const expiresAtMs = new Date(charge.expires_at).getTime();
  const isPastGrace = nowMs > expiresAtMs + gracePeriodMs;

  if (!charge.pey_reference) {
    if (isPastGrace) {
      return await repo.applyTransition({
        chargeId: charge.id,
        to: 'EXPIRED',
      });
    }
    return charge;
  }

  const tx = await pey.getTransaction(charge.pey_reference);
  if (tx.status === 'PAID') {
    if (tx.amountCents !== null && tx.amountCents !== charge.amount_cents) {
      logStructured('warn', 'reconcile.amount_mismatch', {
        chargeId: charge.id,
        expectedCents: charge.amount_cents,
        receivedCents: tx.amountCents,
      });
      return await repo.applyTransition({
        chargeId: charge.id,
        to: 'UNDER_REVIEW',
        peyReference: charge.pey_reference,
        peyTransactionId: tx.transactionId,
        failureReason: 'AMOUNT_MISMATCH',
      });
    }

    return await repo.applyTransition({
      chargeId: charge.id,
      to: 'CONFIRMED',
      peyReference: charge.pey_reference,
      peyTransactionId: tx.transactionId,
      paidAt: tx.paidAt,
    });
  }

  if (isPastGrace) {
    return await repo.applyTransition({
      chargeId: charge.id,
      to: 'EXPIRED',
    });
  }

  return charge;
}
