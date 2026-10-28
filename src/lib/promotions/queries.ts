import { createClient } from '@/lib/supabase/server';
import type {
  HeroBanner,
  PromotionDetail,
  PromotionEligibleModel,
  PromotionSummary,
  PromotionStatus,
} from '@/types/promotions';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientType = SupabaseClient<Database>;

interface ImageRow {
  id: string;
  storage_path: string;
  alt_text: string;
  image_role: string;
  sort_order: number;
}

interface PriceEntryRow {
  id: string;
  amount_idr: number;
  price_type: string;
  is_published: boolean;
  valid_from: string;
  valid_until: string | null;
}

interface VariantRow {
  id: string;
  status: string;
  price_entries: PriceEntryRow[];
}

interface MotorcycleModelJoinRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  published_at: string | null;
  category: {
    name: string;
  } | null;
  images: ImageRow[];
  variants: VariantRow[];
}

interface PromotionWithModelsRow {
  id: string;
  title: string;
  slug: string;
  summary: string;
  details: string | null;
  image_path: string | null;
  starts_at: string;
  ends_at: string;
  terms: string | null;
  status: string;
  cta_label: string | null;
  cta_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  promotion_models: Array<{
    model: MotorcycleModelJoinRow | null;
  }>;
}

interface HeroBannerRow {
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
  status: string;
  created_at: string;
  updated_at: string;
}

function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retrieves all published promotions currently within their active schedule window.
 * Expired, draft, and archived promotions are excluded.
 */
export async function getActivePromotions(client?: ClientType): Promise<PromotionSummary[]> {
  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('promotions')
      .select(
        `
        id,
        title,
        slug,
        summary,
        image_path,
        starts_at,
        ends_at,
        status,
        cta_label,
        cta_url,
        promotion_models(model_id)
      `
      )
      .eq('status', 'published')
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: false });

    if (error) {
      console.error('Error fetching active promotions:', error.message);
      return [];
    }

    if (!data) return [];

    return (
      data as Array<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        image_path: string | null;
        starts_at: string;
        ends_at: string;
        status: string;
        cta_label: string | null;
        cta_url: string | null;
        promotion_models: Array<{ model_id: string }>;
      }>
    ).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      imagePath: item.image_path,
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      status: item.status as PromotionStatus,
      ctaLabel: item.cta_label,
      ctaUrl: item.cta_url,
      eligibleModelCount: item.promotion_models ? item.promotion_models.length : 0,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load active promotions:', err);
    return [];
  }
}

/**
 * Retrieves detailed information for a single active published promotion by slug,
 * including eligible motorcycle models with primary images and starting prices.
 */
export async function getPromotionBySlug(
  slug: string,
  client?: ClientType
): Promise<PromotionDetail | null> {
  if (!slug || slug.trim() === '') return null;

  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();
    const today = getTodayIsoDate();

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
        created_by,
        created_at,
        updated_at,
        promotion_models(
          model:motorcycle_models(
            id,
            name,
            slug,
            status,
            published_at,
            category:categories(name),
            images:model_images(id, storage_path, alt_text, image_role, sort_order),
            variants:motorcycle_variants(
              id,
              status,
              price_entries(id, amount_idr, price_type, is_published, valid_from, valid_until)
            )
          )
        )
      `
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error(`Error fetching promotion for slug ${slug}:`, error.message);
      }
      return null;
    }

    const row = data as unknown as PromotionWithModelsRow;

    // Process linked eligible models (filtering for published models only)
    const eligibleModels: PromotionEligibleModel[] = [];

    for (const link of row.promotion_models || []) {
      const model = link.model;
      if (!model || model.status !== 'published') continue;
      if (model.published_at && model.published_at > nowIso) continue;

      const sortedImages = (model.images || []).sort((a, b) => a.sort_order - b.sort_order);
      const cardImage =
        sortedImages.find((img) => img.image_role === 'card') ||
        sortedImages.find((img) => img.image_role === 'hero') ||
        sortedImages[0];

      let startingPriceIdr: number | null = null;
      for (const variant of model.variants || []) {
        if (variant.status !== 'active') continue;
        for (const price of variant.price_entries || []) {
          if (!price.is_published) continue;
          if (price.amount_idr <= 0) continue;
          if (price.valid_from > today) continue;
          if (price.valid_until && price.valid_until < today) continue;

          if (startingPriceIdr === null || price.amount_idr < startingPriceIdr) {
            startingPriceIdr = price.amount_idr;
          }
        }
      }

      eligibleModels.push({
        id: model.id,
        name: model.name,
        slug: model.slug,
        categoryName: model.category?.name || 'Honda',
        primaryImage: cardImage
          ? {
              storagePath: cardImage.storage_path,
              altText: cardImage.alt_text,
            }
          : null,
        startingPriceIdr,
      });
    }

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      details: row.details,
      imagePath: row.image_path,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      terms: row.terms,
      status: row.status as PromotionStatus,
      ctaLabel: row.cta_label,
      ctaUrl: row.cta_url,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      eligibleModels,
    };
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error(`Failed to load promotion ${slug}:`, err);
    return null;
  }
}

/**
 * Retrieves active promotions linked to a specific motorcycle model.
 * Used on the model detail page (/motor/[slug]) to display relevant promotional banners.
 */
export async function getModelActivePromotions(
  modelId: string,
  client?: ClientType
): Promise<PromotionSummary[]> {
  if (!modelId) return [];

  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('promotions')
      .select(
        `
        id,
        title,
        slug,
        summary,
        image_path,
        starts_at,
        ends_at,
        status,
        cta_label,
        cta_url,
        promotion_models!inner(model_id)
      `
      )
      .eq('status', 'published')
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .eq('promotion_models.model_id', modelId)
      .order('starts_at', { ascending: false });

    if (error) {
      console.error(`Error fetching active promotions for model ${modelId}:`, error.message);
      return [];
    }

    if (!data) return [];

    return (
      data as Array<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        image_path: string | null;
        starts_at: string;
        ends_at: string;
        status: string;
        cta_label: string | null;
        cta_url: string | null;
        promotion_models: Array<{ model_id: string }>;
      }>
    ).map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      imagePath: item.image_path,
      startsAt: item.starts_at,
      endsAt: item.ends_at,
      status: item.status as PromotionStatus,
      ctaLabel: item.cta_label,
      ctaUrl: item.cta_url,
      eligibleModelCount: item.promotion_models ? item.promotion_models.length : 0,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error(`Failed to load active promotions for model ${modelId}:`, err);
    return [];
  }
}

/**
 * Retrieves published hero banners currently within their active schedule window,
 * sorted by sort_order ascending.
 *
 * If zero banners exist, returns an empty array to allow the caller to render the default brand hero.
 */
export async function getActiveHeroBanners(client?: ClientType): Promise<HeroBanner[]> {
  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();

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
      .eq('status', 'published')
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active hero banners:', error.message);
      return [];
    }

    if (!data) return [];

    const rows = data as unknown as HeroBannerRow[];

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
      status: b.status as PromotionStatus,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load active hero banners:', err);
    return [];
  }
}
