-- ==============================================================================
-- Honda Satrya Dealer Group — Milestone 7 Step 1: Settings Management
-- Migration: 20261104000001_create_dealerships_and_seed_settings.sql
-- ==============================================================================

-- 1. Seed default singleton row for group-level site_settings if not present
insert into public.site_settings (
  id,
  dealer_name,
  logo_path,
  address,
  city,
  phone,
  whatsapp_number,
  public_email,
  opening_hours,
  social_links,
  privacy_notice
) values (
  'default',
  'Honda Satrya Dealer Group',
  null,
  null,
  null,
  null,
  '6281234567890',
  'info@satryagroup.co.id',
  '{"consultation_hours": "Senin - Sabtu: 08:00 - 17:00 WIB"}'::jsonb,
  '{"instagram": "https://instagram.com/hondasatryagroup"}'::jsonb,
  'Kebijakan Privasi Honda Satrya Dealer Group: Kami berkomitmen untuk melindungi dan menghargai privasi data pribadi pelanggan sesuai peraturan perundang-undangan yang berlaku di Indonesia.'
)
on conflict (id) do nothing;

-- 2. Create dealerships table to decouple individual dealership locations from group settings
create table if not exists public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  city text not null,
  address text null,
  phone text null,
  whatsapp_number text null,
  opening_hours text null,
  is_synthetic boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for ordering and filtering
create index if not exists idx_dealerships_sort on public.dealerships(sort_order asc, name asc);
create index if not exists idx_dealerships_city on public.dealerships(city);

-- Trigger for auto updated_at
create trigger trg_dealerships_updated_at
  before update on public.dealerships
  for each row execute function public.set_updated_at();

-- 3. Row Level Security for dealerships
alter table public.dealerships enable row level security;

-- Public can view active dealerships
create policy "Public can read active dealerships"
  on public.dealerships
  for select
  to anon, authenticated
  using (is_active = true);

-- Admins can manage dealerships
create policy "Admins can manage dealerships"
  on public.dealerships
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Revoke dangerous privileges and grant explicit CRUD
revoke all on table public.dealerships from public, anon;
grant select on table public.dealerships to anon;
grant select, insert, update, delete on table public.dealerships to authenticated, service_role;

-- 4. Seed 3 synthetic dealership records (clearly identified as demo data, missing official info unset)
insert into public.dealerships (
  id,
  name,
  code,
  city,
  address,
  phone,
  whatsapp_number,
  opening_hours,
  is_synthetic,
  is_active,
  sort_order
) values
  (
    'd1111111-1111-4111-a111-111111111111',
    '[DEMO] Honda Satrya — Sidoarjo Sentral',
    'demo-satrya-sidoarjo',
    'Sidoarjo',
    null,
    null,
    null,
    null,
    true,
    true,
    1
  ),
  (
    'd2222222-2222-4222-a222-222222222222',
    '[DEMO] Honda Satrya — Surabaya Selatan',
    'demo-satrya-surabaya',
    'Surabaya',
    null,
    null,
    null,
    null,
    true,
    true,
    2
  ),
  (
    'd3333333-3333-4333-a333-333333333333',
    '[DEMO] Honda Satrya — Gresik Kota',
    'demo-satrya-gresik',
    'Gresik',
    null,
    null,
    null,
    null,
    true,
    true,
    3
  )
on conflict (code) do nothing;

