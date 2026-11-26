-- NemiPay: Cuentas compartidas (Split de pagos)
-- Enums, tablas, índices, RLS, Realtime, funciones SQL, trigger y expiración.

create type public.split_mode as enum ('EQUAL', 'CUSTOM', 'FREE');

create type public.bill_status as enum (
  'OPEN',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
  'EXPIRED'
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id),
  concept text not null check (char_length(trim(concept)) between 1 and 80),
  items jsonb,
  total_cents integer not null check (total_cents >= 200),
  split_mode public.split_mode not null,
  status public.bill_status not null default 'OPEN',
  idempotency_key text not null,
  request_hash text not null,
  collected_cents integer not null default 0 check (collected_cents >= 0),
  overpaid_cents integer not null default 0 check (overpaid_cents >= 0),
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (merchant_id, idempotency_key)
);

create index bills_merchant_created_at_idx
  on public.bills (merchant_id, created_at desc);

create index bills_status_expires_at_idx
  on public.bills (status, expires_at);

create trigger set_bills_updated_at
  before update on public.bills
  for each row
  execute function public.set_updated_at();

create table public.bill_participants (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  position integer not null check (position >= 1),
  label text not null default '' check (char_length(label) <= 20),
  share_cents integer check (share_cents >= 100),
  created_at timestamptz not null default now(),
  unique (bill_id, position)
);

alter table public.charges
  add column bill_id uuid references public.bills(id),
  add column participant_id uuid references public.bill_participants(id),
  add constraint charges_bill_participant_chk check ((bill_id is null) = (participant_id is null));

create index charges_bill_id_idx
  on public.charges (bill_id)
  where bill_id is not null;

-- Un solo cobro vivo o confirmado por participante (evita cobrar dos veces la misma parte)
create unique index charges_one_live_per_participant
  on public.charges (participant_id)
  where participant_id is not null
    and status in ('CREATING', 'AWAITING_PAYMENT', 'CONFIRMED', 'UNDER_REVIEW');

-- RLS y privilegios
alter table public.bills enable row level security;
alter table public.bill_participants enable row level security;

revoke all on public.bills from anon;
revoke all on public.bill_participants from anon;

revoke insert, update, delete on public.bills from authenticated;
revoke insert, update, delete on public.bill_participants from authenticated;

create policy "bills_select_own"
  on public.bills
  for select
  to authenticated
  using (merchant_id = (select auth.uid()));

create policy "bill_participants_select_own"
  on public.bill_participants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bills as b
      where b.id = bill_id
        and b.merchant_id = (select auth.uid())
    )
  );

alter publication supabase_realtime add table public.bills;

-- ============================================================================
-- Funciones SQL
-- ============================================================================

create or replace function public.create_bill(
  p_merchant_id uuid,
  p_concept text,
  p_items jsonb,
  p_total_cents integer,
  p_split_mode public.split_mode,
  p_idempotency_key text,
  p_request_hash text,
  p_ttl_seconds integer,
  p_people integer default null,
  p_shares jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.bills;
  v_bill public.bills;
  v_clean_concept text := trim(coalesce(p_concept, ''));
  v_base integer;
  v_rem integer;
  v_share integer;
  v_sum integer := 0;
  v_pos integer := 0;
  v_elem jsonb;
  v_label text;
  v_amount integer;
  v_participants jsonb;
begin
  if p_merchant_id is null then
    raise exception 'MERCHANT_REQUIRED';
  end if;

  if coalesce(trim(p_idempotency_key), '') = '' or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  -- Revisar idempotencia previa
  select *
  into v_existing
  from public.bills
  where merchant_id = p_merchant_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_hash <> p_request_hash then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;

    select coalesce(
      jsonb_agg(to_jsonb(bp) order by bp.position asc),
      '[]'::jsonb
    )
    into v_participants
    from public.bill_participants as bp
    where bp.bill_id = v_existing.id;

    return jsonb_build_object(
      'is_replay', true,
      'bill', to_jsonb(v_existing),
      'participants', v_participants
    );
  end if;

  if v_clean_concept = '' or char_length(v_clean_concept) > 80 then
    raise exception 'INVALID_CONCEPT';
  end if;

  if p_total_cents is null or p_total_cents < 200 then
    raise exception 'INVALID_TOTAL_CENTS';
  end if;

  if p_ttl_seconds is null or p_ttl_seconds < 60 then
    raise exception 'INVALID_TTL_SECONDS';
  end if;

  if p_split_mode = 'EQUAL'::public.split_mode then
    if p_people is null or p_people < 2 or p_people > 20 then
      raise exception 'INVALID_PEOPLE_COUNT';
    end if;
    v_base := p_total_cents / p_people;
    v_rem := p_total_cents % p_people;
    if v_base < 100 then
      raise exception 'SHARE_BELOW_MINIMUM';
    end if;
  elsif p_split_mode = 'CUSTOM'::public.split_mode then
    if p_shares is null
      or jsonb_typeof(p_shares) <> 'array'
      or jsonb_array_length(p_shares) < 2
      or jsonb_array_length(p_shares) > 20
    then
      raise exception 'INVALID_CUSTOM_SHARES';
    end if;

    for v_elem in select value from jsonb_array_elements(p_shares)
    loop
      v_label := trim(coalesce(v_elem ->> 'label', ''));
      if char_length(v_label) > 20 then
        raise exception 'INVALID_PARTICIPANT_LABEL';
      end if;

      if (v_elem ->> 'amountCents') is null or (v_elem ->> 'amountCents') !~ '^\d+$' then
        raise exception 'INVALID_SHARE_AMOUNT';
      end if;

      v_amount := (v_elem ->> 'amountCents')::integer;
      if v_amount < 100 then
        raise exception 'SHARE_BELOW_MINIMUM';
      end if;
      v_sum := v_sum + v_amount;
    end loop;

    if v_sum <> p_total_cents then
      raise exception 'CUSTOM_SUM_MISMATCH';
    end if;
  end if;

  begin
    insert into public.bills (
      merchant_id,
      concept,
      items,
      total_cents,
      split_mode,
      status,
      idempotency_key,
      request_hash,
      expires_at
    )
    values (
      p_merchant_id,
      v_clean_concept,
      p_items,
      p_total_cents,
      p_split_mode,
      'OPEN'::public.bill_status,
      p_idempotency_key,
      p_request_hash,
      now() + make_interval(secs => p_ttl_seconds)
    )
    returning * into v_bill;
  exception
    when unique_violation then
      select *
      into v_existing
      from public.bills
      where merchant_id = p_merchant_id
        and idempotency_key = p_idempotency_key;

      if v_existing.id is not null then
        if v_existing.request_hash <> p_request_hash then
          raise exception 'IDEMPOTENCY_CONFLICT';
        end if;

        select coalesce(
          jsonb_agg(to_jsonb(bp) order by bp.position asc),
          '[]'::jsonb
        )
        into v_participants
        from public.bill_participants as bp
        where bp.bill_id = v_existing.id;

        return jsonb_build_object(
          'is_replay', true,
          'bill', to_jsonb(v_existing),
          'participants', v_participants
        );
      end if;
      raise;
  end;

  if p_split_mode = 'EQUAL'::public.split_mode then
    v_base := p_total_cents / p_people;
    v_rem := p_total_cents % p_people;

    for v_pos in 1..p_people loop
      v_share := v_base + case when v_pos <= v_rem then 1 else 0 end;
      insert into public.bill_participants (bill_id, position, label, share_cents)
      values (v_bill.id, v_pos, 'Persona ' || v_pos, v_share);
    end loop;
  elsif p_split_mode = 'CUSTOM'::public.split_mode then
    v_pos := 0;
    for v_elem in select value from jsonb_array_elements(p_shares)
    loop
      v_pos := v_pos + 1;
      v_label := trim(coalesce(v_elem ->> 'label', ''));
      if v_label = '' then
        v_label := 'Persona ' || v_pos;
      end if;
      v_amount := (v_elem ->> 'amountCents')::integer;
      insert into public.bill_participants (bill_id, position, label, share_cents)
      values (v_bill.id, v_pos, left(v_label, 20), v_amount);
    end loop;
  end if;

  select coalesce(
    jsonb_agg(to_jsonb(bp) order by bp.position asc),
    '[]'::jsonb
  )
  into v_participants
  from public.bill_participants as bp
  where bp.bill_id = v_bill.id;

  return jsonb_build_object(
    'is_replay', false,
    'bill', to_jsonb(v_bill),
    'participants', v_participants
  );
end;
$$;

revoke execute on function public.create_bill(
  uuid,
  text,
  jsonb,
  integer,
  public.split_mode,
  text,
  text,
  integer,
  integer,
  jsonb
) from public, anon, authenticated;

grant execute on function public.create_bill(
  uuid,
  text,
  jsonb,
  integer,
  public.split_mode,
  text,
  text,
  integer,
  integer,
  jsonb
) to service_role;

create or replace function public.reserve_share(
  p_merchant_id uuid,
  p_bill_id uuid,
  p_participant_id uuid default null,
  p_amount_cents integer default null,
  p_label text default null,
  p_idempotency_key text default null,
  p_request_hash text default null,
  p_ttl_seconds integer default 600,
  p_max_live_shares integer default 2
)
returns public.charges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill public.bills;
  v_existing public.charges;
  v_participant public.bill_participants;
  v_live_count integer;
  v_confirmed_cents integer;
  v_reserved_cents integer;
  v_available_cents integer;
  v_target_participant_id uuid;
  v_amount_cents integer;
  v_clean_label text;
  v_next_pos integer;
  v_concept text;
  v_charge public.charges;
begin
  if p_merchant_id is null or p_bill_id is null then
    raise exception 'BILL_NOT_FOUND';
  end if;

  if coalesce(trim(p_idempotency_key), '') = '' or coalesce(trim(p_request_hash), '') = '' then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  -- Bloqueo exclusivo de fila de la cuenta para evitar sobrepagos o carreras
  select *
  into v_bill
  from public.bills
  where id = p_bill_id
    and merchant_id = p_merchant_id
  for update;

  if not found then
    raise exception 'BILL_NOT_FOUND';
  end if;

  -- Idempotencia (incluso si la cuenta ya avanzó o cerró)
  select *
  into v_existing
  from public.charges
  where merchant_id = p_merchant_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.bill_id is distinct from p_bill_id
      or v_existing.request_hash <> p_request_hash
    then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
    return v_existing;
  end if;

  if v_bill.status not in ('OPEN'::public.bill_status, 'PARTIALLY_PAID'::public.bill_status)
    or v_bill.expires_at <= now()
  then
    raise exception 'BILL_CLOSED';
  end if;

  -- Expira cobros vencidos de esta cuenta antes de contar cupo vivo o validar parte ocupada
  update public.charges
  set status = 'EXPIRED'::public.charge_status
  where bill_id = p_bill_id
    and status = 'AWAITING_PAYMENT'::public.charge_status
    and expires_at <= now();

  select count(*)::integer
  into v_live_count
  from public.charges
  where bill_id = p_bill_id
    and status in ('CREATING'::public.charge_status, 'AWAITING_PAYMENT'::public.charge_status);

  if v_live_count >= greatest(1, coalesce(p_max_live_shares, 2)) then
    raise exception 'TOO_MANY_LIVE_SHARES';
  end if;

  if v_bill.split_mode in ('EQUAL'::public.split_mode, 'CUSTOM'::public.split_mode) then
    if p_participant_id is null then
      raise exception 'PARTICIPANT_REQUIRED';
    end if;

    select *
    into v_participant
    from public.bill_participants
    where id = p_participant_id
      and bill_id = p_bill_id;

    if not found then
      raise exception 'PARTICIPANT_NOT_FOUND';
    end if;

    if exists (
      select 1
      from public.charges
      where participant_id = p_participant_id
        and status in (
          'CREATING'::public.charge_status,
          'AWAITING_PAYMENT'::public.charge_status,
          'CONFIRMED'::public.charge_status,
          'UNDER_REVIEW'::public.charge_status
        )
    ) then
      raise exception 'SHARE_IN_PROGRESS';
    end if;

    v_target_participant_id := v_participant.id;
    v_amount_cents := v_participant.share_cents;
    v_clean_label := coalesce(
      nullif(trim(v_participant.label), ''),
      'Persona ' || v_participant.position
    );
    v_concept := left(v_bill.concept || ' · ' || v_clean_label, 60);
  else
    -- Modo FREE
    if p_participant_id is not null then
      raise exception 'INVALID_PARTICIPANT_FOR_FREE';
    end if;

    if p_amount_cents is null or p_amount_cents < 100 then
      raise exception 'INVALID_SHARE_AMOUNT';
    end if;

    select coalesce(sum(amount_cents), 0)::integer
    into v_confirmed_cents
    from public.charges
    where bill_id = p_bill_id
      and status = 'CONFIRMED'::public.charge_status;

    select coalesce(sum(amount_cents), 0)::integer
    into v_reserved_cents
    from public.charges
    where bill_id = p_bill_id
      and status in ('CREATING'::public.charge_status, 'AWAITING_PAYMENT'::public.charge_status)
      and expires_at > now();

    v_available_cents := v_bill.total_cents - v_confirmed_cents - v_reserved_cents;

    if p_amount_cents > v_available_cents then
      raise exception 'AMOUNT_EXCEEDS_BALANCE';
    end if;

    select coalesce(max(position), 0) + 1
    into v_next_pos
    from public.bill_participants
    where bill_id = p_bill_id;

    v_clean_label := trim(coalesce(p_label, ''));
    if char_length(v_clean_label) > 20 then
      raise exception 'INVALID_PARTICIPANT_LABEL';
    end if;
    if v_clean_label = '' then
      v_clean_label := left('Aportación ' || v_next_pos, 20);
    end if;

    insert into public.bill_participants (bill_id, position, label, share_cents)
    values (p_bill_id, v_next_pos, v_clean_label, null)
    returning id into v_target_participant_id;

    v_amount_cents := p_amount_cents;
    v_concept := left(v_bill.concept || ' · ' || v_clean_label, 60);
  end if;

  insert into public.charges (
    merchant_id,
    amount_cents,
    currency,
    concept,
    items,
    status,
    idempotency_key,
    request_hash,
    expires_at,
    bill_id,
    participant_id
  )
  values (
    p_merchant_id,
    v_amount_cents,
    'MXN',
    v_concept,
    v_bill.items,
    'CREATING'::public.charge_status,
    p_idempotency_key,
    p_request_hash,
    now() + make_interval(secs => greatest(60, coalesce(p_ttl_seconds, 600))),
    p_bill_id,
    v_target_participant_id
  )
  returning * into v_charge;

  return v_charge;
end;
$$;

revoke execute on function public.reserve_share(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  text,
  text,
  integer,
  integer
) from public, anon, authenticated;

grant execute on function public.reserve_share(
  uuid,
  uuid,
  uuid,
  integer,
  text,
  text,
  text,
  integer,
  integer
) to service_role;

create or replace function public.recompute_bill(p_bill_id uuid)
returns public.bills
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill public.bills;
  v_collected integer;
  v_overpaid integer;
  v_next_status public.bill_status;
begin
  select *
  into v_bill
  from public.bills
  where id = p_bill_id
  for update;

  if not found then
    return null;
  end if;

  select coalesce(sum(amount_cents), 0)::integer
  into v_collected
  from public.charges
  where bill_id = p_bill_id
    and status = 'CONFIRMED'::public.charge_status;

  v_overpaid := greatest(v_collected - v_bill.total_cents, 0);

  if v_bill.status = 'CANCELLED'::public.bill_status then
    update public.bills
    set
      collected_cents = v_collected,
      overpaid_cents = v_overpaid
    where id = p_bill_id
    returning * into v_bill;
    return v_bill;
  end if;

  if v_collected >= v_bill.total_cents then
    v_next_status := 'PAID'::public.bill_status;
  elsif v_collected > 0 then
    v_next_status := 'PARTIALLY_PAID'::public.bill_status;
  elsif v_bill.status = 'EXPIRED'::public.bill_status then
    v_next_status := 'EXPIRED'::public.bill_status;
  else
    v_next_status := 'OPEN'::public.bill_status;
  end if;

  update public.bills
  set
    collected_cents = v_collected,
    overpaid_cents = v_overpaid,
    status = v_next_status,
    closed_at = case
      when v_next_status = 'PAID'::public.bill_status then coalesce(closed_at, now())
      else closed_at
    end
  where id = p_bill_id
  returning * into v_bill;

  return v_bill;
end;
$$;

revoke execute on function public.recompute_bill(uuid) from public, anon, authenticated;
grant execute on function public.recompute_bill(uuid) to service_role;

create or replace function public.trg_recompute_bill_on_charge_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recompute_bill(new.bill_id);
  return new;
end;
$$;

create trigger trg_charges_recompute_bill
  after update of status on public.charges
  for each row
  when (new.bill_id is not null and new.status is distinct from old.status)
  execute function public.trg_recompute_bill_on_charge_status();

create or replace function public.cancel_bill(
  p_merchant_id uuid,
  p_bill_id uuid
)
returns public.bills
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bill public.bills;
begin
  select *
  into v_bill
  from public.bills
  where id = p_bill_id
    and merchant_id = p_merchant_id
  for update;

  if not found then
    raise exception 'BILL_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.charges
    where bill_id = p_bill_id
      and status = 'CONFIRMED'::public.charge_status
  ) then
    raise exception 'BILL_HAS_CONFIRMED_PAYMENTS';
  end if;

  if v_bill.status = 'CANCELLED'::public.bill_status then
    return v_bill;
  end if;

  if v_bill.status in ('PAID'::public.bill_status, 'EXPIRED'::public.bill_status) then
    raise exception 'BILL_CLOSED';
  end if;

  update public.charges
  set
    status = case
      when status = 'AWAITING_PAYMENT'::public.charge_status then 'CANCELLED'::public.charge_status
      else 'FAILED'::public.charge_status
    end,
    failure_reason = coalesce(failure_reason, 'BILL_CANCELLED')
  where bill_id = p_bill_id
    and status in ('CREATING'::public.charge_status, 'AWAITING_PAYMENT'::public.charge_status);

  update public.bills
  set
    status = 'CANCELLED'::public.bill_status,
    closed_at = coalesce(closed_at, now())
  where id = p_bill_id
  returning * into v_bill;

  return v_bill;
end;
$$;

revoke execute on function public.cancel_bill(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_bill(uuid, uuid) to service_role;

create or replace function public.expire_stale_bills()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.bills as b
  set
    status = 'EXPIRED'::public.bill_status,
    closed_at = coalesce(b.closed_at, now())
  where b.status in ('OPEN'::public.bill_status, 'PARTIALLY_PAID'::public.bill_status)
    and b.expires_at <= now()
    and b.collected_cents < b.total_cents
    and not exists (
      select 1
      from public.charges as c
      where c.bill_id = b.id
        and c.status in ('CREATING'::public.charge_status, 'AWAITING_PAYMENT'::public.charge_status)
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.expire_stale_bills() from public, anon, authenticated;
grant execute on function public.expire_stale_bills() to service_role;

-- Lectura completa de la cuenta y estado de cada participante (RLS aplica vía security invoker)
create or replace function public.get_bill_detail(p_bill_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with target_bill as (
    select b.*
    from public.bills as b
    where b.id = p_bill_id
  ),
  participant_rows as (
    select
      bp.id,
      bp.bill_id,
      bp.position,
      bp.label,
      bp.share_cents,
      bp.created_at,
      ch.id as charge_id,
      ch.status as charge_status,
      ch.amount_cents as charge_amount_cents,
      ch.qr_payload as charge_qr_payload,
      ch.expires_at as charge_expires_at,
      ch.paid_at as charge_paid_at,
      ch.paid_after_expiry as charge_paid_after_expiry,
      ch.created_at as charge_created_at,
      case
        when ch.status = 'CONFIRMED'::public.charge_status then 'PAID'
        when ch.status = 'UNDER_REVIEW'::public.charge_status then 'REVIEW'
        when ch.status in ('CREATING'::public.charge_status, 'AWAITING_PAYMENT'::public.charge_status) then 'PAYING'
        else 'PENDING'
      end as state
    from public.bill_participants as bp
    join target_bill as tb on tb.id = bp.bill_id
    left join lateral (
      select c.*
      from public.charges as c
      where c.participant_id = bp.id
        and c.bill_id = tb.id
      order by
        case c.status
          when 'CONFIRMED'::public.charge_status then 1
          when 'UNDER_REVIEW'::public.charge_status then 2
          when 'AWAITING_PAYMENT'::public.charge_status then 3
          when 'CREATING'::public.charge_status then 4
          else 5
        end,
        c.created_at desc
      limit 1
    ) as ch on true
    order by bp.position asc
  )
  select
    case
      when not exists (select 1 from target_bill) then null
      else jsonb_build_object(
        'bill', (select to_jsonb(tb) from target_bill as tb),
        'participants', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', pr.id,
                'bill_id', pr.bill_id,
                'position', pr.position,
                'label', pr.label,
                'share_cents', pr.share_cents,
                'created_at', pr.created_at,
                'state', pr.state,
                'paid_at', pr.charge_paid_at,
                'charge', case
                  when pr.charge_id is null then null
                  else jsonb_build_object(
                    'id', pr.charge_id,
                    'status', pr.charge_status,
                    'amount_cents', pr.charge_amount_cents,
                    'qr_payload', pr.charge_qr_payload,
                    'expires_at', pr.charge_expires_at,
                    'paid_at', pr.charge_paid_at,
                    'paid_after_expiry', pr.charge_paid_after_expiry,
                    'created_at', pr.charge_created_at
                  )
                end
              )
              order by pr.position asc
            )
            from participant_rows as pr
          ),
          '[]'::jsonb
        )
      )
    end;
$$;

revoke execute on function public.get_bill_detail(uuid) from public, anon;
grant execute on function public.get_bill_detail(uuid) to authenticated;
