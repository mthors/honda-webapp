# Database Schema Proposal

PostgreSQL schema proposal for V1. Use UUID primary keys, UTC timestamps
(`timestamptz`), explicit foreign keys, and migrations committed to Git.
Names can be adapted to repository conventions.

## 1. Entity relationship overview

``` text
categories 1 ─── * motorcycle_models 1 ─── * motorcycle_variants
                                         │          │
                                         │          ├── * variant_colors * ─── 1 colors
                                         │          └── * price_entries
                                         │
                                         ├── * model_images
                                         └── * promotion_models * ─── 1 promotions

hero_banners (independent, optionally linked to model/promotion)
leads * ─── 0..1 motorcycle_models
leads * ─── 0..1 motorcycle_variants
leads * ─── 0..1 colors
leads * ─── 0..1 auth.users (assigned staff)
staff_profiles 1 ─── 1 auth.users
site_settings (key/value or singleton settings row)
audit_logs * ─── 0..1 auth.users
```

## 2. Core tables

### `categories`

-   `id uuid primary key`
-   `name text not null`
-   `slug text unique not null`
-   `description text null`
-   `sort_order int not null default 0`
-   `is_active boolean not null default true`
-   `created_at`, `updated_at timestamptz not null default now()`

Examples: Matic, Cub/Bebek, Sport, EV, Big Bike. Only create categories
relevant to the dealership.

### `motorcycle_models`

-   `id uuid primary key`
-   `category_id uuid not null references categories(id)`
-   `name text not null`
-   `slug text unique not null`
-   `short_description text null`
-   `description text null`
-   `engine_cc int null`
-   `transmission text null`
-   `key_specs jsonb not null default '{}'`
-   `is_featured boolean not null default false`
-   `is_new boolean not null default false`
-   `status text not null check (status in ('draft','published','archived'))`
-   `seo_title text null`, `seo_description text null`
-   `created_at`, `updated_at`, `published_at timestamptz null`
-   Keep structured searchable fields in columns; use `key_specs` only
    for flexible secondary specifications.

### `motorcycle_variants`

-   `id uuid primary key`
-   `model_id uuid not null references motorcycle_models(id) on delete cascade`
-   `name text not null` (e.g. CBS, ABS, Standard)
-   `code text null`
-   `description text null`
-   `sort_order int not null default 0`
-   `status text not null check (status in ('active','inactive'))`
-   `created_at`, `updated_at timestamptz not null default now()`
-   Unique constraint on `(model_id, name)` where appropriate.

### `colors`

-   `id uuid primary key`
-   `name text not null`
-   `slug text unique not null`
-   `hex_code text null`
-   `created_at timestamptz not null default now()`
-   Color imagery can vary by model/variant, so do not store one global
    image as the only color representation.

### `variant_colors`

-   `id uuid primary key`
-   `variant_id uuid not null references motorcycle_variants(id) on delete cascade`
-   `color_id uuid not null references colors(id)`
-   `image_path text null`
-   `is_available boolean not null default true`
-   `sort_order int not null default 0`
-   Unique `(variant_id, color_id)`

### `model_images`

-   `id uuid primary key`
-   `model_id uuid not null references motorcycle_models(id) on delete cascade`
-   `variant_id uuid null references motorcycle_variants(id) on delete cascade`
-   `color_id uuid null references colors(id)`
-   `storage_path text not null`
-   `alt_text text not null`
-   `image_role text not null default 'gallery' check (image_role in ('hero','card','gallery','color'))`
-   `sort_order int not null default 0`
-   `created_at timestamptz not null default now()`

Store object paths rather than expiring signed URLs. Public catalog
images can live in a public bucket; lead attachments, if ever added,
should use private storage.

### `price_entries`

-   `id uuid primary key`
-   `variant_id uuid not null references motorcycle_variants(id) on delete cascade`
-   `city text null` (e.g. Sidoarjo; use normalized city/regency table
    later if many locations)
-   `branch_id uuid null` (only add a branches table if the business
    truly has multiple branches)
-   `price_type text not null default 'otr' check (price_type in ('otr','cash','promo'))`
-   `amount_idr bigint not null check (amount_idr >= 0)`
-   `valid_from date not null`
-   `valid_until date null`
-   `is_published boolean not null default true`
-   `source_note text null` (internal provenance/update note)
-   `updated_by uuid null references auth.users(id)`
-   `created_at`, `updated_at timestamptz not null default now()`
-   Add index on `(variant_id, city, valid_from desc)`.
-   Prevent overlapping effective periods for the same
    variant/location/price type if practical, using an exclusion
    constraint or server-side validation.
-   Never silently show an expired price as current.

### `promotions`

-   `id uuid primary key`
-   `title text not null`
-   `slug text unique not null`
-   `summary text not null`
-   `details text null`
-   `image_path text null`
-   `starts_at timestamptz not null`
-   `ends_at timestamptz not null`
-   `terms text null`
-   `status text not null check (status in ('draft','published','archived'))`
-   `cta_label text null`, `cta_url text null`
-   `created_by uuid null references auth.users(id)`
-   `created_at`, `updated_at timestamptz not null default now()`
-   Check `ends_at > starts_at`.

### `promotion_models`

-   `promotion_id uuid references promotions(id) on delete cascade`
-   `model_id uuid references motorcycle_models(id) on delete cascade`
-   Primary key `(promotion_id, model_id)`

### `hero_banners`

-   `id uuid primary key`
-   `title text not null`
-   `subtitle text null`
-   `desktop_image_path text not null`
-   `mobile_image_path text null`
-   `alt_text text not null`
-   `cta_label text null`
-   `cta_url text null`
-   `starts_at timestamptz null`
-   `ends_at timestamptz null`
-   `sort_order int not null default 0`
-   `status text not null check (status in ('draft','published','archived'))`
-   `created_at`, `updated_at timestamptz not null default now()`
-   Use date window and status to decide public visibility.

### `leads`

-   `id uuid primary key`
-   `lead_reference text unique not null` (human-friendly reference,
    generated server-side)
-   `full_name text not null`
-   `whatsapp_number text not null`
-   `email text null`
-   `city text not null`
-   `district text null`
-   `model_id uuid null references motorcycle_models(id) on delete set null`
-   `variant_id uuid null references motorcycle_variants(id) on delete set null`
-   `color_id uuid null references colors(id) on delete set null`
-   `model_name_snapshot text null`
-   `variant_name_snapshot text null`
-   `color_name_snapshot text null`
-   `price_snapshot_idr bigint null`
-   `credit_down_payment_idr bigint null`
-   `credit_tenor_months int null`
-   `credit_estimated_installment_idr bigint null`
-   `credit_config_snapshot jsonb null` (store only assumptions required
    to explain the estimate)
-   `message text null`
-   `source_page text null`
-   `source_campaign text null`
-   `consent_privacy_at timestamptz not null`
-   `status text not null default 'new' check (status in ('new','contacted','qualified','follow_up','converted','not_interested','unreachable','duplicate','invalid'))`
-   `assigned_to uuid null references auth.users(id) on delete set null`
-   `created_at timestamptz not null default now()`
-   `updated_at timestamptz not null default now()`
-   `closed_at timestamptz null`
-   Indexes: `(status, created_at desc)`, `(assigned_to, status)`,
    `(city)`, `(model_id)`.
-   Preserve snapshot labels even if a model, variant or color is later
    renamed or archived.

### `lead_notes` (future scope only; omit from V1)


-   `id uuid primary key`
-   `lead_id uuid not null references leads(id) on delete cascade`
-   `author_id uuid not null references auth.users(id)`
-   `note text not null`
-   `created_at timestamptz not null default now()`
-   Notes are internal. Never return them from public APIs.

### `lead_status_history` (future scope only; omit from V1)


-   `id uuid primary key`
-   `lead_id uuid not null references leads(id) on delete cascade`
-   `from_status text null`
-   `to_status text not null`
-   `changed_by uuid null references auth.users(id)`
-   `change_note text null`
-   `created_at timestamptz not null default now()`

### `staff_profiles`

-   `user_id uuid primary key references auth.users(id) on delete cascade`
-   `display_name text not null`
-   `role text not null check (role in ('admin','content_manager','sales'))`
-   `is_active boolean not null default true`
-   `created_at`, `updated_at timestamptz not null default now()`

### Credit configuration
Omit from V1. Credit simulation is disabled; only local OTR prices should be displayed. Add financing configuration only after explicit owner approval and verified terms.

### `site_settings`

A singleton row or a table of typed settings. - `id uuid primary key` -
`dealer_name text not null` - `logo_path text null` -
`address text null` - `city text null` - `phone text null` -
`whatsapp_number text not null` - `public_email text null` -
`opening_hours jsonb not null default '{}'` -
`social_links jsonb not null default '{}'` -
`privacy_notice text not null` -
`updated_by uuid null references auth.users(id)` -
`updated_at timestamptz not null default now()`

### `audit_logs`

-   `id uuid primary key`
-   `actor_id uuid null references auth.users(id)`
-   `action text not null`
-   `entity_type text not null`
-   `entity_id uuid null`
-   `summary text not null`
-   `metadata jsonb not null default '{}'`
-   `created_at timestamptz not null default now()`
-   Never put passwords, auth tokens, full private lead payloads or
    secrets in audit metadata.

## 3. V1 inquiry export
In V1, the admin interface needs a basic inquiry table and an authorized `.xlsx` download. Export columns should include lead reference, submission date/time, name, WhatsApp, email, city/regency, district, model, variant/type, preferred color, message, source page and privacy-consent timestamp. The customer location (`city` and optional `district`) enables the sales administrator to identify the appropriate nearby dealership and manually forward the lead. Do not include internal secrets or unnecessary personal data. No lead status pipeline, automated routing, or internal notes are required.

## 4. Optional/future tables

-   `branches` — Note: Explicitly excluded from V1. Honda Satrya Dealer Group operates multiple dealerships, but V1 is a group-wide showcase without branch management CRUD, public branch profiles, or branch-specific accounts.
-   `cities` if location normalization and reporting becomes important.
-   `lead_sources` if marketing attribution requires a controlled
    taxonomy.
-   `notification_events` for delivery attempts and retries.
-   `price_change_logs` if a dedicated audit view for historical prices
    is needed beyond `audit_logs`.

## 5. Security and RLS policy direction

-   Enable RLS on all exposed tables.
-   Anonymous/public role: read only published models/categories, active
    color/variant options, current public prices, currently active
    promotions/banners, and safe public settings.
-   Anonymous/public role: do not grant broad direct insert/select on
    `leads`. Use a server-side submission endpoint/action with
    validation, rate limiting and spam protection; return only a
    reference/success response.
-   Authenticated staff: enforce role and row/table permissions. Sales
    staff may read/update permitted lead fields and add notes; content
    managers may edit catalog content; admins may manage users/settings.
-   Internal tables (`lead_notes`, `lead_status_history`, `audit_logs`,
    `staff_profiles`) are never publicly readable.
-   Test policies with anonymous, sales, content-manager and admin
    roles. RLS is not a substitute for server-side authorization.

## 6. Data lifecycle

-   Price changes create new effective-dated rows rather than
    overwriting history where feasible.
-   Leads preserve the customer's selected product snapshot.
-   Promotions and banners automatically disappear outside their active
    date windows.
-   Define a retention period for stale leads and allow an authorized
    admin to export/delete according to the business's privacy policy.
