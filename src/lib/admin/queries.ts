import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientType = SupabaseClient<Database>;

export interface AdminPriceEntryItem {
  id: string;
  variantId: string;
  variantName: string;
  variantCode: string | null;
  modelId: string;
  modelName: string;
  modelSlug: string;
  city: string | null;
  priceType: 'otr' | 'cash' | 'promo';
  amountIdr: number;
  validFrom: string;
  validUntil: string | null;
  isPublished: boolean;
  sourceNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminModelOption {
  id: string;
  name: string;
  slug: string;
  variants: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
}

export interface AdminPromotionItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  details: string | null;
  imagePath: string | null;
  startsAt: string;
  endsAt: string;
  terms: string | null;
  status: 'draft' | 'published' | 'archived';
  ctaLabel: string | null;
  ctaUrl: string | null;
  linkedModels: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHeroBannerItem {
  id: string;
  title: string;
  subtitle: string | null;
  desktopImagePath: string;
  mobileImagePath: string | null;
  altText: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

/**
 * Loads all price entries for the admin management view.
 */
export async function getAdminPriceEntries(client?: ClientType): Promise<AdminPriceEntryItem[]> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('price_entries')
      .select(
        `
        id,
        variant_id,
        city,
        price_type,
        amount_idr,
        valid_from,
        valid_until,
        is_published,
        source_note,
        created_at,
        updated_at,
        motorcycle_variants!inner (
          id,
          name,
          code,
          motorcycle_models!inner (
            id,
            name,
            slug
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin price entries:', error.message);
      return [];
    }

    if (!data) return [];

    type QueryRow = {
      id: string;
      variant_id: string;
      city: string | null;
      price_type: 'otr' | 'cash' | 'promo';
      amount_idr: number;
      valid_from: string;
      valid_until: string | null;
      is_published: boolean;
      source_note: string | null;
      created_at: string;
      updated_at: string;
      motorcycle_variants: {
        id: string;
        name: string;
        code: string | null;
        motorcycle_models: {
          id: string;
          name: string;
          slug: string;
        };
      };
    };

    const rows = data as unknown as QueryRow[];

    return rows.map((r) => ({
      id: r.id,
      variantId: r.variant_id,
      variantName: r.motorcycle_variants?.name || 'Varian Tidak Diketahui',
      variantCode: r.motorcycle_variants?.code || null,
      modelId: r.motorcycle_variants?.motorcycle_models?.id || '',
      modelName: r.motorcycle_variants?.motorcycle_models?.name || 'Model Tidak Diketahui',
      modelSlug: r.motorcycle_variants?.motorcycle_models?.slug || '',
      city: r.city,
      priceType: r.price_type,
      amountIdr: Number(r.amount_idr),
      validFrom: r.valid_from,
      validUntil: r.valid_until,
      isPublished: r.is_published,
      sourceNote: r.source_note,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin price entries:', err);
    return [];
  }
}

/**
 * Loads all models and their variants for selection in admin forms.
 */
export async function getMotorcycleOptionsForAdmin(
  client?: ClientType
): Promise<AdminModelOption[]> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        motorcycle_variants (
          id,
          name,
          code
        )
      `
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching motorcycle options for admin:', error.message);
      return [];
    }

    if (!data) return [];

    type ModelRow = {
      id: string;
      name: string;
      slug: string;
      motorcycle_variants: Array<{
        id: string;
        name: string;
        code: string | null;
      }>;
    };

    const rows = data as unknown as ModelRow[];

    return rows.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      variants: (m.motorcycle_variants || []).map((v) => ({
        id: v.id,
        name: v.name,
        code: v.code,
      })),
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load motorcycle options:', err);
    return [];
  }
}

/**
 * Loads all promotions for the admin management view.
 */
export async function getAdminPromotions(client?: ClientType): Promise<AdminPromotionItem[]> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('promotions')
      .select(
        `
        id,
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
        created_at,
        updated_at,
        promotion_models (
          model_id,
          motorcycle_models (
            id,
            name,
            slug
          )
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin promotions:', error.message);
      return [];
    }

    if (!data) return [];

    type PromoRow = {
      id: string;
      title: string;
      slug: string;
      summary: string;
      details: string | null;
      image_path: string | null;
      starts_at: string;
      ends_at: string;
      terms: string | null;
      status: 'draft' | 'published' | 'archived';
      cta_label: string | null;
      cta_url: string | null;
      created_at: string;
      updated_at: string;
      promotion_models: Array<{
        model_id: string;
        motorcycle_models: {
          id: string;
          name: string;
          slug: string;
        } | null;
      }>;
    };

    const rows = data as unknown as PromoRow[];

    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      details: p.details,
      imagePath: p.image_path,
      startsAt: p.starts_at,
      endsAt: p.ends_at,
      terms: p.terms,
      status: p.status,
      ctaLabel: p.cta_label,
      ctaUrl: p.cta_url,
      linkedModels: (p.promotion_models || [])
        .map((pm) => pm.motorcycle_models)
        .filter((m): m is { id: string; name: string; slug: string } => Boolean(m))
        .map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
        })),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin promotions:', err);
    return [];
  }
}

/**
 * Loads all hero banners for the admin management view.
 */
export async function getAdminHeroBanners(client?: ClientType): Promise<AdminHeroBannerItem[]> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('hero_banners')
      .select(
        `
        id,
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
        status,
        created_at,
        updated_at
      `
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin hero banners:', error.message);
      return [];
    }

    if (!data) return [];

    type BannerRow = {
      id: string;
      title: string;
      subtitle: string | null;
      desktop_image_path: string;
      mobile_image_path: string | null;
      alt_text: string;
      cta_label: string | null;
      cta_url: string | null;
      starts_at: string | null;
      ends_at: string | null;
      sort_order: number;
      status: 'draft' | 'published' | 'archived';
      created_at: string;
      updated_at: string;
    };

    const rows = data as unknown as BannerRow[];

    return rows.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      desktopImagePath: b.desktop_image_path,
      mobileImagePath: b.mobile_image_path,
      altText: b.alt_text,
      ctaLabel: b.cta_label,
      ctaUrl: b.cta_url,
      startsAt: b.starts_at,
      endsAt: b.ends_at,
      sortOrder: b.sort_order,
      status: b.status,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin hero banners:', err);
    return [];
  }
}
