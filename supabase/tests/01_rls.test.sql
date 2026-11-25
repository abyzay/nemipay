begin;

select plan(12);

-- Crear dos usuarios de prueba y sus comercios
insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'merchant1@nemipay.test', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'merchant2@nemipay.test', 'authenticated', 'authenticated');

insert into public.merchants (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'Comercio Uno'),
  ('22222222-2222-2222-2222-222222222222', 'Comercio Dos');

insert into public.products (id, merchant_id, name, price_cents)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Producto A', 1500),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Producto B', 2500);

insert into public.charges (
  id, merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at
) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 5000, 'Cobro 1', 'AWAITING_PAYMENT', 'idem-1', 'hash-1', now() + interval '10 minutes'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 8000, 'Cobro 2', 'AWAITING_PAYMENT', 'idem-2', 'hash-2', now() + interval '10 minutes');

insert into public.webhook_events (webhook_id, type, payload)
values ('wh-1', 'codi.qr.payment_received', '{"ok": true}'::jsonb);

-- 1. Probar aislamiento como Comercio Uno
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  (select count(*) from public.merchants),
  1::bigint,
  'authenticated solo lee su propio merchant'
);

select is(
  (select count(*) from public.products),
  1::bigint,
  'authenticated solo lee sus propios products'
);

select is(
  (select count(*) from public.charges),
  1::bigint,
  'authenticated solo lee sus propios charges'
);

-- 2. authenticated no puede insertar ni actualizar products de otro comercio
select throws_ok(
  $$ insert into public.products (merchant_id, name, price_cents) values ('22222222-2222-2222-2222-222222222222', 'Ajeno', 1000) $$,
  '42501',
  null,
  'authenticated no puede insertar producto de otro merchant'
);

update public.products
set price_cents = 9999
where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

reset role;
select is(
  (select price_cents from public.products where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  2500,
  'authenticated no puede modificar producto ajeno'
);

-- 3. authenticated no puede insertar, actualizar ni borrar charges
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select throws_ok(
  $$ insert into public.charges (merchant_id, amount_cents, concept, idempotency_key, request_hash, expires_at) values ('11111111-1111-1111-1111-111111111111', 1000, 'Fake', 'k', 'h', now()) $$,
  '42501',
  null,
  'authenticated no tiene permiso insert en charges'
);

select throws_ok(
  $$ update public.charges set status = 'CONFIRMED' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '42501',
  null,
  'authenticated no tiene permiso update en charges'
);

select throws_ok(
  $$ delete from public.charges where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' $$,
  '42501',
  null,
  'authenticated no tiene permiso delete en charges'
);

-- 4. authenticated no puede leer webhook_events
select throws_ok(
  $$ select count(*) from public.webhook_events $$,
  '42501',
  null,
  'authenticated no puede leer webhook_events'
);

-- 5. anon no tiene acceso a ninguna tabla
reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.products $$,
  '42501',
  null,
  'anon no puede leer products'
);

select throws_ok(
  $$ select count(*) from public.charges $$,
  '42501',
  null,
  'anon no puede leer charges'
);

select throws_ok(
  $$ select count(*) from public.webhook_events $$,
  '42501',
  null,
  'anon no puede leer webhook_events'
);

reset role;
select * from finish();
rollback;
