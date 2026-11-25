-- NemiPay: funciones SQL (apply_charge_transition, charges_today, daily_summary)

create or replace function public.apply_charge_transition(
  p_charge_id uuid,
  p_to public.charge_status,
  p_pey_reference text default null,
  p_pey_transaction_id text default null,
  p_qr_payload text default null,
  p_paid_at timestamptz default null,
  p_failure_reason text default null
)
returns public.charges
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_allowed_from public.charge_status[];
  v_row public.charges;
begin
  case p_to
    when 'AWAITING_PAYMENT' then
      v_allowed_from := array['CREATING'::public.charge_status];
    when 'FAILED' then
      v_allowed_from := array['CREATING'::public.charge_status];
    when 'CONFIRMED' then
      v_allowed_from := array[
        'AWAITING_PAYMENT'::public.charge_status,
        'EXPIRED'::public.charge_status,
        'CANCELLED'::public.charge_status
      ];
    when 'EXPIRED' then
      v_allowed_from := array['AWAITING_PAYMENT'::public.charge_status];
    when 'CANCELLED' then
      v_allowed_from := array['AWAITING_PAYMENT'::public.charge_status];
    when 'UNDER_REVIEW' then
      v_allowed_from := array['AWAITING_PAYMENT'::public.charge_status];
    else
      v_allowed_from := array[]::public.charge_status[];
  end case;

  if cardinality(v_allowed_from) > 0 then
    update public.charges
    set
      status = p_to,
      pey_reference = coalesce(p_pey_reference, pey_reference),
      pey_transaction_id = coalesce(p_pey_transaction_id, pey_transaction_id),
      qr_payload = coalesce(p_qr_payload, qr_payload),
      paid_at = case
        when p_to = 'CONFIRMED'::public.charge_status then coalesce(p_paid_at, now())
        else paid_at
      end,
      paid_after_expiry = case
        when p_to = 'CONFIRMED'::public.charge_status
          and (
            status in ('EXPIRED'::public.charge_status, 'CANCELLED'::public.charge_status)
            or now() > expires_at
          )
        then true
        else paid_after_expiry
      end,
      failure_reason = coalesce(p_failure_reason, failure_reason)
    where id = p_charge_id
      and status = any(v_allowed_from)
    returning * into v_row;

    if found then
      return v_row;
    end if;
  end if;

  -- Idempotente ante transiciones repetidas o prohibidas: devuelve la fila actual sin error
  select *
  into v_row
  from public.charges
  where id = p_charge_id;

  return v_row;
end;
$$;

revoke execute on function public.apply_charge_transition(
  uuid,
  public.charge_status,
  text,
  text,
  text,
  timestamptz,
  text
) from public, anon, authenticated;

grant execute on function public.apply_charge_transition(
  uuid,
  public.charge_status,
  text,
  text,
  text,
  timestamptz,
  text
) to service_role;

-- Cobros del día en zona horaria America/Mexico_City (RLS aplica vía security invoker)
create or replace function public.charges_today()
returns setof public.charges
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.charges as c
  where (c.created_at at time zone 'America/Mexico_City')::date
      = (now() at time zone 'America/Mexico_City')::date
  order by c.created_at desc;
$$;

revoke execute on function public.charges_today() from public, anon;
grant execute on function public.charges_today() to authenticated;

-- Corte del día: suma y conteo de cobros confirmados hoy (America/Mexico_City)
create or replace function public.daily_summary()
returns table (
  total_confirmed_cents bigint,
  count_confirmed bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(c.amount_cents), 0)::bigint as total_confirmed_cents,
    count(*)::bigint as count_confirmed
  from public.charges as c
  where c.status = 'CONFIRMED'::public.charge_status
    and (c.created_at at time zone 'America/Mexico_City')::date
      = (now() at time zone 'America/Mexico_City')::date;
$$;

revoke execute on function public.daily_summary() from public, anon;
grant execute on function public.daily_summary() to authenticated;
