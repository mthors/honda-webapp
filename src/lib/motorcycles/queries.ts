import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type {
  AdminMotorcycleItem,
  AdminMotorcycleDetail,
  AdminCategoryOption,
  AdminColorOption,
  ModelStatus,
  VariantStatus,
  ImageRole,
} from '@/types/motorcycle';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientType = SupabaseClient<Database>;

interface ModelRow {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  short_description: string | null;
  description: string | null;
  engine_cc: number | null;
  transmission: string | null;
  is_featured: boolean;
  is_new: boolean;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category: { id: string; name: string; slug: string } | null;
  images: Array<{
    id: string;
    storage_path: string;
    alt_text: string;
    image_role: string;
    sort_order: number;
  }> | null;
  variants: Array<{
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    sort_order: number;
    status: string;
    variant_colors?: Array<{ color_id: string }> | null;
    price_entries?: Array<{
      amount_idr: number;
      is_published: boolean;
    }> | null;
  }> | null;
}

/**
 * Loads all motorcycle models with their categories, image counts, and variant counts for admin management.
 */
export async function getAdminMotorcycleModels(client?: ClientType): Promise<AdminMotorcycleItem[]> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        category_id,
        short_description,
        engine_cc,
        transmission,
        is_featured,
        is_new,
        status,
        published_at,
        created_at,
        updated_at,
        category:categories(id, name, slug),
        images:model_images(id, storage_path, alt_text, image_role, sort_order),
        variants:motorcycle_variants(
          id,
          name,
          status,
          sort_order,
          price_entries(amount_idr, is_published)
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin motorcycle models:', error.message);
      return [];
    }

    if (!data) return [];

    const rows = data as unknown as ModelRow[];

    return rows.map((r) => {
      const cardImage =
        (r.images || []).find((img) => img.image_role === 'card') ||
        (r.images || []).sort((a, b) => a.sort_order - b.sort_order)[0] ||
        null;

      let minPrice: number | null = null;
      (r.variants || []).forEach((v) => {
        (v.price_entries || []).forEach((p) => {
          if (p.is_published && p.amount_idr > 0) {
            if (minPrice === null || p.amount_idr < minPrice) {
              minPrice = p.amount_idr;
            }
          }
        });
      });

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        categoryId: r.category_id,
        categoryName: r.category?.name || 'Tanpa Kategori',
        categorySlug: r.category?.slug || '',
        shortDescription: r.short_description,
        engineCc: r.engine_cc,
        transmission: r.transmission,
        isFeatured: r.is_featured,
        isNew: r.is_new,
        status: (r.status as ModelStatus) || 'draft',
        publishedAt: r.published_at,
        primaryImage: cardImage
          ? {
              storagePath: cardImage.storage_path,
              altText: cardImage.alt_text,
            }
          : null,
        variantCount: (r.variants || []).length,
        imageCount: (r.images || []).length,
        startingPriceIdr: minPrice,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin motorcycle models:', err);
    return [];
  }
}

/**
 * Loads a single motorcycle model by ID including its variants, colors, and images for editing.
 */
export async function getAdminMotorcycleModelById(
  id: string,
  client?: ClientType
): Promise<AdminMotorcycleDetail | null> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        category_id,
        short_description,
        description,
        engine_cc,
        transmission,
        is_featured,
        is_new,
        status,
        seo_title,
        seo_description,
        published_at,
        created_at,
        updated_at,
        category:categories(id, name, slug),
        images:model_images(id, storage_path, alt_text, image_role, sort_order),
        variants:motorcycle_variants(
          id,
          name,
          code,
          description,
          sort_order,
          status,
          variant_colors(color_id),
          price_entries(amount_idr, is_published)
        )
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Error fetching admin motorcycle model by id:', error.message);
      return null;
    }

    const r = data as unknown as ModelRow;

    const cardImage =
      (r.images || []).find((img) => img.image_role === 'card') ||
      (r.images || []).sort((a, b) => a.sort_order - b.sort_order)[0] ||
      null;

    let minPrice: number | null = null;
    (r.variants || []).forEach((v) => {
      (v.price_entries || []).forEach((p) => {
        if (p.is_published && p.amount_idr > 0) {
          if (minPrice === null || p.amount_idr < minPrice) {
            minPrice = p.amount_idr;
          }
        }
      });
    });

    const variants = (r.variants || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => ({
        id: v.id,
        name: v.name,
        code: v.code,
        description: v.description,
        sortOrder: v.sort_order,
        status: (v.status as VariantStatus) || 'active',
        colorIds: (v.variant_colors || []).map((vc) => vc.color_id),
      }));

    const images = (r.images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        storagePath: img.storage_path,
        altText: img.alt_text,
        imageRole: (img.image_role as ImageRole) || 'gallery',
        sortOrder: img.sort_order,
      }));

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      categoryId: r.category_id,
      categoryName: r.category?.name || 'Tanpa Kategori',
      categorySlug: r.category?.slug || '',
      shortDescription: r.short_description,
      description: r.description,
      engineCc: r.engine_cc,
      transmission: r.transmission,
      isFeatured: r.is_featured,
      isNew: r.is_new,
      status: (r.status as ModelStatus) || 'draft',
      seoTitle: r.seo_title,
      seoDescription: r.seo_description,
      publishedAt: r.published_at,
      primaryImage: cardImage
        ? {
            storagePath: cardImage.storage_path,
            altText: cardImage.alt_text,
          }
        : null,
      variantCount: variants.length,
      imageCount: images.length,
      startingPriceIdr: minPrice,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      variants,
      images,
    };
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin motorcycle model details:', err);
    return null;
  }
}

/**
 * Loads categories and colors for selection options in motorcycle forms.
 */
export async function getAdminCategoriesAndColors(client?: ClientType): Promise<{
  categories: AdminCategoryOption[];
  colors: AdminColorOption[];
}> {
  try {
    const supabase = client ?? (await createClient());

    type CategoryDbRow = Database['public']['Tables']['categories']['Row'];
    type ColorDbRow = Database['public']['Tables']['colors']['Row'];

    const { data: catData } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true });

    const { data: colorData } = await supabase
      .from('colors')
      .select('id, name, slug, hex_code')
      .order('name', { ascending: true });

    const categories = ((catData as CategoryDbRow[]) || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));

    const colors = ((colorData as ColorDbRow[]) || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      hexCode: c.hex_code,
    }));

    return { categories, colors };
  } catch (err) {
    console.error('Failed to load categories and colors for admin:', err);
    return { categories: [], colors: [] };
  }
}
