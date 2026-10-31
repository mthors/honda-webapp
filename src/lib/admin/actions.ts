'use server';

import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { createPriceEntrySchema, updatePriceEntrySchema } from '@/types/pricing';
import {
  createPromotionSchema,
  updatePromotionSchema,
  createHeroBannerSchema,
  updateHeroBannerSchema,
} from '@/types/promotions';
import { normalizeCity } from '@/lib/pricing/validation';

export type UpsertPriceInput =
  z.input<typeof createPriceEntrySchema> | z.input<typeof updatePriceEntrySchema>;

export type UpsertPromotionInput =
  z.input<typeof createPromotionSchema> | z.input<typeof updatePromotionSchema>;

export type UpsertHeroBannerInput =
  z.input<typeof createHeroBannerSchema> | z.input<typeof updateHeroBannerSchema>;

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// ============================================================================
// 1. PRICE MANAGEMENT ACTIONS
// ============================================================================

export async function upsertPriceAction(input: UpsertPriceInput): Promise<ActionResponse> {
  try {
    // 1. Enforce admin authentication server-side
    const session = await requireAdmin();

    const isUpdate = 'id' in input && Boolean(input.id);
    const schema = isUpdate ? updatePriceEntrySchema : createPriceEntrySchema;
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage = parsed.error.issues[0]?.message || 'Validasi formulir harga gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const normalizedCityVal = data.city ? normalizeCity(data.city) : null;

    // Default unpublished for safety
    const isPublishedVal = typeof data.isPublished === 'boolean' ? data.isPublished : false;

    const supabase = await createClient();

    // Prepare human-readable audit summary
    const actionLabel = isUpdate ? 'Memperbarui' : 'Menambahkan';
    const variantDisplay = data.variantId || 'terdaftar';
    const auditSummary = `${actionLabel} entri harga OTR varian ${variantDisplay}${
      data.city ? ` untuk wilayah ${data.city}` : ''
    } sebesar Rp ${(data.amountIdr ?? 0).toLocaleString('id-ID')} (${data.priceType || 'otr'}) oleh ${session.profile.displayName}`;

    // Execute atomic, concurrency-safe database RPC
    const { data: result, error: rpcError } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    )('admin_upsert_price_entry', {
      p_id: isUpdate && 'id' in data ? (data.id as string) : null,
      p_variant_id: data.variantId ?? null,
      p_city: normalizedCityVal ? data.city?.trim() || null : null,
      p_price_type: (data.priceType || 'otr') as string,
      p_amount_idr: Number(data.amountIdr),
      p_valid_from: data.validFrom as string,
      p_valid_until: data.validUntil || null,
      p_is_published: isPublishedVal,
      p_source_note: data.sourceNote || null,
      p_summary: auditSummary,
    });

    if (rpcError) {
      return {
        success: false,
        error: rpcError.message || 'Gagal menyimpan data harga ke basis data.',
      };
    }

    revalidatePath('/admin/harga');
    revalidatePath('/harga');
    revalidatePath('/');

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    const message =
      err instanceof Error ? err.message : 'Terjadi kendala saat memproses data harga.';
    return {
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// 2. PROMOTION MANAGEMENT ACTIONS
// ============================================================================

export async function upsertPromotionAction(input: UpsertPromotionInput): Promise<ActionResponse> {
  try {
    // 1. Enforce admin authentication server-side
    const session = await requireAdmin();

    const isUpdate = 'id' in input && Boolean(input.id);
    const schema = isUpdate ? updatePromotionSchema : createPromotionSchema;
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage = parsed.error.issues[0]?.message || 'Validasi formulir promo gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const actionLabel = isUpdate ? 'Memperbarui' : 'Menambahkan';
    const auditSummary = `${actionLabel} data promosi "${data.title}" (${data.status || 'draft'}) oleh ${session.profile.displayName}`;

    const { data: result, error: rpcError } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    )('admin_upsert_promotion', {
      p_id: isUpdate && 'id' in data ? (data.id as string) : null,
      p_title: data.title as string,
      p_slug: data.slug as string,
      p_summary: data.summary as string,
      p_details: data.details || null,
      p_image_path: data.imagePath || null,
      p_starts_at: data.startsAt as string,
      p_ends_at: data.endsAt as string,
      p_terms: data.terms || null,
      p_status: (data.status || 'draft') as string,
      p_cta_label: data.ctaLabel || null,
      p_cta_url: data.ctaUrl || null,
      p_model_ids: data.modelIds || [],
      p_audit_summary: auditSummary,
    });

    if (rpcError) {
      return {
        success: false,
        error: rpcError.message || 'Gagal menyimpan data promo ke basis data.',
      };
    }

    revalidatePath('/admin/promo');
    revalidatePath('/promo');
    revalidatePath('/');

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Terjadi kendala saat memproses promo.';
    return {
      success: false,
      error: message,
    };
  }
}

// ============================================================================
// 3. HERO BANNER MANAGEMENT ACTIONS
// ============================================================================

export async function upsertHeroBannerAction(
  input: UpsertHeroBannerInput
): Promise<ActionResponse> {
  try {
    // 1. Enforce admin authentication server-side
    const session = await requireAdmin();

    const isUpdate = 'id' in input && Boolean(input.id);
    const schema = isUpdate ? updateHeroBannerSchema : createHeroBannerSchema;
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir spanduk gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const actionLabel = isUpdate ? 'Memperbarui' : 'Menambahkan';
    const auditSummary = `${actionLabel} spanduk hero "${data.title}" (urutan: ${data.sortOrder ?? 0}, status: ${data.status || 'draft'}) oleh ${session.profile.displayName}`;

    const { data: result, error: rpcError } = await (
      supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    )('admin_upsert_hero_banner', {
      p_id: isUpdate && 'id' in data ? (data.id as string) : null,
      p_title: data.title as string,
      p_subtitle: data.subtitle || null,
      p_desktop_image_path: data.desktopImagePath as string,
      p_mobile_image_path: data.mobileImagePath || null,
      p_alt_text: data.altText as string,
      p_cta_label: data.ctaLabel || null,
      p_cta_url: data.ctaUrl || null,
      p_starts_at: data.startsAt || null,
      p_ends_at: data.endsAt || null,
      p_sort_order: data.sortOrder ?? 0,
      p_status: (data.status || 'draft') as string,
      p_audit_summary: auditSummary,
    });

    if (rpcError) {
      return {
        success: false,
        error: rpcError.message || 'Gagal menyimpan spanduk hero ke basis data.',
      };
    }

    revalidatePath('/admin/banner');
    revalidatePath('/');

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    const message =
      err instanceof Error ? err.message : 'Terjadi kendala saat memproses spanduk hero.';
    return {
      success: false,
      error: message,
    };
  }
}
