'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import {
  createMotorcycleModelSchema,
  updateMotorcycleModelSchema,
  type CreateMotorcycleModelInput,
  type UpdateMotorcycleModelInput,
  type ModelStatus,
  type AdminMotorcycleDetail,
} from '@/types/motorcycle';
import { getAdminMotorcycleModelById } from '@/lib/motorcycles/queries';
import type { Database } from '@/types/database';
import type { ActionResponse } from '@/lib/admin/actions';

type ModelRow = Database['public']['Tables']['motorcycle_models']['Row'];
type VariantRow = Database['public']['Tables']['motorcycle_variants']['Row'];

function isUniqueSlugError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '23505' ||
    (typeof error.message === 'string' &&
      (error.message.includes('motorcycle_models_slug_key') ||
        error.message.includes('duplicate key value violates unique constraint')))
  );
}

function isNextRedirectError(err: unknown): boolean {
  if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) return true;
  return false;
}

/**
 * Creates a new motorcycle model with optional variants, variant colors, and images.
 */
export async function createMotorcycleModelAction(
  input: CreateMotorcycleModelInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    await requireAdmin();

    const parsed = createMotorcycleModelSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Validasi formulir model motor gagal.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    // Check slug uniqueness beforehand
    const { data: existingSlug } = await supabase
      .from('motorcycle_models')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        success: false,
        error: 'Slug URL sudah digunakan oleh model lain. Silakan gunakan slug yang berbeda.',
        fieldErrors: {
          slug: ['Slug sudah terdaftar di sistem.'],
        },
      };
    }

    const publishedAt = data.status === 'published' ? new Date().toISOString() : null;

    const modelInsertPayload: Database['public']['Tables']['motorcycle_models']['Insert'] = {
      name: data.name,
      slug: data.slug,
      category_id: data.categoryId,
      short_description: data.shortDescription || null,
      description: data.description || null,
      engine_cc: data.engineCc ?? null,
      transmission: data.transmission || null,
      is_featured: data.isFeatured,
      is_new: data.isNew,
      status: data.status,
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      published_at: publishedAt,
    };

    // 1. Insert motorcycle_models record
    const { data: insertedModel, error: modelError } = await supabase
      .from('motorcycle_models')
      .insert(modelInsertPayload as never)
      .select('id, name, slug')
      .single();

    if (modelError || !insertedModel) {
      if (isUniqueSlugError(modelError)) {
        return {
          success: false,
          error: 'Slug URL sudah digunakan. Silakan gunakan slug yang unik.',
          fieldErrors: { slug: ['Slug sudah terdaftar.'] },
        };
      }
      console.error('Failed to insert motorcycle model:', modelError?.message);
      return {
        success: false,
        error: `Gagal menyimpan model motor: ${modelError?.message || 'Kesalahan basis data.'}`,
      };
    }

    const modelRecord = insertedModel as unknown as Pick<ModelRow, 'id' | 'name' | 'slug'>;
    const modelId = modelRecord.id;

    // 2. Insert variants and their colors
    if (data.variants && data.variants.length > 0) {
      for (let i = 0; i < data.variants.length; i++) {
        const v = data.variants[i];
        const variantPayload: Database['public']['Tables']['motorcycle_variants']['Insert'] = {
          model_id: modelId,
          name: v.name,
          code: v.code || null,
          description: v.description || null,
          sort_order: v.sortOrder ?? i + 1,
          status: v.status || 'active',
        };

        const { data: insertedVariant, error: variantError } = await supabase
          .from('motorcycle_variants')
          .insert(variantPayload as never)
          .select('id')
          .single();

        if (variantError) {
          console.error(`Error inserting variant ${v.name}:`, variantError.message);
        } else if (insertedVariant && v.colorIds && v.colorIds.length > 0) {
          const variantRecord = insertedVariant as unknown as { id: string };
          const colorPayloads: Database['public']['Tables']['variant_colors']['Insert'][] =
            v.colorIds.map((colorId, cIdx) => ({
              variant_id: variantRecord.id,
              color_id: colorId,
              is_available: true,
              sort_order: cIdx + 1,
            }));

          const { error: colorError } = await supabase
            .from('variant_colors')
            .insert(colorPayloads as never);
          if (colorError) {
            console.error(`Error inserting colors for variant ${v.name}:`, colorError.message);
          }
        }
      }
    }

    // 3. Insert images
    if (data.images && data.images.length > 0) {
      const imagePayloads: Database['public']['Tables']['model_images']['Insert'][] =
        data.images.map((img, idx) => ({
          model_id: modelId,
          storage_path: img.storagePath,
          alt_text: img.altText,
          image_role: img.imageRole,
          sort_order: img.sortOrder ?? idx + 1,
        }));

      const { error: imageError } = await supabase
        .from('model_images')
        .insert(imagePayloads as never);
      if (imageError) {
        console.error('Error inserting model images:', imageError.message);
      }
    }

    // Log admin audit action
    await logAdminAction(
      {
        action: 'create',
        entityType: 'motorcycle_models',
        entityId: modelId,
        summary: `Membuat model motor: ${data.name} (${data.slug})`,
        metadata: {
          name: data.name,
          slug: data.slug,
          status: data.status,
          variantsCount: data.variants.length,
          imagesCount: data.images.length,
        },
      },
      supabase
    );

    revalidatePath('/admin/motor');
    revalidatePath('/motor');
    revalidatePath(`/motor/${data.slug}`);
    revalidatePath('/harga');
    revalidatePath('/');

    return {
      success: true,
      data: { id: modelId, slug: data.slug },
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    console.error('Error creating motorcycle model:', err);
    return {
      success: false,
      error: 'Terjadi kesalahan internal saat membuat model motor.',
    };
  }
}

/**
 * Updates an existing motorcycle model and synchronizes its variants and images.
 */
export async function updateMotorcycleModelAction(
  input: UpdateMotorcycleModelInput
): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    await requireAdmin();

    const parsed = updateMotorcycleModelSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || 'Validasi formulir pembaruan model gagal.',
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    // Verify existing model exists
    const { data: existingModelData, error: fetchError } = await supabase
      .from('motorcycle_models')
      .select('*')
      .eq('id', data.id)
      .maybeSingle();

    if (fetchError || !existingModelData) {
      return {
        success: false,
        error: 'Model motor tidak ditemukan.',
      };
    }

    const existingModel = existingModelData as unknown as ModelRow;

    // Check slug uniqueness (excluding current model ID)
    if (data.slug !== existingModel.slug) {
      const { data: duplicateSlug } = await supabase
        .from('motorcycle_models')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', data.id)
        .maybeSingle();

      if (duplicateSlug) {
        return {
          success: false,
          error: 'Slug URL sudah digunakan oleh model lain.',
          fieldErrors: { slug: ['Slug sudah terdaftar di sistem.'] },
        };
      }
    }

    let publishedAt = existingModel.published_at;
    if (data.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    } else if (data.status !== 'published') {
      publishedAt = null;
    }

    const modelUpdatePayload: Database['public']['Tables']['motorcycle_models']['Update'] = {
      name: data.name,
      slug: data.slug,
      category_id: data.categoryId,
      short_description: data.shortDescription || null,
      description: data.description || null,
      engine_cc: data.engineCc ?? null,
      transmission: data.transmission || null,
      is_featured: data.isFeatured,
      is_new: data.isNew,
      status: data.status,
      seo_title: data.seoTitle || null,
      seo_description: data.seoDescription || null,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    };

    // 1. Update motorcycle_models record
    const { error: updateError } = await supabase
      .from('motorcycle_models')
      .update(modelUpdatePayload as never)
      .eq('id', data.id);

    if (updateError) {
      if (isUniqueSlugError(updateError)) {
        return {
          success: false,
          error: 'Slug URL sudah digunakan. Silakan gunakan slug unik.',
          fieldErrors: { slug: ['Slug sudah terdaftar.'] },
        };
      }
      return {
        success: false,
        error: `Gagal memperbarui model motor: ${updateError.message}`,
      };
    }

    // 2. Synchronize variants:
    const { data: currentVariantsData } = await supabase
      .from('motorcycle_variants')
      .select('id, name')
      .eq('model_id', data.id);

    const currentVariants = (currentVariantsData as unknown as VariantRow[]) || [];
    const existingVariantMap = new Map(currentVariants.map((v) => [v.id, v]));
    const incomingVariantIds = new Set(data.variants.map((v) => v.id).filter(Boolean));

    // Delete variants that were removed
    for (const [existingId] of existingVariantMap.entries()) {
      if (!incomingVariantIds.has(existingId)) {
        // Check if variant has price entries before deleting
        const { count: priceCount } = await supabase
          .from('price_entries')
          .select('id', { count: 'exact', head: true })
          .eq('variant_id', existingId);

        if (!priceCount || priceCount === 0) {
          await supabase.from('motorcycle_variants').delete().eq('id', existingId);
        } else {
          // If variant has prices, softly deactivate it rather than cascade delete
          await supabase
            .from('motorcycle_variants')
            .update({ status: 'inactive' } as never)
            .eq('id', existingId);
        }
      }
    }

    // Upsert incoming variants
    for (let i = 0; i < data.variants.length; i++) {
      const v = data.variants[i];
      let variantId = v.id;

      if (variantId && existingVariantMap.has(variantId)) {
        // Update existing variant
        const updatePayload: Database['public']['Tables']['motorcycle_variants']['Update'] = {
          name: v.name,
          code: v.code || null,
          description: v.description || null,
          sort_order: v.sortOrder ?? i + 1,
          status: v.status || 'active',
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('motorcycle_variants')
          .update(updatePayload as never)
          .eq('id', variantId);
      } else {
        // Insert new variant
        const insertPayload: Database['public']['Tables']['motorcycle_variants']['Insert'] = {
          model_id: data.id,
          name: v.name,
          code: v.code || null,
          description: v.description || null,
          sort_order: v.sortOrder ?? i + 1,
          status: v.status || 'active',
        };

        const { data: newV } = await supabase
          .from('motorcycle_variants')
          .insert(insertPayload as never)
          .select('id')
          .single();

        if (newV) {
          variantId = (newV as unknown as { id: string }).id;
        }
      }

      // Sync colors for this variant
      if (variantId) {
        await supabase.from('variant_colors').delete().eq('variant_id', variantId);

        if (v.colorIds && v.colorIds.length > 0) {
          const colorPayloads: Database['public']['Tables']['variant_colors']['Insert'][] =
            v.colorIds.map((cId, cIdx) => ({
              variant_id: variantId,
              color_id: cId,
              is_available: true,
              sort_order: cIdx + 1,
            }));
          await supabase.from('variant_colors').insert(colorPayloads as never);
        }
      }
    }

    // 3. Synchronize images: delete and re-insert to guarantee sort_order & roles
    await supabase.from('model_images').delete().eq('model_id', data.id);

    if (data.images && data.images.length > 0) {
      const imagePayloads: Database['public']['Tables']['model_images']['Insert'][] =
        data.images.map((img, idx) => ({
          model_id: data.id,
          storage_path: img.storagePath,
          alt_text: img.altText,
          image_role: img.imageRole,
          sort_order: img.sortOrder ?? idx + 1,
        }));

      await supabase.from('model_images').insert(imagePayloads as never);
    }

    // Log admin audit action
    await logAdminAction(
      {
        action: 'update',
        entityType: 'motorcycle_models',
        entityId: data.id,
        summary: `Memperbarui model motor: ${data.name} (${data.slug})`,
        metadata: {
          name: data.name,
          slug: data.slug,
          status: data.status,
          variantsCount: data.variants.length,
          imagesCount: data.images.length,
        },
      },
      supabase
    );

    revalidatePath('/admin/motor');
    revalidatePath('/motor');
    revalidatePath(`/motor/${data.slug}`);
    if (existingModel.slug !== data.slug) {
      revalidatePath(`/motor/${existingModel.slug}`);
    }
    revalidatePath('/harga');
    revalidatePath('/');

    return {
      success: true,
      data: { id: data.id, slug: data.slug },
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    console.error('Error updating motorcycle model:', err);
    return {
      success: false,
      error: 'Terjadi kesalahan internal saat memperbarui model motor.',
    };
  }
}

/**
 * Toggles a motorcycle model's status between draft, published, and archived.
 */
export async function toggleMotorcycleModelStatusAction(
  id: string,
  targetStatus: ModelStatus
): Promise<ActionResponse<{ id: string; status: ModelStatus }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: modelData, error: fetchError } = await supabase
      .from('motorcycle_models')
      .select('id, slug, status, name, published_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !modelData) {
      return { success: false, error: 'Model motor tidak ditemukan.' };
    }

    const model = modelData as unknown as Pick<ModelRow, 'id' | 'slug' | 'status' | 'name' | 'published_at'>;

    let publishedAt = model.published_at;
    if (targetStatus === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    } else if (targetStatus !== 'published') {
      publishedAt = null;
    }

    const { error: updateError } = await supabase
      .from('motorcycle_models')
      .update({
        status: targetStatus,
        published_at: publishedAt,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id);

    if (updateError) {
      return {
        success: false,
        error: `Gagal mengubah status: ${updateError.message}`,
      };
    }

    await logAdminAction(
      {
        action: 'update',
        entityType: 'motorcycle_models',
        entityId: id,
        summary: `Mengubah status model motor "${model.name}" menjadi ${targetStatus}`,
        metadata: {
          previousStatus: model.status,
          newStatus: targetStatus,
        },
      },
      supabase
    );

    revalidatePath('/admin/motor');
    revalidatePath('/motor');
    revalidatePath(`/motor/${model.slug}`);
    revalidatePath('/harga');
    revalidatePath('/');

    return {
      success: true,
      data: { id, status: targetStatus },
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    console.error('Error toggling motorcycle status:', err);
    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat memperbarui status model.',
    };
  }
}

/**
 * Safely deletes a motorcycle model only if no dependent records (leads, prices, promotions) exist.
 * Permanent deletion is blocked if dependencies are detected, advising deactivation/archiving instead.
 */
export async function deleteMotorcycleModelAction(
  id: string
): Promise<ActionResponse<{ id: string; blocked?: boolean; reason?: string }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // 1. Check if model exists
    const { data: modelData, error: fetchError } = await supabase
      .from('motorcycle_models')
      .select('id, name, slug')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !modelData) {
      return { success: false, error: 'Model motor tidak ditemukan.' };
    }

    const model = modelData as unknown as Pick<ModelRow, 'id' | 'name' | 'slug'>;

    // 2. Dependency Check: leads
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('model_id', id);

    if (leadsCount && leadsCount > 0) {
      return {
        success: false,
        error: `Model "${model.name}" tidak dapat dihapus permanen karena tercatat dalam ${leadsCount} inquiry pelanggan. Silakan arsipkan model ini untuk menyembunyikannya dari katalog publik tanpa menghapus riwayat inquiry.`,
        data: { id, blocked: true, reason: 'leads_exist' },
      };
    }

    // 3. Dependency Check: price_entries attached to any variant of this model
    const { data: variantIds } = await supabase
      .from('motorcycle_variants')
      .select('id')
      .eq('model_id', id);

    type VariantIdRow = { id: string };
    const typedVariants = (variantIds as unknown as VariantIdRow[]) || [];

    if (typedVariants.length > 0) {
      const vIds = typedVariants.map((v) => v.id);
      const { count: pricesCount } = await supabase
        .from('price_entries')
        .select('id', { count: 'exact', head: true })
        .in('variant_id', vIds);

      if (pricesCount && pricesCount > 0) {
        return {
          success: false,
          error: `Model "${model.name}" tidak dapat dihapus permanen karena masih memiliki ${pricesCount} data harga OTR aktif. Hapus data harga terkait terlebih dahulu atau arsipkan model ini.`,
          data: { id, blocked: true, reason: 'prices_exist' },
        };
      }
    }

    // 4. Dependency Check: promotions
    const { count: promoCount } = await supabase
      .from('promotion_models')
      .select('promotion_id', { count: 'exact', head: true })
      .eq('model_id', id);

    if (promoCount && promoCount > 0) {
      return {
        success: false,
        error: `Model "${model.name}" masih terhubung dengan ${promoCount} program promosi aktif. Lepaskan model dari promo terkait terlebih dahulu atau ubah statusnya menjadi draf/arsip.`,
        data: { id, blocked: true, reason: 'promotions_exist' },
      };
    }

    // 5. If completely free of dependencies, perform safe deletion
    const { error: deleteError } = await supabase.from('motorcycle_models').delete().eq('id', id);

    if (deleteError) {
      return {
        success: false,
        error: `Gagal menghapus model motor: ${deleteError.message}`,
      };
    }

    // Log admin audit action
    await logAdminAction(
      {
        action: 'delete',
        entityType: 'motorcycle_models',
        entityId: id,
        summary: `Menghapus model motor: ${model.name} (${model.slug})`,
        metadata: {
          name: model.name,
          slug: model.slug,
        },
      },
      supabase
    );

    revalidatePath('/admin/motor');
    revalidatePath('/motor');
    revalidatePath(`/motor/${model.slug}`);
    revalidatePath('/harga');
    revalidatePath('/');

    return {
      success: true,
      data: { id },
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    console.error('Error deleting motorcycle model:', err);
    return {
      success: false,
      error: 'Terjadi kesalahan sistem saat menghapus model motor.',
    };
  }
}

/**
 * Loads detailed model data for editing in admin modal.
 * This is a server action callable by client components without importing server modules.
 */
export async function getMotorcycleModelDetailAction(
  id: string
): Promise<ActionResponse<AdminMotorcycleDetail>> {
  try {
    await requireAdmin();
    const detail = await getAdminMotorcycleModelById(id);
    if (!detail) {
      return { success: false, error: 'Model motor tidak ditemukan.' };
    }
    return { success: true, data: detail };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    console.error('Error fetching motorcycle model detail action:', err);
    return {
      success: false,
      error: 'Gagal memuat detail model motor.',
    };
  }
}