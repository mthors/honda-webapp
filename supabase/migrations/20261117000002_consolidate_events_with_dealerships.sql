-- ==============================================================================
-- Honda Satrya Dealer Group — Milestone 12 Consolidation:
-- Consolidate Event Location with Canonical Dealerships Entity
-- Migration: 20261117000002_consolidate_events_with_dealerships.sql
-- ==============================================================================

-- 1. Safely remove the approved temporary test event using its exact UUID
delete from public.events
where id = '4fc4b913-fa54-4d6a-bf90-bc8cb51539c6'
  and title = 'Test acara';

-- 2. Add dealership_id foreign key column to public.events referencing public.dealerships(id)
alter table public.events
  add column if not exists dealership_id uuid references public.dealerships(id) on delete restrict;

-- 3. Verify no unmapped events remain before applying NOT NULL constraint
do $$
declare
  unmapped_count integer;
begin
  select count(*) into unmapped_count
  from public.events
  where dealership_id is null;

  if unmapped_count > 0 then
    raise exception 'Migration aborted: % event(s) have no mapped dealership_id. Resolve unmapped events before applying NOT NULL constraint.', unmapped_count;
  end if;
end $$;

-- 4. Enforce NOT NULL constraint on dealership_id
alter table public.events
  alter column dealership_id set not null;

-- 5. Create performance index for dealership joins and lookups
create index if not exists idx_events_dealership on public.events(dealership_id);

-- 6. Explicitly remove all objects dependent on events.location_id and dealer_locations BEFORE dropping column
-- 6a. Drop the cross-table RLS policy on dealer_locations that references events.location_id
drop policy if exists "Public can view active dealer locations for published events" on public.dealer_locations;

-- 6b. Drop admin policy, triggers, and indexes on dealer_locations
drop policy if exists "Admins can manage dealer locations" on public.dealer_locations;
drop trigger if exists trg_dealer_locations_updated_at on public.dealer_locations;
drop index if exists public.idx_dealer_locations_city;
drop index if exists public.idx_dealer_locations_active;

-- 6c. Drop the foreign key constraint and index on events referencing dealer_locations
alter table public.events
  drop constraint if exists events_location_id_fkey;

drop index if exists public.idx_events_location;

-- 6d. Drop the redundant dealer_locations table (without CASCADE)
drop table if exists public.dealer_locations;

-- 6e. Now safely drop the legacy location_id column from events (all dependencies have been removed)
alter table public.events
  drop column if exists location_id;
