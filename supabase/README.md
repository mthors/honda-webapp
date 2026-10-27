# Supabase Database, Authentication & Security Documentation

This directory contains version-controlled database migrations and operational documentation for the **Honda Satrya Dealer Group** digital showroom web application.

---

## 1. Migration Architecture & Schema Overview

Migrations are located in `supabase/migrations/` and ordered chronologically:
- `20261025000001_initial_schema.sql`: Contains the complete V1 relational schema, constraints, triggers, indexes, and hardened Row Level Security (RLS) policies.

### V1 Relational Entities
1. `categories`: Product categories (Matic, Cub, Sport, EV, Big Bike).
2. `motorcycle_models`: Motorcycle catalog models with status (`draft`, `published`, `archived`) and specifications.
3. `motorcycle_variants`: Variants and trims (e.g. CBS, ABS) cascading from models.
4. `colors`: Color references and HEX swatches.
5. `variant_colors`: Available variant-color pairings.
6. `model_images`: Media assets categorized by role (`hero`, `card`, `gallery`, `color`).
7. `price_entries`: Effective-dated local OTR price entries with location scope (`valid_from`, `valid_until`).
8. `promotions`: Dealer promotional campaigns with schedule windows (`starts_at`, `ends_at`).
9. `promotion_models`: Many-to-many junction between promotions and eligible models.
10. `hero_banners`: Scheduled homepage hero banners.
11. `leads`: Protected customer inquiry submissions (with product snapshots and privacy consent timestamp).
12. `staff_profiles`: Authenticated staff records with unified `admin` role and `is_active` status.
13. `site_settings`: Dealership contact details, operating hours, and privacy policy (singleton).
14. `audit_logs`: Immutable security audit log for tracking administrative actions.

---

## 2. Row Level Security (RLS) Policies

RLS is enabled on **every** table. Security policies follow these non-negotiable principles:

- **Anonymous Visitors**:
  - Can read **only** published models (`status = 'published'`), active variants of published models, valid effective-dated prices (`is_published = true AND valid_from <= current_date AND (valid_until IS NULL OR valid_until >= current_date)`), active promotions, and public site settings.
  - **Cannot** read customer leads (`leads`), staff profiles (`staff_profiles`), or audit logs (`audit_logs`).
  - **Cannot** insert arbitrary database records. Public inquiry submissions are not granted direct table write access; all submissions are routed through a validated server-side procedure.
- **Administrators**:
  - Authenticated staff with an active profile in `staff_profiles` (`role = 'admin'` and `is_active = true`) are verified via the hardened `public.is_admin()` security definer function (`search_path = public`).
  - Admins have full management access to catalog, pricing, promotions, settings, and inquiry leads.
  - Audit logs are append-only and cannot be updated or deleted.

---

## 3. Applying Migrations

### Local Development (with Supabase CLI and Docker)
If Docker is installed on your local workstation:
```bash
# Start local Supabase containers
npx supabase start

# Apply pending migrations and run seed data (supabase/seed.sql)
npx supabase db reset
```

To run only the seed data without resetting the database:
```bash
# Apply seed data to local PostgreSQL instance
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/seed.sql
```

### Remote / Hosted Development Project
To link and push migrations to a hosted Supabase project:
```bash
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your project (replace with your project reference ID)
npx supabase link --project-ref <your-project-ref>

# 3. Push migrations to remote database
npx supabase db push
```

Alternatively, open `supabase/migrations/20261025000001_initial_schema.sql` in the **Supabase Dashboard SQL Editor** and execute it directly.

---

## 4. Secure Initial Administrator Provisioning

**Self-registration is strictly disabled.** Administrative privileges are never granted automatically upon login. Follow this 2-step procedure to create the first administrator:

### Step 1: Create Auth User
1. In the Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter the dealership's official administrator email and a strong password.
4. Confirm user creation and copy the generated `User UID` (UUID).

### Step 2: Authorize in `staff_profiles`
In the **SQL Editor**, execute the following query, substituting the actual UID and display name:

```sql
insert into public.staff_profiles (user_id, display_name, role, is_active)
values (
  '<COPIED_USER_UID>',
  'Administrator Honda Satrya Dealer Group',
  'admin',
  true
);
```

The user is now authorized to sign in at `/admin/login` and access `/admin`.

---

## 5. Verifying RLS Behavior

To verify that RLS is functioning as intended, run the following verification queries in the SQL Editor:

```sql
-- 1. Test anonymous access (Simulate public visitor)
set role anon;

-- Should succeed (returns only published models):
select count(*) from public.motorcycle_models where status = 'published';

-- Must fail or return 0 rows:
select * from public.leads;
select * from public.staff_profiles;
select * from public.audit_logs;

-- Must fail with permission denied:
insert into public.leads (lead_reference, full_name, whatsapp_number, city, consent_privacy_at)
values ('TEST-001', 'Attacker', '08123456789', 'Sidoarjo', now());

-- 2. Reset role
reset role;
```

---

## 6. Environment Separation & Verification Matrix

| Check | Runs Offline / Without Credentials | Requires Configured Supabase Project |
|---|:---:|:---:|
| `npm run lint` | Yes | No |
| `npm run typecheck` | Yes | No |
| `npm run test` (Unit/Schema/Auth tests) | Yes | No |
| `npm run format:check` | Yes | No |
| `npm run build` (Next.js production build) | Yes | No |
| Live Auth Login / Session Cookies | No | Yes (`.env.local` configured) |
| Live SQL Migration Execution | No | Yes (Docker or hosted Supabase) |

