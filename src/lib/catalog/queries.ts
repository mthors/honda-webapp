import { createClient } from '@/lib/supabase/server';
import type {
  CatalogCategory,
  CatalogModelSummary,
  CatalogModelDetail,
  CatalogVariant,
  CatalogModelImage,
} from '@/types/catalog';
import type { Database, Json } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientType = SupabaseClient<Database>;

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  name: string;
  status: string;
  sort_order: number;
  price_entries: PriceEntryRow[];
}

interface ImageRow {
  id: string;
  storage_path: string;
  alt_text: string;
  image_role: string;
  sort_order: number;
  variant_id?: string | null;
  color_id?: string | null;
}

interface ModelSummaryRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  engine_cc: number | null;
  transmission: string | null;
  is_featured: boolean;
  is_new: boolean;
  status: string;
  published_at: string | null;
  category: { id: string; name: string; slug: string; is_active: boolean };
  images: ImageRow[];
  variants: VariantRow[];
}

interface ColorDetailRow {
  id: string;
  color_id: string;
  image_path: string | null;
  is_available: boolean;
  sort_order: number;
  color: {
    id: string;
    name: string;
    slug: string;
    hex_code: string | null;
  };
}

interface VariantDetailRow {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  sort_order: number;
  status: string;
  variant_colors: ColorDetailRow[];
  price_entries: PriceEntryRow[];
}

interface ModelDetailRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  engine_cc: number | null;
  transmission: string | null;
  key_specs: Record<string, Json>;
  is_featured: boolean;
  is_new: boolean;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  category: { id: string; name: string; slug: string; is_active: boolean };
  images: ImageRow[];
  variants: VariantDetailRow[];
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) for comparing effective dates.
 */
function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retrieves all active categories ordered by sort_order and name.
 */
export async function getActiveCategories(client?: ClientType): Promise<CatalogCategory[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active categories:', error.message);
      return [];
    }

    const rows = (data || []) as unknown as CategoryRow[];
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: c.sort_order,
    }));
  } catch (err) {
    console.error('Failed to load active categories:', err);
    return [];
  }
}

export interface CatalogFilterOptions {
  categorySlug?: string;
  search?: string;
  sort?: string;
}

/**
 * Retrieves published, currently active motorcycle models for the catalog.
 * Draft, archived, and future-scheduled models are strictly excluded.
 */
export async function getPublishedModels(
  options: CatalogFilterOptions = {},
  client?: ClientType
): Promise<CatalogModelSummary[]> {
  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();
    const today = getTodayIsoDate();

    let query = supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        short_description,
        engine_cc,
        transmission,
        is_featured,
        is_new,
        status,
        published_at,
        category:categories!inner(id, name, slug, is_active),
        images:model_images(id, storage_path, alt_text, image_role, sort_order),
        variants:motorcycle_variants(
          id,
          name,
          status,
          sort_order,
          price_entries(id, amount_idr, price_type, is_published, valid_from, valid_until)
        )
      `
      )
      .eq('status', 'published')
      .eq('category.is_active', true)
      .or(`published_at.is.null,published_at.lte.${nowIso}`);

    if (options.categorySlug && options.categorySlug !== 'all') {
      query = query.eq('category.slug', options.categorySlug);
    }

    if (options.search && options.search.trim().length > 0) {
      query = query.ilike('name', `%${options.search.trim()}%`);
    }

    query = query
      .order('is_featured', { ascending: false })
      .order('is_new', { ascending: false })
      .order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error querying published motorcycle models:', error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    const rows = data as unknown as ModelSummaryRow[];
    const models: CatalogModelSummary[] = [];

    for (const item of rows) {
      // Pick best primary image: 'card' > 'hero' > 'gallery' > first
      const images = (item.images || []).sort((a, b) => a.sort_order - b.sort_order);
      const cardImage =
        images.find((img) => img.image_role === 'card') ||
        images.find((img) => img.image_role === 'hero') ||
        images[0];

      // Calculate starting price strictly from active variants and valid price entries
      let startingPrice: number | null = null;
      const activeVariants = (item.variants || []).filter((v) => v.status === 'active');

      for (const variant of activeVariants) {
        const validPrices = (variant.price_entries || []).filter((p) => {
          if (!p.is_published) return false;
          if (p.valid_from > today) return false;
          if (p.valid_until && p.valid_until < today) return false;
          return p.amount_idr > 0;
        });

        for (const price of validPrices) {
          if (startingPrice === null || price.amount_idr < startingPrice) {
            startingPrice = price.amount_idr;
          }
        }
      }

      models.push({
        id: item.id,
        name: item.name,
        slug: item.slug,
        category: {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
        },
        shortDescription: item.short_description,
        engineCc: item.engine_cc,
        transmission: item.transmission,
        isFeatured: item.is_featured,
        isNew: item.is_new,
        primaryImage: cardImage
          ? {
              storagePath: cardImage.storage_path,
              altText: cardImage.alt_text,
            }
          : null,
        startingPriceIdr: startingPrice,
      });
    }

    // Apply sorting if requested
    if (options.sort === 'price_asc') {
      models.sort((a, b) => {
        if (a.startingPriceIdr === null) return 1;
        if (b.startingPriceIdr === null) return -1;
        return a.startingPriceIdr - b.startingPriceIdr;
      });
    } else if (options.sort === 'price_desc') {
      models.sort((a, b) => {
        if (a.startingPriceIdr === null) return 1;
        if (b.startingPriceIdr === null) return -1;
        return b.startingPriceIdr - a.startingPriceIdr;
      });
    } else if (options.sort === 'name_asc') {
      models.sort((a, b) => a.name.localeCompare(b.name));
    }

    return models;
  } catch (err) {
    console.error('Failed to load published models:', err);
    return [];
  }
}

/**
 * Retrieves detailed data for a single published motorcycle model by slug.
 * Returns null if the model is not found, draft, archived, or scheduled for future publication.
 */
export async function getPublishedModelBySlug(
  slug: string,
  client?: ClientType
): Promise<CatalogModelDetail | null> {
  if (!slug || slug.trim() === '') {
    return null;
  }

  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();
    const today = getTodayIsoDate();

    const { data, error } = await supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        short_description,
        description,
        engine_cc,
        transmission,
        key_specs,
        is_featured,
        is_new,
        status,
        seo_title,
        seo_description,
        published_at,
        category:categories!inner(id, name, slug, is_active),
        images:model_images(id, storage_path, alt_text, image_role, sort_order, variant_id, color_id),
        variants:motorcycle_variants(
          id,
          name,
          code,
          description,
          sort_order,
          status,
          variant_colors(
            id,
            color_id,
            image_path,
            is_available,
            sort_order,
            color:colors(id, name, slug, hex_code)
          ),
          price_entries(id, amount_idr, price_type, is_published, valid_from, valid_until)
        )
      `
      )
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('category.is_active', true)
      .or(`published_at.is.null,published_at.lte.${nowIso}`)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error(`Error querying model for slug ${slug}:`, error.message);
      }
      return null;
    }

    const item = data as unknown as ModelDetailRow;

    // Process images
    const images: CatalogModelImage[] = (item.images || [])
      .map((img) => ({
        id: img.id,
        storagePath: img.storage_path,
        altText: img.alt_text,
        imageRole: img.image_role as 'hero' | 'card' | 'gallery' | 'color',
        sortOrder: img.sort_order,
        variantId: img.variant_id || null,
        colorId: img.color_id || null,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Process variants and colors
    let overallMinPrice: number | null = null;
    const activeVariants = (item.variants || [])
      .filter((v) => v.status === 'active')
      .sort((a, b) => a.sort_order - b.sort_order);

    const variants: CatalogVariant[] = [];

    for (const variant of activeVariants) {
      // Compute variant price
      let variantMinPrice: number | null = null;
      const validPrices = (variant.price_entries || []).filter((p) => {
        if (!p.is_published) return false;
        if (p.valid_from > today) return false;
        if (p.valid_until && p.valid_until < today) return false;
        return p.amount_idr > 0;
      });

      for (const p of validPrices) {
        if (variantMinPrice === null || p.amount_idr < variantMinPrice) {
          variantMinPrice = p.amount_idr;
        }
      }

      if (variantMinPrice !== null) {
        if (overallMinPrice === null || variantMinPrice < overallMinPrice) {
          overallMinPrice = variantMinPrice;
        }
      }

      // Filter available colors
      const colors = (variant.variant_colors || [])
        .filter((vc) => vc.is_available && vc.color)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((vc) => ({
          id: vc.id,
          colorId: vc.color_id,
          name: vc.color.name,
          slug: vc.color.slug,
          hexCode: vc.color.hex_code,
          imagePath: vc.image_path,
          isAvailable: vc.is_available,
          sortOrder: vc.sort_order,
        }));

      variants.push({
        id: variant.id,
        modelId: item.id,
        name: variant.name,
        code: variant.code,
        description: variant.description,
        sortOrder: variant.sort_order,
        priceIdr: variantMinPrice,
        colors,
      });
    }

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: {
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
      },
      shortDescription: item.short_description,
      description: item.description,
      engineCc: item.engine_cc,
      transmission: item.transmission,
      keySpecs: item.key_specs || {},
      isFeatured: item.is_featured,
      isNew: item.is_new,
      seoTitle: item.seo_title,
      seoDescription: item.seo_description,
      publishedAt: item.published_at,
      images,
      variants,
      startingPriceIdr: overallMinPrice,
    };
  } catch (err) {
    console.error(`Failed to load model details for ${slug}:`, err);
    return null;
  }
}
