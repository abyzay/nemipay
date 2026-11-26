import { assertEquals } from 'jsr:@std/assert@1';
import { signStandardWebhook } from '../_shared/pey.ts';
import { FakePeyAdapter } from '../_shared/peyFake.ts';
import { createCancelBillHandler } from '../cancel-bill/index.ts';
import { createBillHandler } from '../create-bill/index.ts';
import { createShareChargeHandler } from '../create-share-charge/index.ts';
import { createPeyWebhookHandler } from '../pey-webhook/index.ts';
import { InMemoryEdgeRepository } from './inMemoryRepo.ts';

const MERCHANT_A = '11111111-1111-1111-1111-111111111111';
const MERCHANT_B = '22222222-2222-2222-2222-222222222222';
const PROD_TACO = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROD_AGUA = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function setup() {
  const repo = new InMemoryEdgeRepository();
  repo.products.set(PROD_TACO, {
    id: PROD_TACO,
    merchant_id: MERCHANT_A,
    name: 'Taco al pastor',
    price_cents: 2500,
    active: true,
  });
  repo.products.set(PROD_AGUA, {
    id: PROD_AGUA,
    merchant_id: MERCHANT_A,
    name: 'Agua de horchata',
    price_cents: 5000,
    active: true,
  });

  const pey = new FakePeyAdapter();
  const authenticate = async (req: Request) => {
    const auth = req.headers.get('authorization');
    if (auth === 'Bearer valid-a') return { userId: MERCHANT_A, email: 'a@nemipay.test' };
    if (auth === 'Bearer valid-b') return { userId: MERCHANT_B, email: 'b@nemipay.test' };
    return null;
  };

  return {
    repo,
    pey,
    createBill: createBillHandler({ authenticate, repo }),
    createShareCharge: createShareChargeHandler({ authenticate, repo, pey }),
    cancelBill: createCancelBillHandler({ authenticate, repo }),
    webhook: createPeyWebhookHandler({ repo, pey }),
  };
}

async function signWebhook(
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

Deno.test('create-bill rechaza sin JWT con 401 y no llama a Pey', async () => {
  const { createBill, pey } = setup();
  const res = await createBill(
    new Request('http://localhost/create-bill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({
        amountCents: 20000,
        concept: 'Mesa 1',
        split: { mode: 'EQUAL', people: 4 },
      }),
    })
  );
  assertEquals(res.status, 401);
  assertEquals(pey.createCalls, 0);
});

Deno.test(
  'create-bill calcula total en servidor desde productos, valida modos e idempotencia',
  async () => {
    const { createBill, pey } = setup();
    const key = crypto.randomUUID();

    // 4 tacos (4 * 2500 = 10000) + 2 aguas (2 * 5000 = 10000) = 20000
    const res1 = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({
          items: [
            { productId: PROD_TACO, quantity: 4 },
            { productId: PROD_AGUA, quantity: 2 },
          ],
          split: { mode: 'EQUAL', people: 4 },
        }),
      })
    );
    assertEquals(res1.status, 201);
    const dto1 = await res1.json();
    assertEquals(dto1.totalCents, 20000);
    assertEquals(dto1.participants.length, 4);
    assertEquals(dto1.participants[0].shareCents, 5000);
    assertEquals(pey.createCalls, 0);

    // Replay con misma key y mismo body -> 200
    const res2 = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({
          items: [
            { productId: PROD_TACO, quantity: 4 },
            { productId: PROD_AGUA, quantity: 2 },
          ],
          split: { mode: 'EQUAL', people: 4 },
        }),
      })
    );
    assertEquals(res2.status, 200);
    const dto2 = await res2.json();
    assertEquals(dto2.billId, dto1.billId);

    // Misma key con body distinto -> 409
    const resConflict = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({
          items: [{ productId: PROD_TACO, quantity: 4 }],
          split: { mode: 'EQUAL', people: 2 },
        }),
      })
    );
    assertEquals(resConflict.status, 409);

    // Más de 4 personas -> 400
    const resTooMany = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 25000,
          concept: 'Mesa grande',
          split: { mode: 'EQUAL', people: 5 },
        }),
      })
    );
    assertEquals(resTooMany.status, 400);

    // CUSTOM con suma distinta -> 400
    const resBadCustom = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 1000,
          concept: 'Custom mal',
          split: {
            mode: 'CUSTOM',
            shares: [
              { label: 'Ana', amountCents: 400 },
              { label: 'Luis', amountCents: 400 },
            ],
          },
        }),
      })
    );
    assertEquals(resBadCustom.status, 400);
  }
);

Deno.test(
  'create-share-charge: idempotencia, 409 parte ocupada / exceso vivos / saldo, 410 cerrada y cuenta ajena',
  async () => {
    const { createBill, createShareCharge, cancelBill, pey } = setup();

    const billRes = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 9000,
          concept: 'Mesa 3',
          split: { mode: 'EQUAL', people: 3 },
        }),
      })
    );
    const bill = await billRes.json();
    const [p1, p2, p3] = bill.participants;

    // Primera reserva idempotente
    const key1 = crypto.randomUUID();
    const s1 = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key1,
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p1.id }),
      })
    );
    assertEquals(s1.status, 201);
    const sd1 = await s1.json();
    assertEquals(sd1.amountCents, 3000);
    assertEquals(pey.createCalls, 1);

    // Replay con misma key -> 200 mismo charge y no vuelve a llamar Pey
    const s1Replay = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key1,
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p1.id }),
      })
    );
    assertEquals(s1Replay.status, 200);
    const sd1Replay = await s1Replay.json();
    assertEquals(sd1Replay.chargeId, sd1.chargeId);
    assertEquals(pey.createCalls, 1);

    // Misma parte con otra key -> 409 SHARE_IN_PROGRESS
    const s1Dup = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p1.id }),
      })
    );
    assertEquals(s1Dup.status, 409);
    assertEquals((await s1Dup.json()).code, 'SHARE_IN_PROGRESS');

    // Segunda parte ok (MAX_LIVE_SHARES = 2)
    const s2 = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p2.id }),
      })
    );
    assertEquals(s2.status, 201);

    // Tercera parte simultánea -> 409 TOO_MANY_LIVE_SHARES
    const s3 = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p3.id }),
      })
    );
    assertEquals(s3.status, 409);
    assertEquals((await s3.json()).code, 'TOO_MANY_LIVE_SHARES');

    // Cuenta ajena -> 404
    const sOther = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-b',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p3.id }),
      })
    );
    assertEquals(sOther.status, 404);

    // Cancelar cuenta y luego intentar reservar -> 410 BILL_CLOSED
    const cancelRes = await cancelBill(
      new Request('http://localhost/cancel-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billId: bill.billId }),
      })
    );
    assertEquals(cancelRes.status, 200);

    const sClosed = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: bill.billId, participantId: p3.id }),
      })
    );
    assertEquals(sClosed.status, 410);
    assertEquals((await sClosed.json()).code, 'BILL_CLOSED');

    // Modo FREE: AMOUNT_EXCEEDS_BALANCE
    const freeRes = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 500,
          concept: 'Libre',
          split: { mode: 'FREE' },
        }),
      })
    );
    const freeBill = await freeRes.json();
    const f1 = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: freeBill.billId, amountCents: 300, label: 'Ana' }),
      })
    );
    assertEquals(f1.status, 201);

    const f2Exceed = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: freeBill.billId, amountCents: 250, label: 'Luis' }),
      })
    );
    assertEquals(f2Exceed.status, 409);
    assertEquals((await f2Exceed.json()).code, 'AMOUNT_EXCEEDS_BALANCE');
  }
);

Deno.test(
  'Flujo completo con webhook simulado: 4 pagos liquidan a PAID; monto distinto -> UNDER_REVIEW sin sumar; cancel-bill 409 tras pago',
  async () => {
    const { repo, pey, createBill, createShareCharge, cancelBill, webhook } = setup();

    const billRes = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 400,
          concept: 'Tacos 4',
          split: { mode: 'EQUAL', people: 4 },
        }),
      })
    );
    const bill = await billRes.json();

    // Pagar participantes 1, 2, 3 (de 2 en 2 respetando MAX_LIVE_SHARES = 2)
    for (let i = 0; i < 3; i += 1) {
      const shareRes = await createShareCharge(
        new Request('http://localhost/create-share-charge', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-a',
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({ billId: bill.billId, participantId: bill.participants[i].id }),
        })
      );
      assertEquals(shareRes.status, 201);
      const shareDto = await shareRes.json();

      const whReq = await signWebhook(pey.webhookSecret, `wh-paid-${i}`, {
        type: 'codi.qr.payment_received',
        amount: 1, // $1.00 MXN = 100 centavos
        transactionId: `tx-${i}`,
        datePaid: Math.floor(Date.now() / 1000),
        metadata: { externalMetadata: { chargeId: shareDto.chargeId } },
      });
      const whRes = await webhook(whReq);
      assertEquals(whRes.status, 200);
    }

    assertEquals(repo.bills.get(bill.billId)?.status, 'PARTIALLY_PAID');
    assertEquals(repo.bills.get(bill.billId)?.collected_cents, 300);

    // cancel-bill con pagos confirmados -> 409
    const cancelRes = await cancelBill(
      new Request('http://localhost/cancel-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billId: bill.billId }),
      })
    );
    assertEquals(cancelRes.status, 409);

    // Participante 4: primero probar webhook con monto distinto -> UNDER_REVIEW sin sumar
    const s4Res = await createShareCharge(
      new Request('http://localhost/create-share-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ billId: bill.billId, participantId: bill.participants[3].id }),
      })
    );
    const s4 = await s4Res.json();

    const badWhReq = await signWebhook(pey.webhookSecret, 'wh-bad-amt', {
      type: 'codi.qr.payment_received',
      amount: 2, // esperaba $1, llegó $2 -> UNDER_REVIEW
      transactionId: 'tx-bad',
      datePaid: Math.floor(Date.now() / 1000),
      metadata: { externalMetadata: { chargeId: s4.chargeId } },
    });
    const badWhRes = await webhook(badWhReq);
    assertEquals(badWhRes.status, 200);
    assertEquals(repo.charges.get(s4.chargeId)?.status, 'UNDER_REVIEW');
    assertEquals(repo.bills.get(bill.billId)?.collected_cents, 300);
    assertEquals(repo.bills.get(bill.billId)?.status, 'PARTIALLY_PAID');

    // Simular un 4to pago válido (p.ej. modo FREE/nuevo cobro de $1) para liquidar la cuenta a PAID
    const bill2Res = await createBill(
      new Request('http://localhost/create-bill', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 400,
          concept: 'Tacos 4 completos',
          split: { mode: 'EQUAL', people: 4 },
        }),
      })
    );
    const bill2 = await bill2Res.json();
    for (let i = 0; i < 4; i += 1) {
      const sr = await createShareCharge(
        new Request('http://localhost/create-share-charge', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-a',
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({ billId: bill2.billId, participantId: bill2.participants[i].id }),
        })
      );
      const sd = await sr.json();
      const wh = await signWebhook(pey.webhookSecret, `wh2-${i}`, {
        type: 'codi.qr.payment_received',
        amount: 1,
        transactionId: `tx2-${i}`,
        datePaid: Math.floor(Date.now() / 1000),
        metadata: { externalMetadata: { chargeId: sd.chargeId } },
      });
      await webhook(wh);
    }

    assertEquals(repo.bills.get(bill2.billId)?.status, 'PAID');
    assertEquals(repo.bills.get(bill2.billId)?.collected_cents, 400);
    assertEquals(repo.bills.get(bill2.billId)?.overpaid_cents, 0);
  }
);
