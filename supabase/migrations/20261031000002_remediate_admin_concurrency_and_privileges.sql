-- ==============================================================================
-- Migration: 20261031000002_remediate_admin_concurrency_and_privileges.sql
-- Description: Remediate concurrency race conditions, enrich audit metadata
--              with before/after state snapshots, and revoke direct table DML
--              to ensure all mutations pass exclusively through audited RPCs.
-- ==============================================================================

-- 1. Hardened Concurrency & Before/After Auditing for Price Entries
create or replace function public.admin_upsert_price_entry(
  p_id uuid,
  p_variant_id uuid,
  p_city text,
  p_price_type text,
  p_amount_idr bigint,
  p_valid_from date,
  p_valid_until date,
  p_is_published boolean,
  p_source_note text,
  p_summary text
)
returns public.price_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_norm_city text;
  v_existing_conflict record;
  v_result public.price_entries;
  v_old_price public.price_entries;
  v_old_variant_id uuid;
  v_effective_variant_id uuid;
begin
  -- 1. Security Check: verify caller is an active administrator
  if not public.is_admin() then
    raise exception 'Akses ditolak: pengguna bukan administrator aktif';
  end if;

  v_admin_id := auth.uid();
  if v_admin_id is null then
    raise exception 'Akses ditolak: sesi tidak valid';
  end if;

  -- 2. Validate scalar inputs
  if p_price_type not in ('otr', 'cash', 'promo') then
    raise exception 'Tipe harga tidak valid';
  end if;

  if p_amount_idr <= 0 then
    raise exception 'Nominal harga harus lebih besar dari 0';
  end if;

  if p_valid_from is null then
    raise exception 'Tanggal mulai berlaku wajib diisi';
  end if;

  if p_valid_until is not null and p_valid_until < p_valid_from then
    raise exception 'Tanggal akhir berlaku tidak boleh mendahului tanggal mulai';
  end if;

  -- 3. Concurrency Serialization & Lock Ordering
  if p_id is not null then
    -- Lock the existing price entry row first to prevent concurrent modifications to the same price record
    select * into v_old_price
    from public.price_entries
    where id = p_id
    for update;

    if v_old_price.id is null then
      raise exception 'Data harga tidak ditemukan untuk diperbarui';
    end if;

    v_old_variant_id := v_old_price.variant_id;
    -- Graceful fallback: retain existing variant if p_variant_id is omitted or null
    v_effective_variant_id := coalesce(p_variant_id, v_old_variant_id);

    if v_old_variant_id = v_effective_variant_id then
      -- Same variant: lock the single variant row
      perform 1
      from public.motorcycle_variants
      where id = v_effective_variant_id
      for update;

      if not found then
        raise exception 'Varian motor tidak ditemukan';
      end if;
    else
      -- Moving across variants: lock BOTH old and new variants in deterministic ascending UUID order to prevent deadlocks
      perform 1
      from public.motorcycle_variants
      where id in (v_old_variant_id, v_effective_variant_id)
      order by id asc
      for update;

      if not exists (select 1 from public.motorcycle_variants where id = v_effective_variant_id) then
        raise exception 'Varian motor target tidak ditemukan';
      end if;
    end if;
  else
    -- Creating a new price entry: variant ID is mandatory
    if p_variant_id is null then
      raise exception 'Variant ID wajib diisi';
    end if;

    v_effective_variant_id := p_variant_id;
    v_old_variant_id := null;
    v_old_price := null;

    -- Lock the target variant row
    perform 1
    from public.motorcycle_variants
    where id = v_effective_variant_id
    for update;

    if not found then
      raise exception 'Varian motor tidak ditemukan';
    end if;
  end if;

  -- 4. Overlap conflict detection with normalized city (under acquired locks)
  v_norm_city := lower(trim(regexp_replace(coalesce(p_city, ''), '\s+', ' ', 'g')));

  select id, valid_from, valid_until
  into v_existing_conflict
  from public.price_entries
  where variant_id = v_effective_variant_id
    and price_type = p_price_type
    and lower(trim(regexp_replace(coalesce(city, ''), '\s+', ' ', 'g'))) = v_norm_city
    and (p_id is null or id <> p_id)
    and valid_from <= coalesce(p_valid_until, '9999-12-31'::date)
    and p_valid_from <= coalesce(valid_until, '9999-12-31'::date)
  limit 1;

  if v_existing_conflict.id is not null then
    raise exception 'Konflik periode harga: Rentang tanggal bertabrakan dengan harga % yang sudah ada (% s/d %)',
      p_price_type,
      v_existing_conflict.valid_from,
      coalesce(v_existing_conflict.valid_until::text, 'seterusnya');
  end if;

  -- 5. Mutation execution
  if p_id is null then
    insert into public.price_entries (
      variant_id,
      city,
      price_type,
      amount_idr,
      valid_from,
      valid_until,
      is_published,
      source_note,
      updated_by
    ) values (
      v_effective_variant_id,
      p_city,
      p_price_type,
      p_amount_idr,
      p_valid_from,
      p_valid_until,
      coalesce(p_is_published, false),
      p_source_note,
      v_admin_id
    ) returning * into v_result;
  else
    update public.price_entries
    set variant_id = v_effective_variant_id,
        city = p_city,
        price_type = p_price_type,
        amount_idr = p_amount_idr,
        valid_from = p_valid_from,
        valid_until = p_valid_until,
        is_published = coalesce(p_is_published, false),
        source_note = p_source_note,
        updated_by = v_admin_id,
        updated_at = now()
    where id = p_id
    returning * into v_result;
  end if;

  -- 6. Atomic audit logging with before/after state snapshots
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  ) values (
    v_admin_id,
    case when p_id is null then 'create_price_entry' else 'update_price_entry' end,
    'price_entries',
    v_result.id,
    coalesce(p_summary, 'Pembaruan data harga oleh administrator'),
    jsonb_build_object(
      'previous_state', case
        when v_old_price.id is not null then jsonb_build_object(
          'id', v_old_price.id,
          'variant_id', v_old_price.variant_id,
          'city', v_old_price.city,
          'price_type', v_old_price.price_type,
          'amount_idr', v_old_price.amount_idr,
          'valid_from', v_old_price.valid_from,
          'valid_until', v_old_price.valid_until,
          'is_published', v_old_price.is_published,
          'source_note', v_old_price.source_note
        )
        else null
      end,
      'new_state', jsonb_build_object(
        'id', v_result.id,
        'variant_id', v_result.variant_id,
        'city', v_result.city,
        'price_type', v_result.price_type,
        'amount_idr', v_result.amount_idr,
        'valid_from', v_result.valid_from,
        'valid_until', v_result.valid_until,
        'is_published', v_result.is_published,
        'source_note', v_result.source_note
      )
    )
  );

  return v_result;
end;
$$;

revoke all on function public.admin_upsert_price_entry(uuid, uuid, text, text, bigint, date, date, boolean, text, text) from public, anon;
grant execute on function public.admin_upsert_price_entry(uuid, uuid, text, text, bigint, date, date, boolean, text, text) to authenticated;

-- 2. Hardened Before/After Auditing for Promotions (with Junction Snapshots)
create or replace function public.admin_upsert_promotion(
  p_id uuid,
  p_title text,
  p_slug text,
  p_summary text,
  p_details text,
  p_image_path text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_terms text,
  p_status text,
  p_cta_label text,
  p_cta_url text,
  p_model_ids uuid[],
  p_audit_summary text
)
returns public.promotions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_result public.promotions;
  v_old_promo public.promotions;
  v_old_model_ids uuid[];
  v_new_model_ids uuid[];
  v_model_id uuid;
begin
  -- 1. Security Check
  if not public.is_admin() then
    raise exception 'Akses ditolak: pengguna bukan administrator aktif';
  end if;

  v_admin_id := auth.uid();
  if v_admin_id is null then
    raise exception 'Akses ditolak: sesi tidak valid';
  end if;

  -- 2. Input validation
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Judul promo wajib diisi';
  end if;

  if trim(coalesce(p_slug, '')) = '' then
    raise exception 'Slug promo wajib diisi';
  end if;

  if p_starts_at is null or p_ends_at is null then
    raise exception 'Waktu mulai dan berakhir promo wajib diisi';
  end if;

  if p_ends_at <= p_starts_at then
    raise exception 'Waktu berakhir promo harus setelah waktu mulai';
  end if;

  if p_status not in ('draft', 'published', 'archived') then
    raise exception 'Status promo tidak valid';
  end if;

  -- 3. Capture old state and lock row if updating
  if p_id is not null then
    select * into v_old_promo
    from public.promotions
    where id = p_id
    for update;

    if v_old_promo.id is null then
      raise exception 'Data promo tidak ditemukan untuk diperbarui';
    end if;

    select coalesce(array_agg(model_id order by model_id), '{}'::uuid[])
    into v_old_model_ids
    from public.promotion_models
    where promotion_id = p_id;
  else
    v_old_promo := null;
    v_old_model_ids := null;
  end if;

  -- 4. Mutation execution
  if p_id is null then
    insert into public.promotions (
      title,
      slug,
      summary,
      details,
      image_path,
      starts_at,
      ends_at,
      terms,
      status,
      cta_label,
      cta_url,
      created_by
    ) values (
      trim(p_title),
      trim(lower(p_slug)),
      trim(p_summary),
      p_details,
      p_image_path,
      p_starts_at,
      p_ends_at,
      p_terms,
      p_status,
      p_cta_label,
      p_cta_url,
      v_admin_id
    ) returning * into v_result;
  else
    update public.promotions
    set title = trim(p_title),
        slug = trim(lower(p_slug)),
        summary = trim(p_summary),
        details = p_details,
        image_path = p_image_path,
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        terms = p_terms,
        status = p_status,
        cta_label = p_cta_label,
        cta_url = p_cta_url,
        updated_at = now()
    where id = p_id
    returning * into v_result;
  end if;

  -- 5. Synchronize promotion models
  if p_model_ids is not null then
    delete from public.promotion_models
    where promotion_id = v_result.id;

    if array_length(p_model_ids, 1) > 0 then
      foreach v_model_id in array p_model_ids
      loop
        insert into public.promotion_models (promotion_id, model_id)
        values (v_result.id, v_model_id)
        on conflict do nothing;
      end loop;
    end if;
  end if;

  select coalesce(array_agg(model_id order by model_id), '{}'::uuid[])
  into v_new_model_ids
  from public.promotion_models
  where promotion_id = v_result.id;

  -- 6. Atomic audit logging with before/after state snapshots including model associations
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  ) values (
    v_admin_id,
    case when p_id is null then 'create_promotion' else 'update_promotion' end,
    'promotions',
    v_result.id,
    coalesce(p_audit_summary, 'Pembaruan data promosi oleh administrator'),
    jsonb_build_object(
      'previous_state', case
        when v_old_promo.id is not null then jsonb_build_object(
          'id', v_old_promo.id,
          'title', v_old_promo.title,
          'slug', v_old_promo.slug,
          'summary', v_old_promo.summary,
          'status', v_old_promo.status,
          'starts_at', v_old_promo.starts_at,
          'ends_at', v_old_promo.ends_at,
          'model_ids', v_old_model_ids
        )
        else null
      end,
      'new_state', jsonb_build_object(
        'id', v_result.id,
        'title', v_result.title,
        'slug', v_result.slug,
        'summary', v_result.summary,
        'status', v_result.status,
        'starts_at', v_result.starts_at,
        'ends_at', v_result.ends_at,
        'model_ids', v_new_model_ids
      )
    )
  );

  return v_result;
end;
$$;

revoke all on function public.admin_upsert_promotion(uuid, text, text, text, text, text, timestamptz, timestamptz, text, text, text, text, uuid[], text) from public, anon;
grant execute on function public.admin_upsert_promotion(uuid, text, text, text, text, text, timestamptz, timestamptz, text, text, text, text, uuid[], text) to authenticated;

-- 3. Hardened Before/After Auditing for Hero Banners
create or replace function public.admin_upsert_hero_banner(
  p_id uuid,
  p_title text,
  p_subtitle text,
  p_desktop_image_path text,
  p_mobile_image_path text,
  p_alt_text text,
  p_cta_label text,
  p_cta_url text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_sort_order integer,
  p_status text,
  p_audit_summary text
)
returns public.hero_banners
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_result public.hero_banners;
  v_old_banner public.hero_banners;
begin
  -- 1. Security Check
  if not public.is_admin() then
    raise exception 'Akses ditolak: pengguna bukan administrator aktif';
  end if;

  v_admin_id := auth.uid();
  if v_admin_id is null then
    raise exception 'Akses ditolak: sesi tidak valid';
  end if;

  -- 2. Input validation
  if trim(coalesce(p_title, '')) = '' then
    raise exception 'Judul spanduk wajib diisi';
  end if;

  if trim(coalesce(p_desktop_image_path, '')) = '' then
    raise exception 'Jalur gambar desktop wajib diisi';
  end if;

  if trim(coalesce(p_alt_text, '')) = '' then
    raise exception 'Teks alt spanduk wajib diisi';
  end if;

  if p_starts_at is not null and p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'Waktu berakhir spanduk harus setelah waktu mulai';
  end if;

  if p_status not in ('draft', 'published', 'archived') then
    raise exception 'Status spanduk tidak valid';
  end if;

  -- 3. Capture old state and lock row if updating
  if p_id is not null then
    select * into v_old_banner
    from public.hero_banners
    where id = p_id
    for update;

    if v_old_banner.id is null then
      raise exception 'Data spanduk tidak ditemukan untuk diperbarui';
    end if;
  else
    v_old_banner := null;
  end if;

  -- 4. Mutation execution
  if p_id is null then
    insert into public.hero_banners (
      title,
      subtitle,
      desktop_image_path,
      mobile_image_path,
      alt_text,
      cta_label,
      cta_url,
      starts_at,
      ends_at,
      sort_order,
      status
    ) values (
      trim(p_title),
      p_subtitle,
      trim(p_desktop_image_path),
      p_mobile_image_path,
      trim(p_alt_text),
      p_cta_label,
      p_cta_url,
      p_starts_at,
      p_ends_at,
      coalesce(p_sort_order, 0),
      coalesce(p_status, 'draft')
    ) returning * into v_result;
  else
    update public.hero_banners
    set title = trim(p_title),
        subtitle = p_subtitle,
        desktop_image_path = trim(p_desktop_image_path),
        mobile_image_path = p_mobile_image_path,
        alt_text = trim(p_alt_text),
        cta_label = p_cta_label,
        cta_url = p_cta_url,
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        sort_order = coalesce(p_sort_order, 0),
        status = coalesce(p_status, 'draft'),
        updated_at = now()
    where id = p_id
    returning * into v_result;
  end if;

  -- 5. Atomic audit logging with before/after state snapshots
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  ) values (
    v_admin_id,
    case when p_id is null then 'create_hero_banner' else 'update_hero_banner' end,
    'hero_banners',
    v_result.id,
    coalesce(p_audit_summary, 'Pembaruan data spanduk hero oleh administrator'),
    jsonb_build_object(
      'previous_state', case
        when v_old_banner.id is not null then jsonb_build_object(
          'id', v_old_banner.id,
          'title', v_old_banner.title,
          'desktop_image_path', v_old_banner.desktop_image_path,
          'sort_order', v_old_banner.sort_order,
          'status', v_old_banner.status,
          'starts_at', v_old_banner.starts_at,
          'ends_at', v_old_banner.ends_at
        )
        else null
      end,
      'new_state', jsonb_build_object(
        'id', v_result.id,
        'title', v_result.title,
        'desktop_image_path', v_result.desktop_image_path,
        'sort_order', v_result.sort_order,
        'status', v_result.status,
        'starts_at', v_result.starts_at,
        'ends_at', v_result.ends_at
      )
    )
  );

  return v_result;
end;
$$;

revoke all on function public.admin_upsert_hero_banner(uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, integer, text, text) from public, anon;
grant execute on function public.admin_upsert_hero_banner(uuid, text, text, text, text, text, text, text, timestamptz, timestamptz, integer, text, text) to authenticated;

-- 4. Table Privilege Hardening: Revoke Direct Table DML to Prevent RLS Mutation Bypass
-- Direct mutations by authenticated users are forbidden; all writes must route through audited SECURITY DEFINER RPCs.
revoke insert, update, delete on table public.price_entries from public, anon, authenticated;
revoke insert, update, delete on table public.promotions from public, anon, authenticated;
revoke insert, update, delete on table public.promotion_models from public, anon, authenticated;
revoke insert, update, delete on table public.hero_banners from public, anon, authenticated;

-- Preserve SELECT privileges for public catalog reading (strictly filtered by existing RLS policies)
grant select on table public.price_entries to anon, authenticated, service_role;
grant select on table public.promotions to anon, authenticated, service_role;
grant select on table public.promotion_models to anon, authenticated, service_role;
grant select on table public.hero_banners to anon, authenticated, service_role;

-- Ensure service_role (and postgres function owner) retains DML permissions
grant insert, update, delete on table public.price_entries to service_role;
grant insert, update, delete on table public.promotions to service_role;
grant insert, update, delete on table public.promotion_models to service_role;
grant insert, update, delete on table public.hero_banners to service_role;

