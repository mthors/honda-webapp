-- ==============================================================================
-- Honda Satrya Dealer Group — Feature: Location-Based Sales Contact Management
-- Migration: 20261119000001_create_sales_management_and_service_areas.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Geographical Area Tables: provinces & regencies (Kabupaten/Kota)
-- ------------------------------------------------------------------------------

create table if not exists public.provinces (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_provinces_sort on public.provinces(sort_order asc, name asc);

create trigger trg_provinces_updated_at
  before update on public.provinces
  for each row execute function public.set_updated_at();

alter table public.provinces enable row level security;

create policy "Public can read active provinces"
  on public.provinces
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage provinces"
  on public.provinces
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.provinces from public, anon;
grant select on table public.provinces to anon;
grant select, insert, update, delete on table public.provinces to authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Regencies / Cities (Kabupaten & Kota)
-- ------------------------------------------------------------------------------

create table if not exists public.regencies (
  id text primary key,
  province_id text not null references public.provinces(id) on delete restrict,
  name text not null,
  type text not null check (type in ('kabupaten', 'kota')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_regencies_province_name unique (province_id, name)
);

create index if not exists idx_regencies_province on public.regencies(province_id, is_active);
create index if not exists idx_regencies_sort on public.regencies(sort_order asc, name asc);

create trigger trg_regencies_updated_at
  before update on public.regencies
  for each row execute function public.set_updated_at();

alter table public.regencies enable row level security;

create policy "Public can read active regencies"
  on public.regencies
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage regencies"
  on public.regencies
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.regencies from public, anon;
grant select on table public.regencies to anon;
grant select, insert, update, delete on table public.regencies to authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. Dealership Service Areas (Many-to-Many: Dealership <-> Regency)
-- ------------------------------------------------------------------------------

create table if not exists public.dealership_service_areas (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  regency_id text not null references public.regencies(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_dealership_regency unique (dealership_id, regency_id)
);

create index if not exists idx_service_areas_dealership on public.dealership_service_areas(dealership_id);
create index if not exists idx_service_areas_regency on public.dealership_service_areas(regency_id) where is_active = true;

create trigger trg_dealership_service_areas_updated_at
  before update on public.dealership_service_areas
  for each row execute function public.set_updated_at();

alter table public.dealership_service_areas enable row level security;

create policy "Public can read active service areas"
  on public.dealership_service_areas
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.dealerships d
      where d.id = dealership_id and d.is_active = true
    )
  );

create policy "Admins can manage service areas"
  on public.dealership_service_areas
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.dealership_service_areas from public, anon;
grant select on table public.dealership_service_areas to anon;
grant select, insert, update, delete on table public.dealership_service_areas to authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. Sales Representatives (Belongs to exactly one dealership)
-- ------------------------------------------------------------------------------

create table if not exists public.sales_representatives (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete restrict,
  name text not null,
  whatsapp_number text not null,
  photo_url text null,
  position text null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sales_reps_dealership on public.sales_representatives(dealership_id) where is_active = true;
create index if not exists idx_sales_reps_sort on public.sales_representatives(sort_order asc, name asc);

create trigger trg_sales_representatives_updated_at
  before update on public.sales_representatives
  for each row execute function public.set_updated_at();

alter table public.sales_representatives enable row level security;

create policy "Public can read active sales reps"
  on public.sales_representatives
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.dealerships d
      where d.id = dealership_id and d.is_active = true
    )
  );

create policy "Admins can manage sales reps"
  on public.sales_representatives
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.sales_representatives from public, anon;
grant select on table public.sales_representatives to anon;
grant select, insert, update, delete on table public.sales_representatives to authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. Storage Bucket: sales-reps
-- ------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sales-reps',
  'sales-reps',
  true,
  3145728, -- 3 MB max per photo
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS for sales-reps bucket
drop policy if exists "Public can view sales rep photos" on storage.objects;
create policy "Public can view sales rep photos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'sales-reps');

drop policy if exists "Admins can upload sales rep photos" on storage.objects;
create policy "Admins can upload sales rep photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'sales-reps'
    and public.is_admin()
  );

drop policy if exists "Admins can update sales rep photos" on storage.objects;
create policy "Admins can update sales rep photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'sales-reps'
    and public.is_admin()
  )
  with check (
    bucket_id = 'sales-reps'
    and public.is_admin()
  );

drop policy if exists "Admins can delete sales rep photos" on storage.objects;
create policy "Admins can delete sales rep photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'sales-reps'
    and public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 6. Initial Geographical Reference Seed: Jawa Timur Operational Regions
-- (Do not seed fake sales representatives or fake service areas)
-- ------------------------------------------------------------------------------

insert into public.provinces (id, name, sort_order, is_active)
values
  ('jawa-timur', 'Jawa Timur', 1, true)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.regencies (id, province_id, name, type, sort_order, is_active)
values
  ('kab-sidoarjo', 'jawa-timur', 'Kabupaten Sidoarjo', 'kabupaten', 1, true),
  ('kota-surabaya', 'jawa-timur', 'Kota Surabaya', 'kota', 2, true),
  ('kab-gresik', 'jawa-timur', 'Kabupaten Gresik', 'kabupaten', 3, true),
  ('kab-mojokerto', 'jawa-timur', 'Kabupaten Mojokerto', 'kabupaten', 4, true),
  ('kota-mojokerto', 'jawa-timur', 'Kota Mojokerto', 'kota', 5, true),
  ('kab-pasuruan', 'jawa-timur', 'Kabupaten Pasuruan', 'kabupaten', 6, true),
  ('kota-pasuruan', 'jawa-timur', 'Kota Pasuruan', 'kota', 7, true),
  ('kab-malang', 'jawa-timur', 'Kabupaten Malang', 'kabupaten', 8, true),
  ('kota-malang', 'jawa-timur', 'Kota Malang', 'kota', 9, true),
  ('kab-jombang', 'jawa-timur', 'Kabupaten Jombang', 'kabupaten', 10, true),
  ('kab-lamongan', 'jawa-timur', 'Kabupaten Lamongan', 'kabupaten', 11, true),
  ('kab-bangkalan', 'jawa-timur', 'Kabupaten Bangkalan', 'kabupaten', 12, true)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
