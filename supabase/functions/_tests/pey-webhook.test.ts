import { assertEquals } from 'jsr:@std/assert@1';
import { signStandardWebhook } from '../_shared/pey.ts';
import { FakePeyAdapter } from '../_shared/peyFake.ts';
import type { ChargeRow } from '../_shared/supabaseAdmin.ts';
import { createPeyWebhookHandler } from '../pey-webhook/index.ts';
import { InMemoryEdgeRepository } from './inMemoryRepo.ts';

function seedCharge(repo: InMemoryEdgeRepository, overrides: Partial<ChargeRow> = {}): ChargeRow {
  const id = overrides.id ?? crypto.randomUUID();
  const row: ChargeRow = {
    id,
    merchant_id: '11111111-1111-1111-1111-111111111111',
    amount_cents: 8000,
    currency: 'MXN',
    concept: 'Cobro NemiPay',
    items: null,
    status: 'AWAITING_PAYMENT',
    idempotency_key: crypto.randomUUID(),
    request_hash: 'hash',
    pey_reference: 'qr-ref-1',
    pey_transaction_id: null,
    qr_payload: 'CODI://QR',
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

async function makeSignedRequest(
  secret: string,
  webhookId: string,
  payload: Record<string, unknown>
): Promise<Request> {
  const rawBody = JSON.stringify(payload);
  const ts = Math.floor(Date.now() / 1000);
  const sig = await signStandardWebhook(secret, webhookId, ts, rawBody);
  return new Request('http://localhost/pey-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'webhook-id': webhookId,
      'webhook-timestamp': String(ts),
      'webhook-signature': sig,
    },
    body: rawBody,
  });
}

Deno.test('pey-webhook rechaza firma inválida con 401', async () => {
  const repo = new InMemoryEdgeRepository();
  const pey = new FakePeyAdapter();
  const handler = createPeyWebhookHandler({ repo, pey });

  const res = await handler(
    new Request('http://localhost/pey-webhook', {
      method: 'POST',
      headers: {
        'webhook-id': 'msg_bad',
        'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
        'webhook-signature': 'v1,invalidSignatureBase64==',
      },
      body: JSON.stringify({ type: 'codi.qr.payment_received' }),
    })
  );
  assertEquals(res.status, 401);
});

Deno.test('pey-webhook deduplica webhook_id repetido y confirma una sola vez', async () => {
  const repo = new InMemoryEdgeRepository();
  const pey = new FakePeyAdapter();
  const handler = createPeyWebhookHandler({ repo, pey });
  const charge = seedCharge(repo);

  const payload = {
    type: 'codi.qr.payment_received',
    amount: 80,
    codiQrId: charge.pey_reference,
    transactionId: 'tx-001',
    datePaid: Math.floor(Date.now() / 1000),
    metadata: { externalMetadata: { chargeId: charge.id } },
  };

  const r1 = await handler(await makeSignedRequest(pey.webhookSecret, 'msg_dup_1', payload));
  const r2 = await handler(await makeSignedRequest(pey.webhookSecret, 'msg_dup_1', payload));

  assertEquals(r1.status, 200);
  assertEquals(r2.status, 200);
  assertEquals(repo.transitionCallsToConfirmed, 1);
  assertEquals((await repo.getChargeById(charge.id))?.status, 'CONFIRMED');
});

Deno.test('pey-webhook marca UNDER_REVIEW si el monto no coincide', async () => {
  const repo = new InMemoryEdgeRepository();
  const pey = new FakePeyAdapter();
  const handler = createPeyWebhookHandler({ repo, pey });
  const charge = seedCharge(repo, { amount_cents: 8000 });

  const res = await handler(
    await makeSignedRequest(pey.webhookSecret, 'msg_mismatch', {
      type: 'codi.qr.payment_received',
      amount: 75,
      codiQrId: charge.pey_reference,
      transactionId: 'tx-002',
      datePaid: Math.floor(Date.now() / 1000),
      metadata: { externalMetadata: { chargeId: charge.id } },
    })
  );

  assertEquals(res.status, 200);
  assertEquals((await repo.getChargeById(charge.id))?.status, 'UNDER_REVIEW');
});

Deno.test(
  'pey-webhook registra pago tardío tras expirar con paid_after_expiry = true',
  async () => {
    const repo = new InMemoryEdgeRepository();
    const pey = new FakePeyAdapter();
    const handler = createPeyWebhookHandler({ repo, pey });
    const charge = seedCharge(repo, {
      status: 'EXPIRED',
      expires_at: new Date(Date.now() - 120_000).toISOString(),
    });

    const res = await handler(
      await makeSignedRequest(pey.webhookSecret, 'msg_late', {
        type: 'codi.qr.payment_received',
        amount: 80,
        codiQrId: charge.pey_reference,
        transactionId: 'tx-003',
        datePaid: Math.floor(Date.now() / 1000),
        metadata: { externalMetadata: { chargeId: charge.id } },
      })
    );

    assertEquals(res.status, 200);
    const updated = await repo.getChargeById(charge.id);
    assertEquals(updated?.status, 'CONFIRMED');
    assertEquals(updated?.paid_after_expiry, true);
  }
);

Deno.test(
  'pey-webhook maneja eventos desconocidos sin romper y dos webhooks simultáneos hacen una sola transición',
  async () => {
    const repo = new InMemoryEdgeRepository();
    const pey = new FakePeyAdapter();
    const handler = createPeyWebhookHandler({ repo, pey });
    const charge = seedCharge(repo);

    const unknownRes = await handler(
      await makeSignedRequest(pey.webhookSecret, 'msg_unknown_ev', {
        type: 'codi.qr.expired',
        codiQrId: charge.pey_reference,
      })
    );
    assertEquals(unknownRes.status, 200);
    assertEquals((await repo.getChargeById(charge.id))?.status, 'AWAITING_PAYMENT');

    const paymentPayload = {
      type: 'codi.qr.payment_received',
      amount: 80,
      codiQrId: charge.pey_reference,
      transactionId: 'tx-concurrent',
      datePaid: Math.floor(Date.now() / 1000),
      metadata: { externalMetadata: { chargeId: charge.id } },
    };

    const [resA, resB] = await Promise.all([
      handler(await makeSignedRequest(pey.webhookSecret, 'msg_c1', paymentPayload)),
      handler(await makeSignedRequest(pey.webhookSecret, 'msg_c2', paymentPayload)),
    ]);

    assertEquals(resA.status, 200);
    assertEquals(resB.status, 200);
    assertEquals(repo.transitionCallsToConfirmed, 1);
  }
);
