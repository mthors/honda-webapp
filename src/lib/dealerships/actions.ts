'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import {
  createDealershipSchema,
  updateDealershipSchema,
  type CreateDealershipInput,
  type UpdateDealershipInput,
  type DealershipItem,
} from '@/types/dealership';
import type { ActionResponse } from '@/lib/admin/actions';
import type { Database } from '@/types/database';

function mapDealershipRow(row: Database['public']['Tables']['dealerships']['Row']): DealershipItem {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    city: row.city,
    address: row.address,
    phone: row.phone,
    whatsappNumber: row.whatsapp_number,
    openingHours: row.opening_hours,
    isSynthetic: row.is_synthetic,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cleanOptionalField(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed === '' ? null : trimmed;
}

function isUniqueCodeError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '23505' ||
    (typeof error.message === 'string' &&
      (error.message.includes('dealerships_code_key') ||
        error.message.includes('duplicate key value violates unique constraint')))
  );
}

function isForeignKeyError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '23503' ||
    (typeof error.message === 'string' && error.message.includes('violates foreign key constraint'))
  );
}

function isNextRedirectError(err: unknown): boolean {
  if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) return true;
  if ((err as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) return true;
  return false;
}

/**
 * Creates a new dealership record in public.dealerships.
 * Enforces admin authorization and records an audit log entry.
 */
export async function createDealershipAction(
  input: CreateDealershipInput
): Promise<ActionResponse<DealershipItem>> {
  try {
    const session = await requireAdmin();

    const parsed = createDealershipSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir dealer baru gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const insertPayload: Database['public']['Tables']['dealerships']['Insert'] = {
      name: data.name.trim(),
      code: data.code.trim().toLowerCase(),
      city: data.city.trim(),
      address: cleanOptionalField(data.address),
      phone: cleanOptionalField(data.phone),
      whatsapp_number: cleanOptionalField(data.whatsappNumber),
      opening_hours: cleanOptionalField(data.openingHours),
      is_synthetic: Boolean(data.isSynthetic),
      is_active: Boolean(data.isActive),
      sort_order: data.sortOrder ?? 0,
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('dealerships')
      .insert(insertPayload as never)
      .select('*')
      .single();

    if (insertError || !insertedRow) {
      if (isUniqueCodeError(insertError)) {
        return {
          success: false,
          error: 'Kode dealer sudah digunakan oleh dealer lain. Gunakan kode yang unik.',
          fieldErrors: {
            code: ['Kode dealer sudah digunakan oleh dealer lain.'],
          },
        };
      }
      return {
        success: false,
        error: insertError?.message || 'Gagal menambahkan data dealer ke basis data.',
      };
    }

    const row = insertedRow as unknown as Database['public']['Tables']['dealerships']['Row'];
    const dealership = mapDealershipRow(row);

    await logAdminAction({
      action: 'create_dealership',
      entityType: 'dealership',
      entityId: dealership.id,
      summary: `Menambahkan entitas dealer "${dealership.name}" (${dealership.code}) di ${dealership.city} oleh ${session.profile.displayName}`,
      metadata: {
        dealershipCode: dealership.code,
        dealershipName: dealership.name,
        city: dealership.city,
        isSynthetic: dealership.isSynthetic,
        isActive: dealership.isActive,
      },
    });

    revalidatePath('/admin/dealerships');
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: dealership,
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kendala sistem tak terduga.',
    };
  }
}

/**
 * Updates an existing dealership record in public.dealerships.
 * Enforces admin authorization and records an audit log entry.
 */
export async function updateDealershipAction(
  input: UpdateDealershipInput
): Promise<ActionResponse<DealershipItem>> {
  try {
    const session = await requireAdmin();

    const parsed = updateDealershipSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir perubahan dealer gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const updatePayload: Database['public']['Tables']['dealerships']['Update'] = {
      name: data.name.trim(),
      code: data.code.trim().toLowerCase(),
      city: data.city.trim(),
      address: cleanOptionalField(data.address),
      phone: cleanOptionalField(data.phone),
      whatsapp_number: cleanOptionalField(data.whatsappNumber),
      opening_hours: cleanOptionalField(data.openingHours),
      is_synthetic: Boolean(data.isSynthetic),
      is_active: Boolean(data.isActive),
      sort_order: data.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRow, error: updateError } = await supabase
      .from('dealerships')
      .update(updatePayload as never)
      .eq('id', data.id)
      .select('*')
      .single();

    if (updateError || !updatedRow) {
      if (isUniqueCodeError(updateError)) {
        return {
          success: false,
          error: 'Kode dealer sudah digunakan oleh dealer lain. Gunakan kode yang unik.',
          fieldErrors: {
            code: ['Kode dealer sudah digunakan oleh dealer lain.'],
          },
        };
      }
      return {
        success: false,
        error: updateError?.message || 'Gagal memperbarui data dealer di basis data.',
      };
    }

    const row = updatedRow as unknown as Database['public']['Tables']['dealerships']['Row'];
    const dealership = mapDealershipRow(row);

    await logAdminAction({
      action: 'update_dealership',
      entityType: 'dealership',
      entityId: dealership.id,
      summary: `Memperbarui entitas dealer "${dealership.name}" (${dealership.code}) oleh ${session.profile.displayName}`,
      metadata: {
        dealershipCode: dealership.code,
        dealershipName: dealership.name,
        city: dealership.city,
        isSynthetic: dealership.isSynthetic,
        isActive: dealership.isActive,
      },
    });

    revalidatePath('/admin/dealerships');
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: dealership,
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kendala sistem tak terduga.',
    };
  }
}

/**
 * Toggles the operational active status of a dealership.
 * Prefer this over hard-deleting records for normal operational use.
 */
export async function toggleDealershipActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResponse<DealershipItem>> {
  try {
    const session = await requireAdmin();

    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'ID dealer tidak valid.',
      };
    }

    const supabase = await createClient();

    const { data: updatedRow, error: updateError } = await supabase
      .from('dealerships')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal mengubah status aktif dealer.',
      };
    }

    const row = updatedRow as unknown as Database['public']['Tables']['dealerships']['Row'];
    const dealership = mapDealershipRow(row);

    const statusWord = isActive ? 'Mengaktifkan' : 'Menonaktifkan';
    await logAdminAction({
      action: 'toggle_dealership_active',
      entityType: 'dealership',
      entityId: dealership.id,
      summary: `${statusWord} status operasional dealer "${dealership.name}" (${dealership.code}) oleh ${session.profile.displayName}`,
      metadata: {
        dealershipCode: dealership.code,
        dealershipName: dealership.name,
        isActive: dealership.isActive,
      },
    });

    revalidatePath('/admin/dealerships');
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: dealership,
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kendala sistem tak terduga.',
    };
  }
}

/**
 * Deletes a dealership record safely.
 * Rejects deletion with clear guidance if foreign keys or dependencies exist.
 */
export async function deleteDealershipAction(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireAdmin();

    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'ID dealer tidak valid.',
      };
    }

    const supabase = await createClient();

    // 1. Fetch current record before deletion for audit trail and safety
    const { data: existingRow, error: fetchError } = await supabase
      .from('dealerships')
      .select('id, name, code, is_synthetic')
      .eq('id', id)
      .single();

    if (fetchError || !existingRow) {
      return {
        success: false,
        error: 'Entitas dealer tidak ditemukan atau sudah dihapus.',
      };
    }

    type ExistingType = { id: string; name: string; code: string; is_synthetic: boolean };
    const existing = existingRow as unknown as ExistingType;

    // 2. Perform deletion
    const { error: deleteError } = await supabase.from('dealerships').delete().eq('id', id);

    if (deleteError) {
      if (isForeignKeyError(deleteError)) {
        return {
          success: false,
          error:
            'Dealer ini tidak dapat dihapus karena memiliki data terkait. Silakan nonaktifkan dealer sebagai gantinya.',
        };
      }
      return {
        success: false,
        error: deleteError.message || 'Gagal menghapus entitas dealer.',
      };
    }

    // 3. Record audit log
    await logAdminAction({
      action: 'delete_dealership',
      entityType: 'dealership',
      entityId: id,
      summary: `Menghapus entitas dealer "${existing.name}" (${existing.code}) oleh ${session.profile.displayName}`,
      metadata: {
        dealershipCode: existing.code,
        dealershipName: existing.name,
        isSynthetic: existing.is_synthetic,
      },
    });

    revalidatePath('/admin/dealerships');
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { id },
    };
  } catch (err) {
    if (isNextRedirectError(err)) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Terjadi kendala sistem tak terduga.',
    };
  }
}
