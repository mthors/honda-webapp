'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import { normalizeIndonesianPhone } from '@/lib/formatters';
import {
  salesRepresentativeFormSchema,
  updateSalesRepresentativeSchema,
  serviceAreaAssignmentSchema,
  batchAssignServiceAreasSchema,
  type ActionResponse,
  type CreateSalesRepresentativeInput,
  type UpdateSalesRepresentativeInput,
  type CreateServiceAreaInput,
  type BatchAssignServiceAreasInput,
  type SalesRepresentativeItem,
  type DealershipServiceAreaItem,
} from '@/types/sales';
import type { Database } from '@/types/database';
import type { DealershipItem } from '@/types/dealership';
import { mapSalesRepresentativeRow, mapServiceAreaRow, getDealershipsByRegency } from './queries';

type SalesRepRowWithJoins = Database['public']['Tables']['sales_representatives']['Row'] & {
  dealerships?: Database['public']['Tables']['dealerships']['Row'] | null;
};

type ServiceAreaRowWithJoins = Database['public']['Tables']['dealership_service_areas']['Row'] & {
  dealerships?: Database['public']['Tables']['dealerships']['Row'] | null;
  regencies?: Database['public']['Tables']['regencies']['Row'] | null;
};

function cleanOptionalField(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed === '' ? null : trimmed;
}

function isDuplicateKeyError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  return (
    error.code === '23505' ||
    (typeof error.message === 'string' &&
      (error.message.includes('unique constraint') ||
        error.message.includes('dealership_service_areas_dealership_id_regency_id_key') ||
        error.message.includes('duplicate key value')))
  );
}

function isForeignKeyError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === '23503' ||
    (typeof error.message === 'string' && error.message.includes('violates foreign key constraint'))
  );
}

/**
 * Creates a new sales representative.
 */
export async function createSalesRepresentativeAction(
  input: CreateSalesRepresentativeInput
): Promise<ActionResponse<SalesRepresentativeItem>> {
  try {
    await requireAdmin();

    const parsed = salesRepresentativeFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir sales representative gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const normalizedWhatsApp = normalizeIndonesianPhone(data.whatsappNumber);
    const supabase = await createClient();

    const insertPayload: Database['public']['Tables']['sales_representatives']['Insert'] = {
      dealership_id: data.dealershipId,
      name: data.name.trim(),
      whatsapp_number: normalizedWhatsApp,
      photo_url: cleanOptionalField(data.photoUrl),
      position: cleanOptionalField(data.position),
      is_active: Boolean(data.isActive),
      sort_order: data.sortOrder ?? 0,
    };

    const { data: created, error } = await supabase
      .from('sales_representatives')
      .insert(insertPayload as never)
      .select('*, dealerships (*)')
      .single();

    if (error || !created) {
      if (isForeignKeyError(error)) {
        return {
          success: false,
          error: 'Cabang dealer yang dipilih tidak valid atau sudah tidak tersedia.',
        };
      }
      return {
        success: false,
        error: `Gagal menyimpan data sales representative: ${error?.message || 'Data tidak ditemukan'}`,
      };
    }

    const createdRow = created as unknown as SalesRepRowWithJoins;

    await logAdminAction({
      action: 'create_sales_rep',
      entityType: 'sales_representatives',
      entityId: createdRow.id,
      summary: `Membuat data tenaga penjual baru: ${createdRow.name} (${normalizedWhatsApp})`,
      metadata: {
        dealershipId: createdRow.dealership_id,
        name: createdRow.name,
        whatsappNumber: normalizedWhatsApp,
        position: createdRow.position,
        isActive: createdRow.is_active,
      },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: mapSalesRepresentativeRow(createdRow),
    };
  } catch (err) {
    console.error('Error creating sales representative:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat membuat data sales representative.',
    };
  }
}

/**
 * Updates an existing sales representative.
 */
export async function updateSalesRepresentativeAction(
  input: UpdateSalesRepresentativeInput
): Promise<ActionResponse<SalesRepresentativeItem>> {
  try {
    await requireAdmin();

    const parsed = updateSalesRepresentativeSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message ||
        'Validasi formulir perubahan sales representative gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const normalizedWhatsApp = normalizeIndonesianPhone(data.whatsappNumber);
    const supabase = await createClient();

    const updatePayload: Database['public']['Tables']['sales_representatives']['Update'] = {
      dealership_id: data.dealershipId,
      name: data.name.trim(),
      whatsapp_number: normalizedWhatsApp,
      photo_url: cleanOptionalField(data.photoUrl),
      position: cleanOptionalField(data.position),
      is_active: Boolean(data.isActive),
      sort_order: data.sortOrder ?? 0,
    };

    const { data: updated, error } = await supabase
      .from('sales_representatives')
      .update(updatePayload as never)
      .eq('id', data.id)
      .select('*, dealerships (*)')
      .single();

    if (error || !updated) {
      if (isForeignKeyError(error)) {
        return {
          success: false,
          error: 'Cabang dealer yang dipilih tidak valid atau sudah tidak tersedia.',
        };
      }
      return {
        success: false,
        error: `Gagal memperbarui data sales representative: ${error?.message || 'Data tidak ditemukan'}`,
      };
    }

    const updatedRow = updated as unknown as SalesRepRowWithJoins;

    await logAdminAction({
      action: 'update_sales_rep',
      entityType: 'sales_representatives',
      entityId: updatedRow.id,
      summary: `Memperbarui data tenaga penjual: ${updatedRow.name}`,
      metadata: {
        dealershipId: updatedRow.dealership_id,
        name: updatedRow.name,
        whatsappNumber: normalizedWhatsApp,
        position: updatedRow.position,
        isActive: updatedRow.is_active,
      },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: mapSalesRepresentativeRow(updatedRow),
    };
  } catch (err) {
    console.error('Error updating sales representative:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat memperbarui data sales representative.',
    };
  }
}

/**
 * Toggles the active status of a sales representative.
 */
export async function toggleSalesRepresentativeActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResponse<{ id: string; isActive: boolean }>> {
  try {
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID sales representative tidak valid.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('sales_representatives')
      .update({ is_active: isActive } as never)
      .eq('id', id)
      .select('id, name, is_active')
      .single();

    if (error || !data) {
      return {
        success: false,
        error: `Gagal mengubah status aktif sales representative: ${error?.message || 'Data tidak ditemukan'}`,
      };
    }

    const repData = data as unknown as { id: string; name: string; is_active: boolean };

    await logAdminAction({
      action: 'toggle_sales_rep_active',
      entityType: 'sales_representatives',
      entityId: repData.id,
      summary: `Mengubah status tenaga penjual ${repData.name} menjadi ${isActive ? 'aktif' : 'nonaktif'}`,
      metadata: { id: repData.id, isActive },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { id: repData.id, isActive: repData.is_active },
    };
  } catch (err) {
    console.error('Error toggling sales representative status:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat mengubah status aktif sales representative.',
    };
  }
}

/**
 * Deletes a sales representative and removes any uploaded profile photo from storage.
 */
export async function deleteSalesRepresentativeAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID sales representative tidak valid.' };
    }

    const supabase = await createClient();

    // Check existing record and clean storage photo if applicable
    const { data: existing } = await supabase
      .from('sales_representatives')
      .select('id, name, photo_url')
      .eq('id', id)
      .single();

    const rep = existing as unknown as {
      id: string;
      name: string;
      photo_url: string | null;
    } | null;

    if (rep?.photo_url && !rep.photo_url.startsWith('http')) {
      try {
        await supabase.storage.from('sales-reps').remove([rep.photo_url]);
      } catch (storageErr) {
        console.warn('Could not remove sales representative photo from storage:', storageErr);
      }
    }

    const { error } = await supabase.from('sales_representatives').delete().eq('id', id);

    if (error) {
      return {
        success: false,
        error: `Gagal menghapus sales representative: ${error.message}`,
      };
    }

    await logAdminAction({
      action: 'delete_sales_rep',
      entityType: 'sales_representatives',
      entityId: id,
      summary: `Menghapus data tenaga penjual: ${rep?.name || id}`,
      metadata: { id, name: rep?.name },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { id },
    };
  } catch (err) {
    console.error('Error deleting sales representative:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat menghapus data sales representative.',
    };
  }
}

/**
 * Assigns a single service area (regency) to a dealership.
 */
export async function createServiceAreaAction(
  input: CreateServiceAreaInput
): Promise<ActionResponse<DealershipServiceAreaItem>> {
  try {
    await requireAdmin();

    const parsed = serviceAreaAssignmentSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi penugasan wilayah layanan gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const { data: created, error } = await supabase
      .from('dealership_service_areas')
      .insert({
        dealership_id: data.dealershipId,
        regency_id: data.regencyId,
        is_active: Boolean(data.isActive),
      } as never)
      .select('*, dealerships (*), regencies (*)')
      .single();

    if (error || !created) {
      if (isDuplicateKeyError(error)) {
        return {
          success: false,
          error: 'Wilayah layanan ini sudah ditugaskan ke cabang dealer yang dipilih.',
        };
      }
      if (isForeignKeyError(error)) {
        return {
          success: false,
          error: 'Dealer atau wilayah kabupaten/kota yang dipilih tidak valid.',
        };
      }
      return {
        success: false,
        error: `Gagal menambahkan cakupan wilayah layanan: ${error?.message || 'Data tidak ditemukan'}`,
      };
    }

    const areaRow = created as unknown as ServiceAreaRowWithJoins;

    await logAdminAction({
      action: 'create_service_area',
      entityType: 'dealership_service_areas',
      entityId: areaRow.id,
      summary: `Menambahkan cakupan wilayah layanan dealer: ${areaRow.regency_id}`,
      metadata: {
        dealershipId: areaRow.dealership_id,
        regencyId: areaRow.regency_id,
        isActive: areaRow.is_active,
      },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: mapServiceAreaRow(areaRow),
    };
  } catch (err) {
    console.error('Error creating dealership service area:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat menambahkan cakupan wilayah layanan.',
    };
  }
}

/**
 * Batch assigns multiple regencies to a dealership, ignoring duplicates.
 */
export async function batchAssignServiceAreasAction(
  input: BatchAssignServiceAreasInput
): Promise<ActionResponse<{ addedCount: number }>> {
  try {
    await requireAdmin();

    const parsed = batchAssignServiceAreasSchema.safeParse(input);
    if (!parsed.success) {
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi penugasan massal wilayah layanan gagal.';
      return {
        success: false,
        error: firstErrorMessage,
      };
    }

    const { dealershipId, regencyIds } = parsed.data;
    const supabase = await createClient();

    const rows = regencyIds.map((regencyId) => ({
      dealership_id: dealershipId,
      regency_id: regencyId,
      is_active: true,
    }));

    const { data: inserted, error } = await supabase
      .from('dealership_service_areas')
      .upsert(rows as never, { onConflict: 'dealership_id, regency_id' })
      .select('id');

    if (error) {
      return {
        success: false,
        error: `Gagal menyimpan cakupan wilayah layanan: ${error.message}`,
      };
    }

    const addedCount = inserted?.length ?? rows.length;

    await logAdminAction({
      action: 'batch_assign_service_areas',
      entityType: 'dealership_service_areas',
      summary: `Menugaskan ${addedCount} wilayah layanan ke cabang dealer ${dealershipId}`,
      metadata: {
        dealershipId,
        regencyIds,
        addedCount,
      },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { addedCount },
    };
  } catch (err) {
    console.error('Error batch assigning service areas:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat menugaskan wilayah layanan.',
    };
  }
}

/**
 * Toggles the active status of a dealership service area.
 */
export async function toggleServiceAreaActiveAction(
  id: string,
  isActive: boolean
): Promise<ActionResponse<{ id: string; isActive: boolean }>> {
  try {
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID pemetaan wilayah layanan tidak valid.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('dealership_service_areas')
      .update({ is_active: isActive } as never)
      .eq('id', id)
      .select('id, is_active, dealership_id, regency_id')
      .single();

    if (error || !data) {
      return {
        success: false,
        error: `Gagal memperbarui status wilayah layanan: ${error?.message || 'Data tidak ditemukan'}`,
      };
    }

    const areaData = data as unknown as {
      id: string;
      is_active: boolean;
      dealership_id: string;
      regency_id: string;
    };

    await logAdminAction({
      action: 'toggle_service_area_active',
      entityType: 'dealership_service_areas',
      entityId: areaData.id,
      summary: `Mengubah status cakupan wilayah layanan ${areaData.regency_id} menjadi ${isActive ? 'aktif' : 'nonaktif'}`,
      metadata: { id: areaData.id, isActive },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { id: areaData.id, isActive: areaData.is_active },
    };
  } catch (err) {
    console.error('Error toggling service area active status:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat memperbarui status wilayah layanan.',
    };
  }
}

/**
 * Deletes a dealership service area mapping.
 */
export async function deleteServiceAreaAction(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireAdmin();

    if (!id || typeof id !== 'string') {
      return { success: false, error: 'ID pemetaan wilayah layanan tidak valid.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('dealership_service_areas').delete().eq('id', id);

    if (error) {
      return {
        success: false,
        error: `Gagal menghapus pemetaan wilayah layanan: ${error.message}`,
      };
    }

    await logAdminAction({
      action: 'delete_service_area',
      entityType: 'dealership_service_areas',
      entityId: id,
      summary: `Menghapus pemetaan wilayah layanan: ${id}`,
      metadata: { id },
    });

    revalidatePath('/admin/sales');
    revalidatePath('/hubungi');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: { id },
    };
  } catch (err) {
    console.error('Error deleting service area:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat menghapus pemetaan wilayah layanan.',
    };
  }
}

/**
 * Public action: Discovers active dealership branches serving the specified regency.
 * Does not require admin authentication.
 */
export async function discoverDealershipsByRegencyAction(
  regencyId: string
): Promise<ActionResponse<DealershipItem[]>> {
  try {
    if (!regencyId || typeof regencyId !== 'string') {
      return {
        success: false,
        error: 'Wilayah kabupaten/kota tidak valid.',
      };
    }

    const dealerships = await getDealershipsByRegency(regencyId.trim());

    return {
      success: true,
      data: dealerships,
    };
  } catch (err) {
    console.error('Error discovering dealerships by regency:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat mencari dealer yang melayani wilayah Anda.',
    };
  }
}
