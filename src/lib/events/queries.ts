import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { DealerLocationItem, EventItem } from '@/types/events';
import { createClient } from '@/lib/supabase/server';

type ClientType = SupabaseClient<Database>;

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

export async function getAdminDealerLocations(client?: ClientType): Promise<DealerLocationItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('dealer_locations')
      .select('*')
      .order('city', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching admin dealer locations:', error.message);
      return [];
    }

    return (data || []).map(mapDealerLocationRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load admin dealer locations:', err);
    return [];
  }
}

export async function getActiveDealerLocations(client?: ClientType): Promise<DealerLocationItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('dealer_locations')
      .select('*')
      .eq('is_active', true)
      .order('city', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active dealer locations:', error.message);
      return [];
    }

    return (data || []).map(mapDealerLocationRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load active dealer locations:', err);
    return [];
  }
}

type EventRowWithLocation = Database['public']['Tables']['events']['Row'] & {
  dealer_locations: Database['public']['Tables']['dealer_locations']['Row'] | null;
};

function mapEventRow(row: EventRowWithLocation): EventItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    locationId: row.location_id,
    location: row.dealer_locations ? mapDealerLocationRow(row.dealer_locations) : null,
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
      .order('start_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin events:', error.message);
      return [];
    }

    return (data || []).map((row) => mapEventRow(row as unknown as EventRowWithLocation));
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
        location_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealer_locations!inner (
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

    return (data || []).map((row) => mapEventRow(row as unknown as EventRowWithLocation));
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
        location_id,
        start_at,
        end_at,
        image_url,
        status,
        created_at,
        updated_at,
        dealer_locations!inner (
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
      .eq('status', 'published')
      .gte('end_at', nowIso)
      .order('start_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching public upcoming events:', error.message);
      return [];
    }

    return (data || []).map((row) => mapEventRow(row as unknown as EventRowWithLocation));
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
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapEventRow(data as unknown as EventRowWithLocation);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error(`Failed to load event for slug "${slug}":`, err);
    return null;
  }
}
