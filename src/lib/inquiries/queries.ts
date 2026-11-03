import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { InquiryModelOption } from '@/types/inquiries';

type ClientType = SupabaseClient<Database>;

/**
 * Fetches published motorcycle models, active variants, and available colors
 * to populate the public inquiry form.
 */
export async function getInquiryModelOptions(client?: ClientType): Promise<InquiryModelOption[]> {
  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('motorcycle_models')
      .select(
        `
        id,
        name,
        slug,
        status,
        variants:motorcycle_variants (
          id,
          name,
          code,
          status,
          sort_order,
          price_entries (
            amount_idr,
            is_published,
            valid_from,
            valid_until
          ),
          variant_colors (
            is_available,
            sort_order,
            color:colors (
              id,
              name,
              hex_code
            )
          )
        )
      `
      )
      .eq('status', 'published')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching inquiry model options:', error.message);
      return [];
    }

    if (!data) return [];

    const today = new Date().toISOString().split('T')[0];

    type ModelRow = {
      id: string;
      name: string;
      slug: string;
      variants: Array<{
        id: string;
        name: string;
        code: string | null;
        status: string;
        sort_order: number;
        price_entries: Array<{
          amount_idr: number;
          is_published: boolean;
          valid_from: string;
          valid_until: string | null;
        }>;
        variant_colors: Array<{
          is_available: boolean;
          sort_order: number;
          color: {
            id: string;
            name: string;
            hex_code: string | null;
          } | null;
        }>;
      }>;
    };

    const models = data as unknown as ModelRow[];

    return models.map((m) => {
      const activeVariants = (m.variants || [])
        .filter((v) => v.status === 'active')
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      return {
        id: m.id,
        name: m.name,
        slug: m.slug,
        variants: activeVariants.map((v) => {
          // Find currently active price
          const activePrice = (v.price_entries || []).find(
            (p) =>
              p.is_published && p.valid_from <= today && (!p.valid_until || p.valid_until >= today)
          );

          const availableColors = (v.variant_colors || [])
            .filter((vc) => vc.is_available && vc.color)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((vc) => ({
              id: vc.color!.id,
              name: vc.color!.name,
              hexCode: vc.color!.hex_code,
            }));

          return {
            id: v.id,
            name: v.name,
            code: v.code,
            priceIdr: activePrice ? activePrice.amount_idr : null,
            colors: availableColors,
          };
        }),
      };
    });
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load inquiry model options:', err);
    return [];
  }
}
