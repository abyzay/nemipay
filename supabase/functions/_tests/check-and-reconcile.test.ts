import { assertEquals } from 'jsr:@std/assert@1';
import { FakePeyAdapter } from '../_shared/peyFake.ts';
import type { ChargeRow } from '../_shared/supabaseAdmin.ts';
import { createCheckChargeHandler } from '../check-charge/index.ts';
import { createReconcileChargesHandler } from '../reconcile-charges/index.ts';
import { InMemoryEdgeRepository } from './inMemoryRepo.ts';

const MERCHANT_A = '11111111-1111-1111-1111-111111111111';

function seedAwaiting(repo: InMemoryEdgeRepository, overrides: Partial<ChargeRow> = {}): ChargeRow {
  const row: ChargeRow = {
    id: crypto.randomUUID(),
    merchant_id: MERCHANT_A,
    amount_cents: 5000,
    currency: 'MXN',
    concept: 'Prueba',
    items: null,
    status: 'AWAITING_PAYMENT',
    idempotency_key: crypto.randomUUID(),
    request_hash: 'h',
    pey_reference: `ref-${crypto.randomUUID().slice(0, 6)}`,
    pey_transaction_id: null,
    qr_payload: 'CODI://TEST',
    expires_at: new Date(Date.now() + 600_000).toISOString(),
    paid_at: null,
    paid_after_expiry: false,
    failure_reason: null,
    last_checked_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
  repo.charges.set(row.id, row);
  return row;
}

Deno.test('check-charge respeta el intervalo mínimo de 10 s entre consultas a Pey', async () => {
  const repo = new InMemoryEdgeRepository();
  const pey = new FakePeyAdapter();
  const charge = seedAwaiting(repo);

  const handler = createCheckChargeHandler({
    authenticate: async () => ({ userId: MERCHANT_A, email: 'a@nemipay.test' }),
    repo,
    pey,
    minCheckIntervalSeconds: 10,
  });

  const r1 = await handler(
    new Request('http://localhost/check-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chargeId: charge.id }),
    })
  );
  assertEquals(r1.status, 200);
  assertEquals(pey.getCalls, 1);

  // Segunda llamada inmediata dentro de los 10 s NO consulta a Pey
  const r2 = await handler(
    new Request('http://localhost/check-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chargeId: charge.id }),
    })
  );
  assertEquals(r2.status, 200);
  assertEquals(pey.getCalls, 1);
});

Deno.test(
  'reconcile-charges rechaza peticiones sin x-cron-secret válido y reconcilia pendientes/expirados',
  async () => {
    const repo = new InMemoryEdgeRepository();
    const pey = new FakePeyAdapter();
    const handler = createReconcileChargesHandler({
      repo,
      pey,
      getCronSecret: () => 'super-cron-secret',
    });

    const unauthRes = await handler(
      new Request('http://localhost/reconcile-charges', {
        method: 'POST',
        headers: { 'x-cron-secret': 'wrong' },
      })
    );
    assertEquals(unauthRes.status, 401);

    const paidCharge = seedAwaiting(repo, {
      pey_reference: 'ref-paid',
      last_checked_at: new Date(Date.now() - 30_000).toISOString(),
    });
    pey.transactions.set('ref-paid', {
      status: 'PAID',
      peyReference: 'ref-paid',
      transactionId: 'tx-reconciled',
      amountCents: 5000,
      paidAt: new Date().toISOString(),
    });

    const expiredCharge = seedAwaiting(repo, {
      pey_reference: 'ref-expired',
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    });

    const okRes = await handler(
      new Request('http://localhost/reconcile-charges', {
        method: 'POST',
        headers: { 'x-cron-secret': 'super-cron-secret' },
      })
    );
    assertEquals(okRes.status, 200);
    assertEquals((await repo.getChargeById(paidCharge.id))?.status, 'CONFIRMED');
    assertEquals((await repo.getChargeById(expiredCharge.id))?.status, 'EXPIRED');
  }
);
