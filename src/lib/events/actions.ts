'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventInput,
  type UpdateEventInput,
  type EventItem,
} from '@/types/events';
import type { DealershipItem } from '@/types/dealership';
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

function cleanOptionalField(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed === '' ? null : trimmed;
}

async function removeStoragePoster(storagePathOrUrl: string | null | undefined) {
  if (!storagePathOrUrl) return;

  try {
    const supabase = await createClient();
    let cleanPath = storagePathOrUrl.trim();

    // If it's a full URL, parse the relative storage path inside events/ bucket
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      const match = cleanPath.match(/\/storage\/v1\/object\/public\/events\/(.+)$/);
      if (match && match[1]) {
        cleanPath = match[1];
      } else {
        return; // External image, nothing to remove
      }
    } else if (cleanPath.startsWith('events/')) {
      cleanPath = cleanPath.replace(/^events\//, '');
    }

    if (cleanPath) {
      await supabase.storage.from('events').remove([cleanPath]);
    }
  } catch (err) {
    console.error('Failed to cleanup poster from storage:', err);
  }
}

function mapDealershipFromRow(
  row: Database['public']['Tables']['dealerships']['Row'] | null | undefined
): DealershipItem | null {
  if (!row) return null;
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

type EventRowWithDealership = Database['public']['Tables']['events']['Row'] & {
  dealerships: Database['public']['Tables']['dealerships']['Row'] | null;
};

function mapEventItemFromRow(row: EventRowWithDealership): EventItem {
  const dealership = mapDealershipFromRow(row.dealerships);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    dealershipId: row.dealership_id,
    dealership,
    locationId: row.dealership_id,
    location: dealership,
    startAt: row.start_at,
    endAt: row.end_at,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createEventAction(
  input: CreateEventInput
): Promise<ActionResponse<EventItem>> {
  try {
    const session = await requireAdmin();

    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir acara baru gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const targetDealershipId = (data.dealershipId || data.locationId) as string;
    const supabase = await createClient();

    // 1. Validate that referenced dealership is active
    const { data: dealershipData, error: dealershipError } = await supabase
      .from('dealerships')
      .select('id, name, is_active, city')
      .eq('id', targetDealershipId)
      .maybeSingle();

    const dealership = dealershipData as {
      id: string;
      name: string;
      is_active: boolean;
      city: string;
    } | null;

    if (dealershipError || !dealership) {
      return {
        success: false,
        error: 'Dealer resmi yang dipilih tidak ditemukan dalam sistem.',
        fieldErrors: {
          dealershipId: ['Dealer resmi yang dipilih tidak ditemukan.'],
        },
      };
    }

    if (!dealership.is_active) {
      return {
        success: false,
        error: 'Dealer yang dipilih sedang berstatus nonaktif. Silakan pilih dealer yang aktif.',
        fieldErrors: {
          dealershipId: ['Dealer yang dipilih sedang berstatus nonaktif.'],
        },
      };
    }

    // 2. Validate unique slug
    const { data: existingSlug } = await supabase
      .from('events')
      .select('id')
      .eq('slug', data.slug)
      .maybeSingle();

    if (existingSlug) {
      return {
        success: false,
        error: 'Slug URL acara sudah digunakan. Silakan gunakan slug yang unik.',
        fieldErrors: {
          slug: ['Slug URL acara sudah digunakan.'],
        },
      };
    }

    // 3. Insert event
    const insertPayload: Database['public']['Tables']['events']['Insert'] = {
      title: data.title.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description.trim(),
      dealership_id: targetDealershipId,
      start_at: new Date(data.startAt).toISOString(),
      end_at: new Date(data.endAt).toISOString(),
      image_url: cleanOptionalField(data.imageUrl),
      status: data.status,
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('events')
      .insert(insertPayload as never)
      .select(
        `
        id,
        title,
        slug,
        description,
        dealership_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealerships (
          id,
          name,
          code,
          city,
          address,
          phone,
          whatsapp_number,
          opening_hours,
          is_synthetic,
          is_active,
          sort_order,
          created_at,
          updated_at
        )
      `
      )
      .single();

    if (insertError || !insertedRow) {
      return {
        success: false,
        error: insertError?.message || 'Gagal menambahkan data acara ke basis data.',
      };
    }

    const eventItem = mapEventItemFromRow(insertedRow as unknown as EventRowWithDealership);

    await logAdminAction({
      action: 'create_event',
      entityType: 'event',
      entityId: eventItem.id,
      summary: `Menambahkan acara "${eventItem.title}" (${eventItem.status}) di dealer ${dealership.name} oleh ${session.profile.displayName}`,
      metadata: {
        title: eventItem.title,
        slug: eventItem.slug,
        dealershipId: targetDealershipId,
        dealershipName: dealership.name,
        status: eventItem.status,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: eventItem,
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

export async function updateEventAction(
  input: UpdateEventInput
): Promise<ActionResponse<EventItem>> {
  try {
    const session = await requireAdmin();

    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir perubahan acara gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const targetDealershipId = (data.dealershipId || data.locationId) as string;
    const supabase = await createClient();

    // 1. Fetch existing event
    const { data: existingRow, error: fetchError } = await supabase
      .from('events')
      .select('id, title, slug, image_url, dealership_id')
      .eq('id', data.id)
      .maybeSingle();

    type ExistingEventRow = {
      id: string;
      title: string;
      slug: string;
      image_url: string | null;
      dealership_id: string;
    };
    const existing = existingRow as unknown as ExistingEventRow | null;

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Acara tidak ditemukan atau sudah dihapus.',
      };
    }

    // 2. Validate that referenced dealership is active
    const { data: dealershipData, error: dealershipError } = await supabase
      .from('dealerships')
      .select('id, name, is_active, city')
      .eq('id', targetDealershipId)
      .maybeSingle();

    const dealership = dealershipData as {
      id: string;
      name: string;
      is_active: boolean;
      city: string;
    } | null;

    if (dealershipError || !dealership) {
      return {
        success: false,
        error: 'Dealer resmi yang dipilih tidak ditemukan dalam sistem.',
        fieldErrors: {
          dealershipId: ['Dealer resmi yang dipilih tidak ditemukan.'],
        },
      };
    }

    if (!dealership.is_active) {
      return {
        success: false,
        error: 'Dealer yang dipilih sedang berstatus nonaktif. Silakan pilih dealer yang aktif.',
        fieldErrors: {
          dealershipId: ['Dealer yang dipilih sedang berstatus nonaktif.'],
        },
      };
    }

    // 3. Validate unique slug (excluding current event)
    const { data: existingSlug } = await supabase
      .from('events')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', data.id)
      .maybeSingle();

    if (existingSlug) {
      return {
        success: false,
        error: 'Slug URL acara sudah digunakan oleh acara lain.',
        fieldErrors: {
          slug: ['Slug URL acara sudah digunakan oleh acara lain.'],
        },
      };
    }

    // 4. Poster replacement cleanup
    const oldImageUrl = existing.image_url;
    const newImageUrl = cleanOptionalField(data.imageUrl);
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      await removeStoragePoster(oldImageUrl);
    }

    // 5. Update event
    const updatePayload: Database['public']['Tables']['events']['Update'] = {
      title: data.title.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description.trim(),
      dealership_id: targetDealershipId,
      start_at: new Date(data.startAt).toISOString(),
      end_at: new Date(data.endAt).toISOString(),
      image_url: newImageUrl,
      status: data.status,
    };

    const { data: updatedRow, error: updateError } = await supabase
      .from('events')
      .update(updatePayload as never)
      .eq('id', data.id)
      .select(
        `
        id,
        title,
        slug,
        description,
        dealership_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealerships (
          id,
          name,
          code,
          city,
          address,
          phone,
          whatsapp_number,
          opening_hours,
          is_synthetic,
          is_active,
          sort_order,
          created_at,
          updated_at
        )
      `
      )
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal memperbarui data acara.',
      };
    }

    const eventItem = mapEventItemFromRow(updatedRow as unknown as EventRowWithDealership);

    await logAdminAction({
      action: 'update_event',
      entityType: 'event',
      entityId: eventItem.id,
      summary: `Memperbarui acara "${eventItem.title}" (${eventItem.status}) di dealer ${dealership.name} oleh ${session.profile.displayName}`,
      metadata: {
        title: eventItem.title,
        slug: eventItem.slug,
        dealershipId: targetDealershipId,
        dealershipName: dealership.name,
        status: eventItem.status,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath(`/events/${eventItem.slug}`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: eventItem,
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

export async function toggleEventPublishAction(
  idOrPayload: string | { id: string; status: 'draft' | 'published' },
  targetStatusParam?: 'draft' | 'published'
): Promise<ActionResponse<EventItem>> {
  try {
    const session = await requireAdmin();

    const id = typeof idOrPayload === 'string' ? idOrPayload : idOrPayload?.id;
    const targetStatus = typeof idOrPayload === 'string' ? targetStatusParam : idOrPayload?.status;

    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'ID acara tidak valid.',
      };
    }

    if (targetStatus !== 'draft' && targetStatus !== 'published') {
      return {
        success: false,
        error: 'Status acara tidak valid.',
      };
    }

    const supabase = await createClient();

    const { data: updatedRow, error: updateError } = await supabase
      .from('events')
      .update({ status: targetStatus } as never)
      .eq('id', id)
      .select(
        `
        id,
        title,
        slug,
        description,
        dealership_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealerships (
          id,
          name,
          code,
          city,
          address,
          phone,
          whatsapp_number,
          opening_hours,
          is_synthetic,
          is_active,
          sort_order,
          created_at,
          updated_at
        )
      `
      )
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal memperbarui status publikasi acara.',
      };
    }

    const eventItem = mapEventItemFromRow(updatedRow as unknown as EventRowWithDealership);

    await logAdminAction({
      action: targetStatus === 'published' ? 'publish_event' : 'unpublish_event',
      entityType: 'event',
      entityId: eventItem.id,
      summary: `${targetStatus === 'published' ? 'Mempublikasikan' : 'Menarik draf'} acara "${eventItem.title}" oleh ${session.profile.displayName}`,
      metadata: {
        title: eventItem.title,
        status: targetStatus,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath(`/events/${eventItem.slug}`);
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: eventItem,
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

export async function deleteEventAction(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requireAdmin();

    if (!id || typeof id !== 'string') {
      return {
        success: false,
        error: 'ID acara tidak valid.',
      };
    }

    const supabase = await createClient();

    const { data: existingRow, error: fetchError } = await supabase
      .from('events')
      .select('id, title, slug, image_url')
      .eq('id', id)
      .maybeSingle();

    type ExistingDeleteRow = {
      id: string;
      title: string;
      slug: string;
      image_url: string | null;
    };
    const existing = existingRow as unknown as ExistingDeleteRow | null;

    if (fetchError || !existing) {
      return {
        success: false,
        error: 'Acara tidak ditemukan atau sudah dihapus.',
      };
    }

    if (existing.image_url) {
      await removeStoragePoster(existing.image_url);
    }

    const { error: deleteError } = await supabase.from('events').delete().eq('id', id);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message || 'Gagal menghapus acara.',
      };
    }

    await logAdminAction({
      action: 'delete_event',
      entityType: 'event',
      entityId: id,
      summary: `Menghapus acara "${existing.title}" (${existing.slug}) oleh ${session.profile.displayName}`,
      metadata: {
        title: existing.title,
        slug: existing.slug,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
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
