-- NemiPay: ampliar tabla merchants con datos del titular, teléfono, cuenta CLABE y preferencias de notificación

alter table public.merchants
  add column if not exists owner_name text
    check (owner_name is null or char_length(trim(owner_name)) between 1 and 60),
  add column if not exists phone text
    check (phone is null or char_length(trim(phone)) between 8 and 20),
  add column if not exists clabe text
    check (clabe is null or clabe ~ '^[0-9]{18}$'),
  add column if not exists bank_name text
    check (bank_name is null or char_length(trim(bank_name)) between 1 and 40),
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists voice_announcements_enabled boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists set_merchants_updated_at on public.merchants;
create trigger set_merchants_updated_at
  before update on public.merchants
  for each row
  execute function public.set_updated_at();
