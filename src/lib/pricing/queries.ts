import { createClient } from '@/lib/supabase/server';
import type {
  CatalogPriceListItem,
  CategoryPriceGroup,
  PriceListFilterOptions,
} from '@/types/pricing';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeCity } from './validation';

type ClientType = SupabaseClient<Database>;

interface PriceEntryRow {
  id: string;
  city: string | null;
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
}

interface ModelWithPricingRow {
  id: string;
  name: string;
  slug: string;
  engine_cc: number | null;
  transmission: string | null;
  status: string;
  published_at: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
  };
  images: ImageRow[];
  variants: VariantRow[];
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) for comparing effective dates.
 */
function getTodayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retrieves published motorcycle models and variants with their valid effective OTR prices,
 * grouped by category and filtered by city.
 *
 * Excludes unpublished, draft, expired, or future-dated price entries.
 * Missing prices result in activePrice = null so the UI can display the verified price disclaimer.
 */
export async function getPublishedPriceList(
  options: PriceListFilterOptions = {},
  client?: ClientType
): Promise<CategoryPriceGroup[]> {
  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();
    const today = getTodayIsoDate();
    const targetCity = options.city || 'Sidoarjo';
    const normalizedTargetCity = normalizeCity(targetCity);

    let query = supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        engine_cc,
        transmission,
        status,
        published_at,
        category:categories!inner(id, name, slug, is_active, sort_order),
        images:model_images(id, storage_path, alt_text, image_role, sort_order),
        variants:motorcycle_variants(
          id,
          name,
          status,
          sort_order,
          price_entries(id, city, amount_idr, price_type, is_published, valid_from, valid_until)
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

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error querying published price list:', error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    const rows = data as unknown as ModelWithPricingRow[];
    const categoryGroupsMap = new Map<string, CategoryPriceGroup>();

    for (const model of rows) {
      // Pick best primary image: card > hero > gallery > first
      const sortedImages = (model.images || []).sort((a, b) => a.sort_order - b.sort_order);
      const cardImage =
        sortedImages.find((img) => img.image_role === 'card') ||
        sortedImages.find((img) => img.image_role === 'hero') ||
        sortedImages[0];

      const primaryImage = cardImage
        ? {
            storagePath: cardImage.storage_path,
            altText: cardImage.alt_text,
          }
        : null;

      const activeVariants = (model.variants || [])
        .filter((v) => v.status === 'active')
        .sort((a, b) => a.sort_order - b.sort_order);

      for (const variant of activeVariants) {
        // Find valid effective OTR price for the target city
        const validPrices = (variant.price_entries || [])
          .filter((p) => {
            if (!p.is_published) return false;
            if (p.price_type !== 'otr') return false;
            if (p.amount_idr <= 0) return false;
            if (p.valid_from > today) return false;
            if (p.valid_until && p.valid_until < today) return false;
            return normalizeCity(p.city) === normalizedTargetCity;
          })
          .sort((a, b) => b.valid_from.localeCompare(a.valid_from));

        const chosenPrice = validPrices[0] || null;

        const priceItem: CatalogPriceListItem = {
          modelId: model.id,
          modelName: model.name,
          modelSlug: model.slug,
          category: {
            id: model.category.id,
            name: model.category.name,
            slug: model.category.slug,
          },
          variantId: variant.id,
          variantName: variant.name,
          engineCc: model.engine_cc,
          transmission: model.transmission,
          primaryImage,
          activePrice: chosenPrice
            ? {
                id: chosenPrice.id,
                amountIdr: chosenPrice.amount_idr,
                priceType: 'otr',
                city: targetCity,
                validFrom: chosenPrice.valid_from,
                validUntil: chosenPrice.valid_until,
              }
            : null,
        };

        const catId = model.category.id;
        if (!categoryGroupsMap.has(catId)) {
          categoryGroupsMap.set(catId, {
            categoryId: model.category.id,
            categoryName: model.category.name,
            categorySlug: model.category.slug,
            categorySortOrder: model.category.sort_order,
            items: [],
          });
        }

        categoryGroupsMap.get(catId)!.items.push(priceItem);
      }
    }

    return Array.from(categoryGroupsMap.values()).sort(
      (a, b) =>
        a.categorySortOrder - b.categorySortOrder || a.categoryName.localeCompare(b.categoryName)
    );
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load published price list:', err);
    return [];
  }
}
