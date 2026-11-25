begin;

select plan(12);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'merchant1@nemipay.test', 'authenticated', 'authenticated');

insert into public.merchants (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Comercio Transiciones');

-- Caso 1: CREATING -> AWAITING_PAYMENT -> CONFIRMED
insert into public.charges (
  id, merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  5000,
  'Cobro normal',
  'CREATING',
  'idem-t1',
  'hash-t1',
  now() + interval '10 minutes'
);

select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000001',
    'AWAITING_PAYMENT',
    'pey-ref-1',
    null,
    'codi://qr/1'
  )),
  'AWAITING_PAYMENT'::public.charge_status,
  'CREATING -> AWAITING_PAYMENT permitido'
);

-- Prohibida: AWAITING_PAYMENT -> FAILED (solo CREATING -> FAILED)
select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000001',
    'FAILED',
    null,
    null,
    null,
    null,
    'error'
  )),
  'AWAITING_PAYMENT'::public.charge_status,
  'AWAITING_PAYMENT -> FAILED prohibido devuelve fila sin cambios'
);

-- Permitida: AWAITING_PAYMENT -> CONFIRMED
select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000001',
    'CONFIRMED',
    'pey-ref-1',
    'pey-tx-1',
    null,
    now()
  )),
  'CONFIRMED'::public.charge_status,
  'AWAITING_PAYMENT -> CONFIRMED permitido'
);

select is(
  (select paid_after_expiry from public.charges where id = '10000000-0000-0000-0000-000000000001'),
  false,
  'pago dentro de tiempo tiene paid_after_expiry = false'
);

-- Terminal: CONFIRMED -> CANCELLED prohibido
select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000001',
    'CANCELLED'
  )),
  'CONFIRMED'::public.charge_status,
  'CONFIRMED es terminal y no cambia a CANCELLED'
);

-- Caso 2: EXPIRED -> CONFIRMED marca paid_after_expiry = true
insert into public.charges (
  id, merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at
) values (
  '10000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  3000,
  'Cobro tardío expirado',
  'EXPIRED',
  'idem-t2',
  'hash-t2',
  now() - interval '2 minutes'
);

select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000002',
    'CONFIRMED',
    'pey-ref-2',
    'pey-tx-2',
    null,
    now()
  )),
  'CONFIRMED'::public.charge_status,
  'EXPIRED -> CONFIRMED permitido (pago tardío)'
);

select is(
  (select paid_after_expiry from public.charges where id = '10000000-0000-0000-0000-000000000002'),
  true,
  'EXPIRED -> CONFIRMED marca paid_after_expiry = true'
);

-- Caso 3: CANCELLED -> CONFIRMED marca paid_after_expiry = true
insert into public.charges (
  id, merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at
) values (
  '10000000-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  4000,
  'Cobro tardío cancelado',
  'CANCELLED',
  'idem-t3',
  'hash-t3',
  now() + interval '5 minutes'
);

select is(
  (select paid_after_expiry from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000003',
    'CONFIRMED',
    'pey-ref-3',
    'pey-tx-3',
    null,
    now()
  )),
  true,
  'CANCELLED -> CONFIRMED marca paid_after_expiry = true'
);

-- Caso 4: CREATING -> FAILED es terminal
insert into public.charges (
  id, merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at
) values (
  '10000000-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  4000,
  'Cobro fallido',
  'CREATING',
  'idem-t4',
  'hash-t4',
  now() + interval '5 minutes'
);

select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000004',
    'FAILED',
    null,
    null,
    null,
    null,
    'PEY_400'
  )),
  'FAILED'::public.charge_status,
  'CREATING -> FAILED permitido'
);

select is(
  (select status from public.apply_charge_transition(
    '10000000-0000-0000-0000-000000000004',
    'CONFIRMED'
  )),
  'FAILED'::public.charge_status,
  'FAILED es terminal'
);

-- Caso 5: ni authenticated ni anon pueden ejecutar apply_charge_transition
set local role authenticated;
select throws_ok(
  $$ select public.apply_charge_transition('10000000-0000-0000-0000-000000000001', 'CANCELLED') $$,
  '42501',
  null,
  'authenticated no puede ejecutar apply_charge_transition'
);

reset role;
set local role anon;
select throws_ok(
  $$ select public.apply_charge_transition('10000000-0000-0000-0000-000000000001', 'CANCELLED') $$,
  '42501',
  null,
  'anon no puede ejecutar apply_charge_transition'
);

reset role;
select * from finish();
rollback;
