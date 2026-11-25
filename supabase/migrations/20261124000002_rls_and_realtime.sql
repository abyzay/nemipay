-- NemiPay: Row Level Security (RLS), revocación de privilegios y publicación Realtime

alter table public.merchants enable row level security;
alter table public.products enable row level security;
alter table public.charges enable row level security;
alter table public.webhook_events enable row level security;

-- Revocar todo acceso anónimo
revoke all on public.merchants from anon;
revoke all on public.products from anon;
revoke all on public.charges from anon;
revoke all on public.webhook_events from anon;

-- El cliente autenticado nunca puede escribir en charges ni leer/escribir webhook_events
revoke insert, update, delete on public.charges from authenticated;
revoke all on public.webhook_events from authenticated;
revoke insert, delete on public.merchants from authenticated;
revoke delete on public.products from authenticated;

-- merchants: lectura y edición solo del propio comercio
create policy "merchants_select_own"
  on public.merchants
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "merchants_update_own"
  on public.merchants
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- products: lectura, creación y edición (incluye borrado lógico active=false) solo del propio comercio
create policy "products_select_own"
  on public.products
  for select
  to authenticated
  using (merchant_id = (select auth.uid()));

create policy "products_insert_own"
  on public.products
  for insert
  to authenticated
  with check (merchant_id = (select auth.uid()));

create policy "products_update_own"
  on public.products
  for update
  to authenticated
  using (merchant_id = (select auth.uid()))
  with check (merchant_id = (select auth.uid()));

-- charges: solo lectura del propio comercio (escritura exclusiva vía Edge Functions + service_role)
create policy "charges_select_own"
  on public.charges
  for select
  to authenticated
  using (merchant_id = (select auth.uid()));

-- Realtime: los suscriptores reciben cambios en charges filtrados automáticamente por RLS
alter publication supabase_realtime add table public.charges;
