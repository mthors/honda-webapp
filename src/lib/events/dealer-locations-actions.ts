'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import {
  createDealerLocationSchema,
  updateDealerLocationSchema,
  type CreateDealerLocationInput,
  type UpdateDealerLocationInput,
  type DealerLocationItem,
} from '@/types/events';
import type { ActionResponse } from '@/lib/admin/actions';
import type { Database } from '@/types/database';

function isNextRedirectError(err: unknown): boolean {
  if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) {
    return true;
  }
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest: string }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

function mapDealerLocationRow(
  row: Database['public']['Tables']['dealer_locations']['Row']
): DealerLocationItem {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDealerLocationAction(
  input: CreateDealerLocationInput
): Promise<ActionResponse<DealerLocationItem>> {
  try {
    const session = await requireAdmin();

    const parsed = createDealerLocationSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir lokasi dealer baru gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const insertPayload: Database['public']['Tables']['dealer_locations']['Insert'] = {
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      phone: data.phone?.trim() || null,
      is_active: data.isActive,
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('dealer_locations')
      .insert(insertPayload as never)
      .select('*')
      .single();

    if (insertError || !insertedRow) {
      return {
        success: false,
        error: insertError?.message || 'Gagal menambahkan lokasi dealer ke basis data.',
      };
    }

    const row = insertedRow as unknown as Database['public']['Tables']['dealer_locations']['Row'];
    const location = mapDealerLocationRow(row);

    await logAdminAction({
      action: 'create_dealer_location',
      entityType: 'dealer_location',
      entityId: location.id,
      summary: `Menambahkan lokasi dealer "${location.name}" (${location.city}) oleh ${session.profile.displayName}`,
      metadata: {
        name: location.name,
        city: location.city,
        address: location.address,
        isActive: location.isActive,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/admin/events/locations');
    revalidatePath('/admin/dealer-locations');
    revalidatePath('/events');

    return {
      success: true,
      data: location,
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

export async function updateDealerLocationAction(
  input: UpdateDealerLocationInput
): Promise<ActionResponse<DealerLocationItem>> {
  try {
    const session = await requireAdmin();

    const parsed = updateDealerLocationSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir perubahan lokasi dealer gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    const updatePayload: Database['public']['Tables']['dealer_locations']['Update'] = {
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      phone: data.phone?.trim() || null,
      is_active: data.isActive,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRow, error: updateError } = await supabase
      .from('dealer_locations')
      .update(updatePayload as never)
      .eq('id', data.id)
      .select('*')
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal memperbarui data lokasi dealer.',
      };
    }

    const row = updatedRow as unknown as Database['public']['Tables']['dealer_locations']['Row'];
    const location = mapDealerLocationRow(row);

    await logAdminAction({
      action: 'update_dealer_location',
      entityType: 'dealer_location',
      entityId: location.id,
      summary: `Memperbarui lokasi dealer "${location.name}" (${location.city}) oleh ${session.profile.displayName}`,
      metadata: {
        name: location.name,
        city: location.city,
        address: location.address,
        isActive: location.isActive,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/admin/events/locations');
    revalidatePath('/admin/dealer-locations');
    revalidatePath('/events');

    return {
      success: true,
      data: location,
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

export async function toggleDealerLocationActiveAction(input: {
  id: string;
  isActive: boolean;
}): Promise<ActionResponse<DealerLocationItem>> {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();

    const { data: updatedRow, error: updateError } = await supabase
      .from('dealer_locations')
      .update({
        is_active: input.isActive,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', input.id)
      .select('*')
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal mengubah status aktif lokasi dealer.',
      };
    }

    const row = updatedRow as unknown as Database['public']['Tables']['dealer_locations']['Row'];
    const location = mapDealerLocationRow(row);

    await logAdminAction({
      action: 'toggle_dealer_location_status',
      entityType: 'dealer_location',
      entityId: location.id,
      summary: `${location.isActive ? 'Mengaktifkan' : 'Menonaktifkan'} lokasi dealer "${location.name}" oleh ${session.profile.displayName}`,
      metadata: {
        isActive: location.isActive,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/admin/events/locations');
    revalidatePath('/admin/dealer-locations');
    revalidatePath('/events');

    return {
      success: true,
      data: location,
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

export async function deleteDealerLocationAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();

    // Check if any events reference this location
    const { count, error: countError } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('location_id', id);

    if (countError) {
      return {
        success: false,
        error: 'Gagal memverifikasi referensi acara untuk lokasi ini.',
      };
    }

    if (count && count > 0) {
      return {
        success: false,
        error:
          'Lokasi dealer ini tidak dapat dihapus karena masih digunakan oleh satu atau beberapa acara. Anda dapat menonaktifkan statusnya agar tidak dipilih untuk acara baru.',
      };
    }

    // Get location name for audit logging
    const { data: existingLocation } = await supabase
      .from('dealer_locations')
      .select('name, city')
      .eq('id', id)
      .maybeSingle();

    const { error: deleteError } = await supabase.from('dealer_locations').delete().eq('id', id);

    if (deleteError) {
      if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint')) {
        return {
          success: false,
          error:
            'Lokasi dealer ini tidak dapat dihapus karena masih digunakan oleh satu atau beberapa acara. Anda dapat menonaktifkan statusnya agar tidak dipilih untuk acara baru.',
        };
      }
      return {
        success: false,
        error: deleteError.message || 'Gagal menghapus lokasi dealer.',
      };
    }

    await logAdminAction({
      action: 'delete_dealer_location',
      entityType: 'dealer_location',
      entityId: id,
      summary: `Menghapus lokasi dealer "${(existingLocation as unknown as { name?: string })?.name || id}" oleh ${session.profile.displayName}`,
      metadata: {
        deletedId: id,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/admin/events/locations');
    revalidatePath('/admin/dealer-locations');
    revalidatePath('/events');

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
