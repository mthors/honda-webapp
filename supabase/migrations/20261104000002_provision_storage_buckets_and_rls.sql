-- ==============================================================================
-- Migration: 20261104000002_provision_storage_buckets_and_rls.sql
-- Milestone: M8 Step 2 — Supabase Storage Hardening
-- Description:
--   1. Idempotently provisions the 3 public showroom visual asset buckets:
--      - motorcycles: Model hero, gallery angles, and variant/colorway images.
--      - promotions: Promotional flyers, banners, and campaign graphics.
--      - hero-banners: Homepage carousel banner graphics (desktop and mobile cuts).
--   2. Enforces least-privilege access:
--      - Public = true with SELECT policy on storage.objects for public viewing.
--      - Authenticated admin-only INSERT, UPDATE, and DELETE policies enforced via
--        the hardened security definer function public.is_admin().
--      - File size limit capped at 5 MB per object.
--      - MIME types strictly restricted to standard web image formats.
-- ==============================================================================

-- 1. Provision Showroom Storage Buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'motorcycles',
    'motorcycles',
    true,
    5242880, -- 5 MB max per image
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'promotions',
    'promotions',
    true,
    5242880, -- 5 MB max per image
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'hero-banners',
    'hero-banners',
    true,
    5242880, -- 5 MB max per image
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage Objects RLS Policies

-- 2a. Public Read Access: Visitors and authenticated users can view/download showroom images
drop policy if exists "Public can view showroom images" on storage.objects;
create policy "Public can view showroom images"
  on storage.objects
  for select
  to public
  using (bucket_id in ('motorcycles', 'promotions', 'hero-banners'));

-- 2b. Admin-Only Upload (INSERT): Only verified active admins can upload new image assets
drop policy if exists "Admins can upload showroom images" on storage.objects;
create policy "Admins can upload showroom images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('motorcycles', 'promotions', 'hero-banners')
    and public.is_admin()
  );

-- 2c. Admin-Only Update (UPDATE): Only verified active admins can replace/update image assets
drop policy if exists "Admins can update showroom images" on storage.objects;
create policy "Admins can update showroom images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('motorcycles', 'promotions', 'hero-banners')
    and public.is_admin()
  )
  with check (
    bucket_id in ('motorcycles', 'promotions', 'hero-banners')
    and public.is_admin()
  );

-- 2d. Admin-Only Delete (DELETE): Only verified active admins can delete image assets
drop policy if exists "Admins can delete showroom images" on storage.objects;
create policy "Admins can delete showroom images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('motorcycles', 'promotions', 'hero-banners')
    and public.is_admin()
  );

