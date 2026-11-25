import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { FakePeyAdapter } from '../_shared/peyFake.ts';
import { createChargeHandler } from '../create-charge/index.ts';
import { InMemoryEdgeRepository } from './inMemoryRepo.ts';

const MERCHANT_A = '11111111-1111-1111-1111-111111111111';
const MERCHANT_B = '22222222-2222-2222-2222-222222222222';
const PROD_1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROD_2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PROD_INACTIVE = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const PROD_OTHER = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

function setup() {
  const repo = new InMemoryEdgeRepository();
  repo.products.set(PROD_1, {
    id: PROD_1,
    merchant_id: MERCHANT_A,
    name: 'Agua 600ml',
    price_cents: 1500,
    active: true,
  });
  repo.products.set(PROD_2, {
    id: PROD_2,
    merchant_id: MERCHANT_A,
    name: 'Fruta picada',
    price_cents: 4500,
    active: true,
  });
  repo.products.set(PROD_INACTIVE, {
    id: PROD_INACTIVE,
    merchant_id: MERCHANT_A,
    name: 'Inactivo',
    price_cents: 2000,
    active: false,
  });
  repo.products.set(PROD_OTHER, {
    id: PROD_OTHER,
    merchant_id: MERCHANT_B,
    name: 'Ajeno',
    price_cents: 3000,
    active: true,
  });

  const pey = new FakePeyAdapter();
  const handler = createChargeHandler({
    authenticate: async (req) => {
      const auth = req.headers.get('authorization');
      if (auth === 'Bearer valid-a') return { userId: MERCHANT_A, email: 'a@nemipay.test' };
      return null;
    },
    repo,
    pey,
  });

  return { repo, pey, handler };
}

Deno.test('FakePeyAdapter se niega a cargarse si APP_ENV=production', () => {
  const prev = Deno.env.get('APP_ENV');
  Deno.env.set('APP_ENV', 'production');
  try {
    assertThrows(() => new FakePeyAdapter(), Error, 'APP_ENV=production');
  } finally {
    if (prev === undefined) Deno.env.delete('APP_ENV');
    else Deno.env.set('APP_ENV', prev);
  }
});

Deno.test('create-charge rechaza sin JWT con 401', async () => {
  const { handler } = setup();
  const res = await handler(
    new Request('http://localhost/create-charge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ amountCents: 5000 }),
    })
  );
  assertEquals(res.status, 401);
});

Deno.test(
  'create-charge idempotencia: misma key mismo body -> 200; distinto body -> 409',
  async () => {
    const { handler, pey } = setup();
    const key = crypto.randomUUID();

    const res1 = await handler(
      new Request('http://localhost/create-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({ amountCents: 8000, concept: 'Corte' }),
      })
    );
    assertEquals(res1.status, 201);
    const dto1 = await res1.json();
    assertEquals(dto1.amountCents, 8000);
    assertEquals(dto1.status, 'AWAITING_PAYMENT');
    assertEquals(pey.createCalls, 1);

    const res2 = await handler(
      new Request('http://localhost/create-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({ amountCents: 8000, concept: 'Corte' }),
      })
    );
    assertEquals(res2.status, 200);
    const dto2 = await res2.json();
    assertEquals(dto2.id, dto1.id);
    assertEquals(pey.createCalls, 1);

    const resConflict = await handler(
      new Request('http://localhost/create-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify({ amountCents: 9000, concept: 'Corte' }),
      })
    );
    assertEquals(resConflict.status, 409);
  }
);

Deno.test(
  'create-charge calcula total en servidor y snapshot no cambia si cambia el precio',
  async () => {
    const { handler, repo } = setup();

    const res = await handler(
      new Request('http://localhost/create-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          items: [
            { productId: PROD_1, quantity: 2 }, // 2 * 1500 = 3000
            { productId: PROD_2, quantity: 1 }, // 1 * 4500 = 4500
          ],
        }),
      })
    );

    assertEquals(res.status, 201);
    const dto = await res.json();
    assertEquals(dto.amountCents, 7500);
    assertEquals(dto.concept, '2× Agua 600ml, 1× Fruta picada');

    // Cambiar el precio del producto en BD no altera el cobro previo
    repo.products.get(PROD_1)!.price_cents = 9900;
    const savedCharge = await repo.getChargeById(dto.id);
    assertEquals(savedCharge?.amount_cents, 7500);
    assertEquals(savedCharge?.items?.[0].priceCents, 1500);
  }
);

Deno.test(
  'create-charge rechaza items y amountCents juntos, productos ajenos/inactivos y cantidades inválidas',
  async () => {
    const { handler } = setup();

    const bothRes = await handler(
      new Request('http://localhost/create-charge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-a',
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          amountCents: 1000,
          items: [{ productId: PROD_1, quantity: 1 }],
        }),
      })
    );
    assertEquals(bothRes.status, 400);

    for (const productId of [PROD_INACTIVE, PROD_OTHER, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee']) {
      const badProdRes = await handler(
        new Request('http://localhost/create-charge', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-a',
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({
            items: [{ productId, quantity: 1 }],
          }),
        })
      );
      assertEquals(badProdRes.status, 400);
    }

    for (const quantity of [0, 100]) {
      const badQtyRes = await handler(
        new Request('http://localhost/create-charge', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer valid-a',
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify({
            items: [{ productId: PROD_1, quantity }],
          }),
        })
      );
      assertEquals(badQtyRes.status, 400);
    }
  }
);
