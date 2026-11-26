-- Limita globalmente la división de cuenta a máximo 4 personas en create_bill.

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
    if p_people is null or p_people < 2 or p_people > 4 then
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
      or jsonb_array_length(p_shares) > 4
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
