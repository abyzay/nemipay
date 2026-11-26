begin;

select plan(30);

insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'split1@nemipay.test', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'split2@nemipay.test', 'authenticated', 'authenticated');

insert into public.merchants (id, name)
values
  ('11111111-1111-1111-1111-111111111111', 'Taquería Uno'),
  ('22222222-2222-2222-2222-222222222222', 'Taquería Dos');

-- 1-2. Reparto equitativo: 10000/3 -> 3334,3333,3333 y 20000/4 -> 4x5000
select is(
  (
    select array_agg((p ->> 'share_cents')::integer order by (p ->> 'position')::integer)
    from jsonb_array_elements(
      public.create_bill(
        '11111111-1111-1111-1111-111111111111',
        'Cuenta 100',
        null,
        10000,
        'EQUAL'::public.split_mode,
        'bill-eq-100',
        'hash-eq-100',
        21600,
        3,
        null
      ) -> 'participants'
    ) as p
  ),
  array[3334, 3333, 3333],
  'EQUAL 10000 entre 3 asigna residuo a primera persona'
);

select is(
  (
    select array_agg((p ->> 'share_cents')::integer order by (p ->> 'position')::integer)
    from jsonb_array_elements(
      public.create_bill(
        '11111111-1111-1111-1111-111111111111',
        'Tacos 200',
        null,
        20000,
        'EQUAL'::public.split_mode,
        'bill-eq-200',
        'hash-eq-200',
        21600,
        4,
        null
      ) -> 'participants'
    ) as p
  ),
  array[5000, 5000, 5000, 5000],
  'EQUAL 20000 entre 4 reparte 5000 cada uno'
);

-- 3. Parte menor a 100 centavos -> error
select throws_ok(
  $$ select public.create_bill('11111111-1111-1111-1111-111111111111', 'Chico', null, 250, 'EQUAL'::public.split_mode, 'bill-small', 'h', 21600, 3, null) $$,
  'P0001',
  'SHARE_BELOW_MINIMUM',
  'EQUAL rechaza partes menores a 100 centavos'
);

-- 4. CUSTOM con suma distinta al total -> error
select throws_ok(
  $$ select public.create_bill('11111111-1111-1111-1111-111111111111', 'Custom malo', null, 1000, 'CUSTOM'::public.split_mode, 'bill-custom-bad', 'h', 21600, null, '[{"label":"Ana","amountCents":400},{"label":"Luis","amountCents":500}]'::jsonb) $$,
  'P0001',
  'CUSTOM_SUM_MISMATCH',
  'CUSTOM rechaza suma distinta al total'
);

-- 5. Idempotencia create_bill
select is(
  (
    public.create_bill(
      '11111111-1111-1111-1111-111111111111',
      'Cuenta 100',
      null,
      10000,
      'EQUAL'::public.split_mode,
      'bill-eq-100',
      'hash-eq-100',
      21600,
      3,
      null
    ) ->> 'is_replay'
  )::boolean,
  true,
  'create_bill con misma idempotency_key y hash hace replay'
);

select throws_ok(
  $$ select public.create_bill('11111111-1111-1111-1111-111111111111', 'Otro', null, 10000, 'EQUAL'::public.split_mode, 'bill-eq-100', 'hash-distinto', 21600, 3, null) $$,
  'P0001',
  'IDEMPOTENCY_CONFLICT',
  'create_bill rechaza misma key con request_hash distinto'
);

-- 6-10. reserve_share: MAX_LIVE_SHARES, parte ocupada, índice parcial, otro comercio, FREE
do $$
declare
  v_bill_id uuid;
  v_p1 uuid;
  v_p2 uuid;
  v_p3 uuid;
  v_ch1 public.charges;
  v_ch2 public.charges;
begin
  select id into v_bill_id
  from public.bills
  where merchant_id = '11111111-1111-1111-1111-111111111111'
    and idempotency_key = 'bill-eq-100';

  select id into v_p1 from public.bill_participants where bill_id = v_bill_id and position = 1;
  select id into v_p2 from public.bill_participants where bill_id = v_bill_id and position = 2;
  select id into v_p3 from public.bill_participants where bill_id = v_bill_id and position = 3;

  v_ch1 := public.reserve_share('11111111-1111-1111-1111-111111111111', v_bill_id, v_p1, null, null, 'sh-1', 'h1', 600, 2);
  v_ch2 := public.reserve_share('11111111-1111-1111-1111-111111111111', v_bill_id, v_p2, null, null, 'sh-2', 'h2', 600, 2);
end $$;

select throws_ok(
  $$
  select public.reserve_share(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.bills where idempotency_key = 'bill-eq-100'),
    (select id from public.bill_participants where bill_id = (select id from public.bills where idempotency_key = 'bill-eq-100') and position = 3),
    null,
    null,
    'sh-3',
    'h3',
    600,
    2
  )
  $$,
  'P0001',
  'TOO_MANY_LIVE_SHARES',
  'reserve_share respeta limite MAX_LIVE_SHARES = 2'
);

-- Si pasamos a p2 a EXPIRED simulando vencido, pero p1 sigue vivo, p1 no puede reservarse de nuevo
select throws_ok(
  $$
  select public.reserve_share(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.bills where idempotency_key = 'bill-eq-100'),
    (select id from public.bill_participants where bill_id = (select id from public.bills where idempotency_key = 'bill-eq-100') and position = 1),
    null,
    null,
    'sh-1-dup',
    'h1d',
    600,
    3
  )
  $$,
  'P0001',
  'SHARE_IN_PROGRESS',
  'reserve_share impide reservar participante con cobro vivo'
);

-- Índice único parcial directo en charges
select throws_ok(
  $$
  insert into public.charges (
    merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at, bill_id, participant_id
  ) values (
    '11111111-1111-1111-1111-111111111111',
    3334,
    'Duplicado',
    'CREATING',
    'direct-dup',
    'hdup',
    now() + interval '10 minutes',
    (select id from public.bills where idempotency_key = 'bill-eq-100'),
    (select id from public.bill_participants where bill_id = (select id from public.bills where idempotency_key = 'bill-eq-100') and position = 1)
  )
  $$,
  '23505',
  null,
  'Indice unico parcial evita dos cobros vivos para un mismo participante'
);

-- Modo FREE: reserva hasta el saldo disponible y rechaza exceso
select is(
  (
    select public.reserve_share(
      '11111111-1111-1111-1111-111111111111',
      ((public.create_bill('11111111-1111-1111-1111-111111111111', 'Libre 500', null, 500, 'FREE'::public.split_mode, 'bill-free-500', 'hf500', 21600, null, null) -> 'bill' ->> 'id')::uuid),
      null,
      300,
      'Ana',
      'free-1',
      'hf1',
      600,
      2
    )
  ).amount_cents,
  300,
  'FREE permite reservar aportacion dentro del saldo'
);

select throws_ok(
  $$
  select public.reserve_share(
    '11111111-1111-1111-1111-111111111111',
    (select id from public.bills where idempotency_key = 'bill-free-500'),
    null,
    300,
    'Luis',
    'free-2',
    'hf2',
    600,
    2
  )
  $$,
  'P0001',
  'AMOUNT_EXCEEDS_BALANCE',
  'FREE rechaza aportacion que excede total - confirmado - reservado'
);

select throws_ok(
  $$
  select public.reserve_share(
    '22222222-2222-2222-2222-222222222222',
    (select id from public.bills where idempotency_key = 'bill-free-500'),
    null,
    100,
    'Ajeno',
    'free-ajeno',
    'hfa',
    600,
    2
  )
  $$,
  'P0001',
  'BILL_NOT_FOUND',
  'reserve_share rechaza cuenta de otro comercio'
);

-- 11-13. Trigger recompute_bill: parcial, liquidado y pago tardio con sobrepago
do $$
declare
  v_bill_id uuid;
  v_p1 uuid;
  v_p2 uuid;
  v_c1 uuid;
  v_c2 uuid;
  v_late public.charges;
begin
  v_bill_id := (
    public.create_bill(
      '11111111-1111-1111-1111-111111111111',
      'Cuenta Trigger',
      null,
      2000,
      'EQUAL'::public.split_mode,
      'bill-trg',
      'htrg',
      21600,
      2,
      null
    ) -> 'bill' ->> 'id'
  )::uuid;

  select id into v_p1 from public.bill_participants where bill_id = v_bill_id and position = 1;
  select id into v_p2 from public.bill_participants where bill_id = v_bill_id and position = 2;

  v_c1 := (public.reserve_share('11111111-1111-1111-1111-111111111111', v_bill_id, v_p1, null, null, 'trg-1', 'h-t1', 600, 2)).id;
  v_c2 := (public.reserve_share('11111111-1111-1111-1111-111111111111', v_bill_id, v_p2, null, null, 'trg-2', 'h-t2', 600, 2)).id;

  perform public.apply_charge_transition(v_c1, 'AWAITING_PAYMENT', 'ref-t1', null, 'qr-t1', null, null);
  perform public.apply_charge_transition(v_c1, 'CONFIRMED', 'ref-t1', 'tx-t1', null, now(), null);
end $$;

select is(
  (select status::text from public.bills where idempotency_key = 'bill-trg'),
  'PARTIALLY_PAID',
  'Primer pago confirmado marca la cuenta PARTIALLY_PAID'
);

select is(
  (select collected_cents from public.bills where idempotency_key = 'bill-trg'),
  1000,
  'collected_cents refleja primer pago confirmado'
);

do $$
declare
  v_c2 uuid;
begin
  select id into v_c2 from public.charges where idempotency_key = 'trg-2';
  perform public.apply_charge_transition(v_c2, 'AWAITING_PAYMENT', 'ref-t2', null, 'qr-t2', null, null);
  perform public.apply_charge_transition(v_c2, 'CONFIRMED', 'ref-t2', 'tx-t2', null, now(), null);
end $$;

select is(
  (select status::text from public.bills where idempotency_key = 'bill-trg'),
  'PAID',
  'Segundo pago confirmado liquida la cuenta a PAID'
);

select isnt(
  (select closed_at from public.bills where idempotency_key = 'bill-trg'),
  null,
  'closed_at se establece al liquidar la cuenta'
);

select is(
  (select overpaid_cents from public.bills where idempotency_key = 'bill-trg'),
  0,
  'overpaid_cents es 0 cuando suma exacta'
);

-- Simular pago tardío que genera sobrepago (p. ej. un QR previo expirado que se confirma tarde)
do $$
declare
  v_bill_id uuid;
  v_p1 uuid;
  v_late_id uuid;
begin
  select id into v_bill_id from public.bills where idempotency_key = 'bill-trg';
  select id into v_p1 from public.bill_participants where bill_id = v_bill_id and position = 1;
  insert into public.charges (
    merchant_id, amount_cents, concept, status, idempotency_key, request_hash, expires_at, bill_id, participant_id
  ) values (
    '11111111-1111-1111-1111-111111111111',
    500,
    'Tardio',
    'EXPIRED',
    'trg-late',
    'h-late',
    now() - interval '5 minutes',
    v_bill_id,
    v_p1
  ) returning id into v_late_id;

  perform public.apply_charge_transition(v_late_id, 'CONFIRMED', 'ref-late', 'tx-late', null, now(), null);
end $$;

select is(
  (select collected_cents from public.bills where idempotency_key = 'bill-trg'),
  2500,
  'Pago tardio suma a collected_cents'
);

select is(
  (select overpaid_cents from public.bills where idempotency_key = 'bill-trg'),
  500,
  'Pago tardio que supera el total registra overpaid_cents'
);

-- 14. get_bill_detail como Comercio Uno vs Comercio Dos
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select is(
  jsonb_array_length(
    public.get_bill_detail((select id from public.bills where idempotency_key = 'bill-trg')) -> 'participants'
  ),
  2,
  'get_bill_detail devuelve los participantes al dueno'
);

-- 15. RLS: Comercio Dos no ve cuentas ni participantes ni puede escribir
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select is(
  public.get_bill_detail((select id from public.bills where idempotency_key = 'bill-trg')),
  null,
  'get_bill_detail no filtra cuenta a otro comercio'
);

select is((select count(*) from public.bills), 0::bigint, 'Otro comercio no ve bills');
select is((select count(*) from public.bill_participants), 0::bigint, 'Otro comercio no ve bill_participants');

select throws_ok(
  $$ insert into public.bills (merchant_id, concept, total_cents, split_mode, idempotency_key, request_hash, expires_at) values ('22222222-2222-2222-2222-222222222222', 'Fake', 500, 'EQUAL', 'k', 'h', now()) $$,
  '42501',
  null,
  'authenticated no puede insertar en bills'
);

select throws_ok(
  $$ update public.bills set status = 'PAID' $$,
  '42501',
  null,
  'authenticated no puede actualizar bills'
);

select throws_ok(
  $$ insert into public.bill_participants (bill_id, position, label, share_cents) values ('00000000-0000-0000-0000-000000000001', 1, 'X', 100) $$,
  '42501',
  null,
  'authenticated no puede insertar en bill_participants'
);

select throws_ok(
  $$ delete from public.bill_participants $$,
  '42501',
  null,
  'authenticated no puede borrar bill_participants'
);

select throws_ok(
  $$ insert into public.charges (merchant_id, amount_cents, concept, idempotency_key, request_hash, expires_at) values ('22222222-2222-2222-2222-222222222222', 1000, 'Fake', 'k', 'h', now()) $$,
  '42501',
  null,
  'authenticated no puede insertar en charges'
);

reset role;
set local role anon;

select throws_ok(
  $$ select count(*) from public.bills $$,
  '42501',
  null,
  'anon no puede leer bills'
);

select throws_ok(
  $$ select count(*) from public.bill_participants $$,
  '42501',
  null,
  'anon no puede leer bill_participants'
);

reset role;
select * from finish();
rollback;
