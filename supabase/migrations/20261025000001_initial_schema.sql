-- ==============================================================================
-- Migration: 20261025000001_initial_schema.sql
-- Description: Honda Mega Persada Mandiri Digital Showroom Initial V1 Schema
-- ==============================================================================

-- 1. Utilities and Trigger Functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Staff Profiles (Unified V1 Admin Role)
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'admin' check (role in ('admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function public.set_updated_at();

-- 3. Security Helper Function (Hardened Security Definer)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles
    where user_id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 4. Product Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- 5. Motorcycle Models
create table if not exists public.motorcycle_models (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text unique not null,
  short_description text null,
  description text null,
  engine_cc integer null check (engine_cc is null or engine_cc > 0),
  transmission text null,
  key_specs jsonb not null default '{}'::jsonb,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo_title text null,
  seo_description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null
);

create index idx_models_category on public.motorcycle_models(category_id);
create index idx_models_status_published on public.motorcycle_models(status, published_at desc);

create trigger trg_motorcycle_models_updated_at
  before update on public.motorcycle_models
  for each row execute function public.set_updated_at();

-- 6. Motorcycle Variants
create table if not exists public.motorcycle_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.motorcycle_models(id) on delete cascade,
  name text not null,
  code text null,
  description text null,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_model_variant_name unique (model_id, name)
);

create index idx_variants_model_sort on public.motorcycle_variants(model_id, sort_order);

create trigger trg_motorcycle_variants_updated_at
  before update on public.motorcycle_variants
  for each row execute function public.set_updated_at();

-- 7. Colors
create table if not exists public.colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  hex_code text null check (hex_code is null or hex_code ~* '^#[0-9a-f]{6}$'),
  created_at timestamptz not null default now()
);

-- 8. Variant Colors Junction
create table if not exists public.variant_colors (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.motorcycle_variants(id) on delete cascade,
  color_id uuid not null references public.colors(id) on delete restrict,
  image_path text null,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  constraint uq_variant_color unique (variant_id, color_id)
);

create index idx_variant_colors_variant on public.variant_colors(variant_id);

-- 9. Model Images
create table if not exists public.model_images (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.motorcycle_models(id) on delete cascade,
  variant_id uuid null references public.motorcycle_variants(id) on delete cascade,
  color_id uuid null references public.colors(id) on delete set null,
  storage_path text not null,
  alt_text text not null,
  image_role text not null default 'gallery' check (image_role in ('hero', 'card', 'gallery', 'color')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_model_images_model_role on public.model_images(model_id, image_role, sort_order);

-- 10. Price Entries
create table if not exists public.price_entries (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.motorcycle_variants(id) on delete cascade,
  city text null,
  branch_id uuid null,
  price_type text not null default 'otr' check (price_type in ('otr', 'cash', 'promo')),
  amount_idr bigint not null check (amount_idr >= 0),
  valid_from date not null,
  valid_until date null check (valid_until is null or valid_until >= valid_from),
  is_published boolean not null default true,
  source_note text null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_price_entries_lookup on public.price_entries(variant_id, city, valid_from desc);

create trigger trg_price_entries_updated_at
  before update on public.price_entries
  for each row execute function public.set_updated_at();

-- 11. Promotions
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text not null,
  details text null,
  image_path text null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  terms text null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  cta_label text null,
  cta_url text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_promotions_active on public.promotions(status, starts_at, ends_at);

create trigger trg_promotions_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

-- 12. Promotion Models Junction
create table if not exists public.promotion_models (
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  model_id uuid not null references public.motorcycle_models(id) on delete cascade,
  primary key (promotion_id, model_id)
);

-- 13. Hero Banners
create table if not exists public.hero_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text null,
  desktop_image_path text not null,
  mobile_image_path text null,
  alt_text text not null,
  cta_label text null,
  cta_url text null,
  starts_at timestamptz null,
  ends_at timestamptz null check (ends_at is null or starts_at is null or ends_at > starts_at),
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_hero_banners_status_sort on public.hero_banners(status, sort_order);

create trigger trg_hero_banners_updated_at
  before update on public.hero_banners
  for each row execute function public.set_updated_at();

-- 14. Customer Leads (Customer personal data, protected)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  lead_reference text unique not null,
  full_name text not null,
  whatsapp_number text not null,
  email text null,
  city text not null,
  district text null,
  model_id uuid null references public.motorcycle_models(id) on delete set null,
  variant_id uuid null references public.motorcycle_variants(id) on delete set null,
  color_id uuid null references public.colors(id) on delete set null,
  model_name_snapshot text null,
  variant_name_snapshot text null,
  color_name_snapshot text null,
  price_snapshot_idr bigint null,
  credit_down_payment_idr bigint null,
  credit_tenor_months integer null,
  credit_estimated_installment_idr bigint null,
  credit_config_snapshot jsonb null,
  message text null,
  source_page text null,
  source_campaign text null,
  consent_privacy_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'follow_up', 'converted', 'not_interested', 'unreachable', 'duplicate', 'invalid')),
  assigned_to uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz null
);

create index idx_leads_status_created on public.leads(status, created_at desc);
create index idx_leads_city on public.leads(city);
create index idx_leads_model on public.leads(model_id);
create index idx_leads_assigned_status on public.leads(assigned_to, status);

create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- 15. Site Settings (Singleton pattern)
create table if not exists public.site_settings (
  id text primary key default 'default' check (id = 'default'),
  dealer_name text not null,
  logo_path text null,
  address text null,
  city text null,
  phone text null,
  whatsapp_number text not null,
  public_email text null,
  opening_hours jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  privacy_notice text not null,
  updated_by uuid null references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- 16. Audit Logs (Protected audit records)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_created on public.audit_logs(created_at desc);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);

-- Prevent modification, deletion, and truncation of audit logs
create or replace function public.prevent_audit_log_modification()
returns trigger
language plpgsql
security invoker
as $$
begin
  raise exception 'Audit log entries cannot be modified, deleted, or truncated.';
end;
$$;

create trigger trg_audit_logs_prevent_modification
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_log_modification();

create trigger trg_audit_logs_prevent_truncate
  before truncate on public.audit_logs
  for each statement execute function public.prevent_audit_log_modification();

-- Explicitly revoke modification and truncation privileges from application and service roles
revoke update, delete on public.audit_logs from public, anon, authenticated;
revoke truncate on public.audit_logs from public, anon, authenticated, service_role;

-- ==============================================================================
-- 17. Row Level Security (RLS) Enablement
-- ==============================================================================
alter table public.staff_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.motorcycle_models enable row level security;
alter table public.motorcycle_variants enable row level security;
alter table public.colors enable row level security;
alter table public.variant_colors enable row level security;
alter table public.model_images enable row level security;
alter table public.price_entries enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_models enable row level security;
alter table public.hero_banners enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- ==============================================================================
-- 18. Row Level Security Policies
-- ==============================================================================

-- Staff Profiles
create policy "Admins can manage staff profiles"
  on public.staff_profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Staff can read own profile"
  on public.staff_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Categories
create policy "Public can view active categories"
  on public.categories
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Admins can manage categories"
  on public.categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Motorcycle Models
create policy "Public can view published models"
  on public.motorcycle_models
  for select
  to anon, authenticated
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
  );

create policy "Admins can manage models"
  on public.motorcycle_models
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Motorcycle Variants
create policy "Public can view active variants of published models"
  on public.motorcycle_variants
  for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1
      from public.motorcycle_models m
      where m.id = motorcycle_variants.model_id
        and m.status = 'published'
        and (m.published_at is null or m.published_at <= now())
    )
  );

create policy "Admins can manage variants"
  on public.motorcycle_variants
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Colors
create policy "Public can view colors"
  on public.colors
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage colors"
  on public.colors
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Variant Colors Junction
create policy "Public can view available variant colors"
  on public.variant_colors
  for select
  to anon, authenticated
  using (
    is_available = true
    and exists (
      select 1
      from public.motorcycle_variants v
      join public.motorcycle_models m on m.id = v.model_id
      where v.id = variant_colors.variant_id
        and v.status = 'active'
        and m.status = 'published'
        and (m.published_at is null or m.published_at <= now())
    )
  );

create policy "Admins can manage variant colors"
  on public.variant_colors
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Model Images
create policy "Public can view published model images"
  on public.model_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.motorcycle_models m
      where m.id = model_images.model_id
        and m.status = 'published'
        and (m.published_at is null or m.published_at <= now())
    )
  );

create policy "Admins can manage model images"
  on public.model_images
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Price Entries
create policy "Public can view valid published prices"
  on public.price_entries
  for select
  to anon, authenticated
  using (
    is_published = true
    and valid_from <= current_date
    and (valid_until is null or valid_until >= current_date)
    and exists (
      select 1
      from public.motorcycle_variants v
      join public.motorcycle_models m on m.id = v.model_id
      where v.id = price_entries.variant_id
        and v.status = 'active'
        and m.status = 'published'
        and (m.published_at is null or m.published_at <= now())
    )
  );

create policy "Admins can manage price entries"
  on public.price_entries
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Promotions
create policy "Public can view active promotions"
  on public.promotions
  for select
  to anon, authenticated
  using (
    status = 'published'
    and starts_at <= now()
    and ends_at >= now()
  );

create policy "Admins can manage promotions"
  on public.promotions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Promotion Models Junction
create policy "Public can view models in active promotions"
  on public.promotion_models
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.promotions p
      where p.id = promotion_models.promotion_id
        and p.status = 'published'
        and p.starts_at <= now()
        and p.ends_at >= now()
    )
  );

create policy "Admins can manage promotion models"
  on public.promotion_models
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Hero Banners
create policy "Public can view active hero banners"
  on public.hero_banners
  for select
  to anon, authenticated
  using (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Admins can manage hero banners"
  on public.hero_banners
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Site Settings
create policy "Public can view site settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy "Admins can manage site settings"
  on public.site_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Leads (Strict Protection: Anonymous cannot select or arbitrarily insert)
create policy "Admins can read leads"
  on public.leads
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert leads"
  on public.leads
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update leads"
  on public.leads
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete leads"
  on public.leads
  for delete
  to authenticated
  using (public.is_admin());

-- Audit Logs (Strict Protection: Immutable and Admin-only)
create policy "Admins can view audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can create audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (public.is_admin());
