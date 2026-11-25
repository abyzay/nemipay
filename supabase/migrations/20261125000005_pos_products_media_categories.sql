-- NemiPay: tabla de categorías POS, soporte de imágenes WebP, descripción y relación producto-categoría

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 32),
  description text check (description is null or char_length(description) <= 160),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_merchant_active_idx
  on public.categories (merchant_id, active);

create unique index if not exists categories_merchant_unique_active_name_idx
  on public.categories (merchant_id, lower(trim(name)))
  where active = true;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

alter table public.categories enable row level security;

revoke all on public.categories from anon;
revoke delete on public.categories from authenticated;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
  on public.categories
  for select
  to authenticated
  using (merchant_id = (select auth.uid()));

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
  on public.categories
  for insert
  to authenticated
  with check (merchant_id = (select auth.uid()));

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
  on public.categories
  for update
  to authenticated
  using (merchant_id = (select auth.uid()))
  with check (merchant_id = (select auth.uid()));

alter table public.products
  add column if not exists description text
    check (description is null or char_length(description) <= 160),
  add column if not exists category text not null default 'General'
    check (char_length(trim(category)) between 1 and 32),
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists image_url text;

create index if not exists products_merchant_active_category_idx
  on public.products (merchant_id, active, category);

create index if not exists products_merchant_active_category_id_idx
  on public.products (merchant_id, active, category_id);

-- Bucket público de solo lectura para fotos comprimidas (WebP/JPEG/PNG); escritura restringida por auth.uid()
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'product-images');

drop policy if exists "product_images_insert_own" on storage.objects;
create policy "product_images_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "product_images_update_own" on storage.objects;
create policy "product_images_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "product_images_delete_own" on storage.objects;
create policy "product_images_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
