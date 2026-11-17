import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { EventItem } from '@/types/events';
import type { DealershipItem } from '@/types/dealership';
import { createClient } from '@/lib/supabase/server';

type ClientType = SupabaseClient<Database>;

function mapDealershipRow(
  row: Database['public']['Tables']['dealerships']['Row']
): DealershipItem {
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

function mapEventRow(row: EventRowWithDealership): EventItem {
  const mappedDealership = row.dealerships ? mapDealershipRow(row.dealerships) : null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    dealershipId: row.dealership_id,
    dealership: mappedDealership,
    locationId: row.dealership_id,
    location: mappedDealership,
    startAt: row.start_at,
    endAt: row.end_at,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAdminEvents(client?: ClientType): Promise<EventItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('events')
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
      .order('start_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin events:', error.message);
      return [];
    }

    return (data || []).map((row) => mapEventRow(row as unknown as EventRowWithDealership));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin events:', err);
    return [];
  }
}

export async function getPublicEvents(
  client?: ClientType,
  options?: {
    startRange?: string;
    endRange?: string;
  }
): Promise<EventItem[]> {
  try {
    const supabase = client ?? (await createClient());
    let query = supabase
      .from('events')
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
        dealerships!inner (
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
      .eq('status', 'published')
      .order('start_at', { ascending: true });

    if (options?.startRange) {
      query = query.gte('end_at', options.startRange);
    }
    if (options?.endRange) {
      query = query.lte('start_at', options.endRange);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching public events:', error.message);
      return [];
    }

    return (data || []).map((row) => mapEventRow(row as unknown as EventRowWithDealership));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load public events:', err);
    return [];
  }
}

export async function getPublicUpcomingEvents(
  client?: ClientType,
  limit: number = 6
): Promise<EventItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('events')
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
        dealerships!inner (
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
      .eq('status', 'published')
      .gte('end_at', nowIso)
      .order('start_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching public upcoming events:', error.message);
      return [];
    }

    return (data || []).map((row) => mapEventRow(row as unknown as EventRowWithDealership));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load public upcoming events:', err);
    return [];
  }
}

export async function getPublicEventBySlug(
  slug: string,
  client?: ClientType
): Promise<EventItem | null> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('events')
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
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapEventRow(data as unknown as EventRowWithDealership);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error(`Failed to load event for slug "${slug}":`, err);
    return null;
  }
}
