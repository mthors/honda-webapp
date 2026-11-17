-- ==============================================================================
-- Honda Satrya Dealer Group — Milestone 12: Event Calendar & Management CMS
-- Migration: 20261117000001_create_events_and_dealer_locations.sql
-- ==============================================================================

-- 1. Create dealer_locations table
create table if not exists public.dealer_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  phone text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for ordering and filtering dealer locations
create index if not exists idx_dealer_locations_city on public.dealer_locations(city);
create index if not exists idx_dealer_locations_active on public.dealer_locations(is_active);

-- Auto-update trigger for dealer_locations
create trigger trg_dealer_locations_updated_at
  before update on public.dealer_locations
  for each row execute function public.set_updated_at();

-- 2. Create events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text not null,
  location_id uuid not null references public.dealer_locations(id) on delete restrict,
  start_at timestamptz not null,
  end_at timestamptz not null,
  image_url text null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_events_dates check (end_at > start_at)
);

-- Indexes for events query performance
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_location on public.events(location_id);
create index if not exists idx_events_publication on public.events(status, start_at asc);
create index if not exists idx_events_date_range on public.events(start_at asc, end_at asc);

-- Auto-update trigger for events
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- 3. Row Level Security (RLS) Configuration

alter table public.dealer_locations enable row level security;
alter table public.events enable row level security;

-- 3a. Public can read active dealer locations that are associated with published events
create policy "Public can view active dealer locations for published events"
  on public.dealer_locations
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.events e
      where e.location_id = dealer_locations.id
        and e.status = 'published'
    )
  );

-- 3b. Admins can view and manage all dealer locations
create policy "Admins can manage dealer locations"
  on public.dealer_locations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3c. Public can read published events
create policy "Public can view published events"
  on public.events
  for select
  to anon, authenticated
  using (status = 'published');

-- 3d. Admins can view and manage all events (draft & published)
create policy "Admins can manage events"
  on public.events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Revoke all direct privileges and grant granular access
revoke all on table public.dealer_locations from public, anon;
revoke all on table public.events from public, anon;

grant select on table public.dealer_locations to anon;
grant select on table public.events to anon;

grant select, insert, update, delete on table public.dealer_locations to authenticated, service_role;
grant select, insert, update, delete on table public.events to authenticated, service_role;

-- 4. Provision dedicated events storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'events',
  'events',
  true,
  5242880, -- 5 MB max per event poster image
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS for events bucket
drop policy if exists "Public can view event images" on storage.objects;
create policy "Public can view event images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'events');

drop policy if exists "Admins can upload event images" on storage.objects;
create policy "Admins can upload event images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'events'
    and public.is_admin()
  );

drop policy if exists "Admins can update event images" on storage.objects;
create policy "Admins can update event images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'events'
    and public.is_admin()
  )
  with check (
    bucket_id = 'events'
    and public.is_admin()
  );

drop policy if exists "Admins can delete event images" on storage.objects;
create policy "Admins can delete event images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'events'
    and public.is_admin()
  );
