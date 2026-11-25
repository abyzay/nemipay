begin;

select plan(9);

insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'merchant1@nemipay.test', 'authenticated', 'authenticated');

insert into public.merchants (id, name)
values ('11111111-1111-1111-1111-111111111111', 'Comercio Restricciones');

-- 1. Check amount_cents >= 100
select throws_ok(
  $$ insert into public.charges (merchant_id, amount_cents, concept, idempotency_key, request_hash, expires_at) values ('11111111-1111-1111-1111-111111111111', 99, 'Menor a peso', 'k-low', 'h', now() + interval '5 minutes') $$,
  '23514',
  null,
  'amount_cents < 100 rechazado por check constraint'
);

-- 2. Unique (merchant_id, idempotency_key)
insert into public.charges (
  merchant_id, amount_cents, concept, idempotency_key, request_hash, pey_reference, pey_transaction_id, expires_at
) values (
  '11111111-1111-1111-1111-111111111111', 2000, 'Primero', 'idem-unique', 'hash-u', 'ref-u', 'tx-u', now() + interval '5 minutes'
);

select throws_ok(
  $$ insert into public.charges (merchant_id, amount_cents, concept, idempotency_key, request_hash, expires_at) values ('11111111-1111-1111-1111-111111111111', 2000, 'Duplicado', 'idem-unique', 'hash-u', now() + interval '5 minutes') $$,
  '23505',
  null,
  'idempotency_key duplicado para el mismo merchant falla con unique_violation'
);

-- 3. Unique pey_reference
select throws_ok(
  $$ insert into public.charges (merchant_id, amount_cents, concept, idempotency_key, request_hash, pey_reference, expires_at) values ('11111111-1111-1111-1111-111111111111', 2000, 'Ref dup', 'idem-ref-dup', 'hash', 'ref-u', now() + interval '5 minutes') $$,
  '23505',
  null,
  'pey_reference duplicado falla con unique_violation'
);

-- 4. Unique pey_transaction_id
select throws_ok(
  $$ insert into public.charges (merchant_id, amount_cents, concept, idempotency_key, request_hash, pey_transaction_id, expires_at) values ('11111111-1111-1111-1111-111111111111', 2000, 'Tx dup', 'idem-tx-dup', 'hash', 'tx-u', now() + interval '5 minutes') $$,
  '23505',
  null,
  'pey_transaction_id duplicado falla con unique_violation'
);

-- 5. Unique webhook_id
insert into public.webhook_events (webhook_id, type, payload)
values ('wh-unique', 'codi.qr.payment_received', '{}'::jsonb);

select throws_ok(
  $$ insert into public.webhook_events (webhook_id, type, payload) values ('wh-unique', 'codi.qr.payment_received', '{}'::jsonb) $$,
  '23505',
  null,
  'webhook_id duplicado falla con unique_violation'
);

-- 6. Borde de medianoche CDMX:
-- Limpiar cobros previos y simular dos cobros en torno a 00:00 CDMX (UTC-6).
-- Supongamos que "hoy" en CDMX es la fecha actual en America/Mexico_City:
-- Un cobro creado ayer a las 23:30 CDMX (= hoy 05:30 UTC) NO debe entrar en daily_summary ni charges_today,
-- aunque en UTC pertenezca a la misma fecha calendario que hoy temprano.
delete from public.charges;

-- Ayer 23:30 America/Mexico_City
insert into public.charges (
  merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at, created_at
) values (
  '11111111-1111-1111-1111-111111111111',
  9900,
  'Ayer 23:30 CDMX',
  'CONFIRMED',
  'idem-yesterday',
  'h-y',
  now() + interval '5 minutes',
  (((now() at time zone 'America/Mexico_City')::date - 1)::timestamp + time '23:30:00') at time zone 'America/Mexico_City'
);

-- Hoy 00:15 America/Mexico_City
insert into public.charges (
  merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at, created_at
) values (
  '11111111-1111-1111-1111-111111111111',
  5000,
  'Hoy 00:15 CDMX',
  'CONFIRMED',
  'idem-today-ok',
  'h-t1',
  now() + interval '5 minutes',
  (((now() at time zone 'America/Mexico_City')::date)::timestamp + time '00:15:00') at time zone 'America/Mexico_City'
);

-- Hoy pero pendiente (no debe sumarse en daily_summary aunque sí aparecer en charges_today)
insert into public.charges (
  merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at, created_at
) values (
  '11111111-1111-1111-1111-111111111111',
  3000,
  'Hoy pendiente',
  'AWAITING_PAYMENT',
  'idem-today-pending',
  'h-t2',
  now() + interval '5 minutes',
  (((now() at time zone 'America/Mexico_City')::date)::timestamp + time '00:20:00') at time zone 'America/Mexico_City'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.charges_today()),
  2::bigint,
  'charges_today devuelve solo los 2 cobros del día CDMX (excluye ayer 23:30 CDMX)'
);

select is(
  (select total_confirmed_cents from public.daily_summary()),
  5000::bigint,
  'daily_summary suma solo CONFIRMED de hoy CDMX'
);

select is(
  (select count_confirmed from public.daily_summary()),
  1::bigint,
  'daily_summary cuenta solo CONFIRMED de hoy CDMX'
);

select is(
  (select count(*) from public.charges_today() where concept = 'Ayer 23:30 CDMX'),
  0::bigint,
  'cobro de 23:30 CDMX de ayer no aparece en charges_today aunque en UTC sea del mismo día'
);

reset role;
select * from finish();
rollback;
