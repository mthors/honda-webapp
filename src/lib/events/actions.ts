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
  type EventStatus,
} from '@/types/events';
import type { ActionResponse } from '@/lib/admin/actions';
import type { Database } from '@/types/database';

function isNextRedirectError(err: unknown): boolean {
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
    // If it's a relative path in 'events' bucket or 'events/fileName'
    let cleanPath = storagePathOrUrl.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
      const match = cleanPath.match(/\/storage\/v1\/object\/public\/events\/(.+)$/);
      if (match && match[1]) {
        cleanPath = match[1];
      } else {
        return; // External or non-events bucket URL
      }
    } else if (cleanPath.startsWith('events/')) {
      cleanPath = cleanPath.slice('events/'.length);
    }

    if (cleanPath) {
      await supabase.storage.from('events').remove([cleanPath]);
    }
  } catch (err) {
    console.error('Failed to cleanup poster from storage:', err);
  }
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
    const supabase = await createClient();

    // 1. Validate that referenced dealership location is active
    const { data: locationData, error: locationError } = await supabase
      .from('dealer_locations')
      .select('id, name, is_active, city')
      .eq('id', data.locationId)
      .maybeSingle();

    const location = locationData as {
      id: string;
      name: string;
      is_active: boolean;
      city: string;
    } | null;

    if (locationError || !location) {
      return {
        success: false,
        error: 'Lokasi dealer yang dipilih tidak ditemukan.',
        fieldErrors: {
          locationId: ['Lokasi dealer yang dipilih tidak ditemukan.'],
        },
      };
    }

    if (!location.is_active) {
      return {
        success: false,
        error: 'Lokasi dealer yang dipilih sedang tidak aktif. Pilih dealer yang berstatus aktif.',
        fieldErrors: {
          locationId: ['Lokasi dealer yang dipilih sedang tidak aktif.'],
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
      location_id: data.locationId,
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
        location_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealer_locations (
          id,
          name,
          address,
          city,
          phone,
          is_active,
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

    type ReturnedRow = Database['public']['Tables']['events']['Row'] & {
      dealer_locations: Database['public']['Tables']['dealer_locations']['Row'] | null;
    };
    const row = insertedRow as unknown as ReturnedRow;

    const eventItem: EventItem = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      locationId: row.location_id,
      location: row.dealer_locations
        ? {
            id: row.dealer_locations.id,
            name: row.dealer_locations.name,
            address: row.dealer_locations.address,
            city: row.dealer_locations.city,
            phone: row.dealer_locations.phone,
            isActive: row.dealer_locations.is_active,
            createdAt: row.dealer_locations.created_at,
            updatedAt: row.dealer_locations.updated_at,
          }
        : null,
      startAt: row.start_at,
      endAt: row.end_at,
      imageUrl: row.image_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    await logAdminAction({
      action: 'create_event',
      entityType: 'event',
      entityId: eventItem.id,
      summary: `Menambahkan acara "${eventItem.title}" (${eventItem.status}) di lokasi ${location.name} oleh ${session.profile.displayName}`,
      metadata: {
        title: eventItem.title,
        slug: eventItem.slug,
        status: eventItem.status,
        locationId: eventItem.locationId,
        startAt: eventItem.startAt,
        endAt: eventItem.endAt,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath('/');

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
    const supabase = await createClient();

    // 1. Fetch existing event to check old poster and existence
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id, image_url')
      .eq('id', data.id)
      .maybeSingle();

    if (fetchError || !existingEvent) {
      return {
        success: false,
        error: 'Data acara tidak ditemukan.',
      };
    }

    // 2. Validate that referenced dealership location is active
    const { data: locationData, error: locationError } = await supabase
      .from('dealer_locations')
      .select('id, name, is_active, city')
      .eq('id', data.locationId)
      .maybeSingle();

    const location = locationData as {
      id: string;
      name: string;
      is_active: boolean;
      city: string;
    } | null;

    if (locationError || !location) {
      return {
        success: false,
        error: 'Lokasi dealer yang dipilih tidak ditemukan.',
        fieldErrors: {
          locationId: ['Lokasi dealer yang dipilih tidak ditemukan.'],
        },
      };
    }

    if (!location.is_active) {
      return {
        success: false,
        error: 'Lokasi dealer yang dipilih sedang tidak aktif. Pilih dealer yang berstatus aktif.',
        fieldErrors: {
          locationId: ['Lokasi dealer yang dipilih sedang tidak aktif.'],
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

    const newImageUrl = cleanOptionalField(data.imageUrl);
    const existingImageUrl = (existingEvent as { image_url?: string | null })?.image_url;

    // If poster was replaced or removed, cleanup old file
    if (existingImageUrl && existingImageUrl !== newImageUrl) {
      await removeStoragePoster(existingImageUrl);
    }

    const updatePayload: Database['public']['Tables']['events']['Update'] = {
      title: data.title.trim(),
      slug: data.slug.trim().toLowerCase(),
      description: data.description.trim(),
      location_id: data.locationId,
      start_at: new Date(data.startAt).toISOString(),
      end_at: new Date(data.endAt).toISOString(),
      image_url: newImageUrl,
      status: data.status,
      updated_at: new Date().toISOString(),
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
        location_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealer_locations (
          id,
          name,
          address,
          city,
          phone,
          is_active,
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

    type ReturnedRow = Database['public']['Tables']['events']['Row'] & {
      dealer_locations: Database['public']['Tables']['dealer_locations']['Row'] | null;
    };
    const row = updatedRow as unknown as ReturnedRow;

    const eventItem: EventItem = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      locationId: row.location_id,
      location: row.dealer_locations
        ? {
            id: row.dealer_locations.id,
            name: row.dealer_locations.name,
            address: row.dealer_locations.address,
            city: row.dealer_locations.city,
            phone: row.dealer_locations.phone,
            isActive: row.dealer_locations.is_active,
            createdAt: row.dealer_locations.created_at,
            updatedAt: row.dealer_locations.updated_at,
          }
        : null,
      startAt: row.start_at,
      endAt: row.end_at,
      imageUrl: row.image_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    await logAdminAction({
      action: 'update_event',
      entityType: 'event',
      entityId: eventItem.id,
      summary: `Memperbarui acara "${eventItem.title}" (${eventItem.status}) oleh ${session.profile.displayName}`,
      metadata: {
        title: eventItem.title,
        slug: eventItem.slug,
        status: eventItem.status,
        locationId: eventItem.locationId,
        startAt: eventItem.startAt,
        endAt: eventItem.endAt,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath('/');

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

export async function toggleEventPublishAction(input: {
  id: string;
  status: EventStatus;
}): Promise<ActionResponse<EventItem>> {
  try {
    const session = await requireAdmin();
    const supabase = await createClient();

    const { data: updatedRow, error: updateError } = await supabase
      .from('events')
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', input.id)
      .select(
        `
        id,
        title,
        slug,
        description,
        location_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealer_locations (
          id,
          name,
          address,
          city,
          phone,
          is_active,
          created_at,
          updated_at
        )
      `
      )
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal mengubah status publikasi acara.',
      };
    }

    type ReturnedRow = Database['public']['Tables']['events']['Row'] & {
      dealer_locations: Database['public']['Tables']['dealer_locations']['Row'] | null;
    };
    const row = updatedRow as unknown as ReturnedRow;

    const eventItem: EventItem = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      locationId: row.location_id,
      location: row.dealer_locations
        ? {
            id: row.dealer_locations.id,
            name: row.dealer_locations.name,
            address: row.dealer_locations.address,
            city: row.dealer_locations.city,
            phone: row.dealer_locations.phone,
            isActive: row.dealer_locations.is_active,
            createdAt: row.dealer_locations.created_at,
            updatedAt: row.dealer_locations.updated_at,
          }
        : null,
      startAt: row.start_at,
      endAt: row.end_at,
      imageUrl: row.image_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    await logAdminAction({
      action: 'toggle_event_status',
      entityType: 'event',
      entityId: eventItem.id,
      summary: `${eventItem.status === 'published' ? 'Mempublikasikan' : 'Menjadikan draf'} acara "${eventItem.title}" oleh ${session.profile.displayName}`,
      metadata: {
        status: eventItem.status,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath('/');

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
    const supabase = await createClient();

    // 1. Retrieve event to get poster URL and title for cleanup/audit
    const { data: eventData } = await supabase
      .from('events')
      .select('id, title, image_url')
      .eq('id', id)
      .maybeSingle();

    const existingEvent = eventData as {
      id: string;
      title: string;
      image_url: string | null;
    } | null;

    if (existingEvent?.image_url) {
      await removeStoragePoster(existingEvent.image_url);
    }

    const { error: deleteError } = await supabase.from('events').delete().eq('id', id);

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message || 'Gagal menghapus data acara.',
      };
    }

    await logAdminAction({
      action: 'delete_event',
      entityType: 'event',
      entityId: id,
      summary: `Menghapus acara "${existingEvent?.title || id}" oleh ${session.profile.displayName}`,
      metadata: {
        deletedId: id,
      },
    });

    revalidatePath('/admin/events');
    revalidatePath('/events');
    revalidatePath('/');

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
