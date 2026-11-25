-- NemiPay: esquema inicial (tablas, restricciones, índices y triggers updated_at)

create type public.charge_status as enum (
  'CREATING',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'EXPIRED',
  'FAILED',
  'CANCELLED',
  'UNDER_REVIEW'
);

create table public.merchants (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

-- Producto o servicio. Agnóstico al giro: sin categoría, imagen, icono ni inventario.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  price_cents integer not null check (price_cents >= 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_merchant_active_idx
  on public.products (merchant_id, active);

create table public.charges (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id),
  amount_cents integer not null check (amount_cents >= 100),
  currency text not null default 'MXN',
  concept text not null,
  items jsonb,
  status public.charge_status not null default 'CREATING',
  idempotency_key text not null,
  request_hash text not null,
  pey_reference text unique,
  pey_transaction_id text unique,
  qr_payload text,
  expires_at timestamptz not null,
  paid_at timestamptz,
  paid_after_expiry boolean not null default false,
  failure_reason text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (merchant_id, idempotency_key)
);

create index charges_merchant_created_at_idx
  on public.charges (merchant_id, created_at desc);

create index charges_status_created_at_idx
  on public.charges (status, created_at);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  webhook_id text not null unique,
  type text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

create trigger set_charges_updated_at
  before update on public.charges
  for each row
  execute function public.set_updated_at();
