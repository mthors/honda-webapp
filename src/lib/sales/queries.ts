import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type {
  ProvinceItem,
  RegencyItem,
  DealershipServiceAreaItem,
  SalesRepresentativeItem,
  SalesManagementData,
} from '@/types/sales';
import { getDealerships } from '@/lib/settings/queries';
import type { DealershipItem } from '@/types/dealership';

type ClientType = Awaited<ReturnType<typeof createClient>>;

type ServiceAreaRowWithJoins = Database['public']['Tables']['dealership_service_areas']['Row'] & {
  dealerships?: Database['public']['Tables']['dealerships']['Row'] | null;
  regencies?: Database['public']['Tables']['regencies']['Row'] | null;
};

type SalesRepRowWithJoins = Database['public']['Tables']['sales_representatives']['Row'] & {
  dealerships?: Database['public']['Tables']['dealerships']['Row'] | null;
};

export function mapProvinceRow(r: Database['public']['Tables']['provinces']['Row']): ProvinceItem {
  return {
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapRegencyRow(r: Database['public']['Tables']['regencies']['Row']): RegencyItem {
  return {
    id: r.id,
    provinceId: r.province_id,
    name: r.name,
    type: r.type,
    sortOrder: r.sort_order,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapServiceAreaRow(
  r: Database['public']['Tables']['dealership_service_areas']['Row'] & {
    dealerships?: Database['public']['Tables']['dealerships']['Row'] | null;
    regencies?: Database['public']['Tables']['regencies']['Row'] | null;
  }
): DealershipServiceAreaItem {
  return {
    id: r.id,
    dealershipId: r.dealership_id,
    regencyId: r.regency_id,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    dealership: r.dealerships
      ? {
          id: r.dealerships.id,
          name: r.dealerships.name,
          code: r.dealerships.code,
          city: r.dealerships.city,
          address: r.dealerships.address,
          phone: r.dealerships.phone,
          whatsappNumber: r.dealerships.whatsapp_number,
          openingHours: r.dealerships.opening_hours,
          isSynthetic: r.dealerships.is_synthetic ?? false,
          isActive: r.dealerships.is_active,
          sortOrder: r.dealerships.sort_order ?? 0,
          createdAt: r.dealerships.created_at,
          updatedAt: r.dealerships.updated_at,
        }
      : null,
    regency: r.regencies
      ? {
          id: r.regencies.id,
          provinceId: r.regencies.province_id,
          name: r.regencies.name,
          type: r.regencies.type,
          sortOrder: r.regencies.sort_order,
          isActive: r.regencies.is_active,
          createdAt: r.regencies.created_at,
          updatedAt: r.regencies.updated_at,
        }
      : null,
  };
}

export function mapSalesRepresentativeRow(
  r: Database['public']['Tables']['sales_representatives']['Row'] & {
    dealerships?: Database['public']['Tables']['dealerships']['Row'] | null;
  }
): SalesRepresentativeItem {
  return {
    id: r.id,
    dealershipId: r.dealership_id,
    name: r.name,
    whatsappNumber: r.whatsapp_number,
    photoUrl: r.photo_url,
    position: r.position,
    isActive: r.is_active,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    dealership: r.dealerships
      ? {
          id: r.dealerships.id,
          name: r.dealerships.name,
          code: r.dealerships.code,
          city: r.dealerships.city,
          address: r.dealerships.address,
          phone: r.dealerships.phone,
          whatsappNumber: r.dealerships.whatsapp_number,
          openingHours: r.dealerships.opening_hours,
          isSynthetic: r.dealerships.is_synthetic ?? false,
          isActive: r.dealerships.is_active,
          sortOrder: r.dealerships.sort_order ?? 0,
          createdAt: r.dealerships.created_at,
          updatedAt: r.dealerships.updated_at,
        }
      : null,
  };
}

/**
 * Fetches all provinces, ordered by sort_order and name.
 */
export async function getProvinces(client?: ClientType): Promise<ProvinceItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching provinces:', error.message);
      return [];
    }

    if (!data) return [];
    return data.map(mapProvinceRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception fetching provinces:', err);
    return [];
  }
}

/**
 * Fetches regencies, optionally filtered by provinceId.
 */
export async function getRegencies(
  provinceId?: string,
  client?: ClientType
): Promise<RegencyItem[]> {
  try {
    const supabase = client ?? (await createClient());
    let query = supabase.from('regencies').select('*');

    if (provinceId) {
      query = query.eq('province_id', provinceId);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching regencies:', error.message);
      return [];
    }

    if (!data) return [];
    return data.map(mapRegencyRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception fetching regencies:', err);
    return [];
  }
}

/**
 * Fetches dealership service area assignments with joined dealership and regency.
 */
export async function getDealershipServiceAreas(
  dealershipId?: string,
  client?: ClientType
): Promise<DealershipServiceAreaItem[]> {
  try {
    const supabase = client ?? (await createClient());
    let query = supabase.from('dealership_service_areas').select(`
      *,
      dealerships (*),
      regencies (*)
    `);

    if (dealershipId) {
      query = query.eq('dealership_id', dealershipId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dealership service areas:', error.message);
      return [];
    }

    if (!data) return [];
    return (data as unknown as ServiceAreaRowWithJoins[]).map(mapServiceAreaRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception fetching dealership service areas:', err);
    return [];
  }
}

/**
 * Fetches sales representatives, optionally filtered by dealershipId.
 */
export async function getSalesRepresentatives(
  dealershipId?: string,
  client?: ClientType
): Promise<SalesRepresentativeItem[]> {
  try {
    const supabase = client ?? (await createClient());
    let query = supabase.from('sales_representatives').select(`
      *,
      dealerships (*)
    `);

    if (dealershipId) {
      query = query.eq('dealership_id', dealershipId);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching sales representatives:', error.message);
      return [];
    }

    if (!data) return [];
    return (data as unknown as SalesRepRowWithJoins[]).map(mapSalesRepresentativeRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception fetching sales representatives:', err);
    return [];
  }
}

/**
 * Aggregated loader for the /admin/sales management console.
 */
export async function getSalesManagementData(client?: ClientType): Promise<SalesManagementData> {
  const [dealerships, provinces, regencies, serviceAreas, salesReps] = await Promise.all([
    getDealerships(client),
    getProvinces(client),
    getRegencies(undefined, client),
    getDealershipServiceAreas(undefined, client),
    getSalesRepresentatives(undefined, client),
  ]);

  return {
    dealerships,
    provinces,
    regencies,
    serviceAreas,
    salesReps,
  };
}

/**
 * Fetches all active provinces for customer selection.
 */
export async function getActiveProvinces(client?: ClientType): Promise<ProvinceItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active provinces:', error.message);
      return [];
    }

    if (!data) return [];
    return data.map(mapProvinceRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception fetching active provinces:', err);
    return [];
  }
}

/**
 * Fetches active regencies for customer selection, filtered by provinceId.
 */
export async function getActiveRegencies(
  provinceId?: string,
  client?: ClientType
): Promise<RegencyItem[]> {
  try {
    const supabase = client ?? (await createClient());
    let query = supabase.from('regencies').select('*').eq('is_active', true);

    if (provinceId) {
      query = query.eq('province_id', provinceId);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching active regencies:', error.message);
      return [];
    }

    if (!data) return [];
    return data.map(mapRegencyRow);
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception fetching active regencies:', err);
    return [];
  }
}

/**
 * Public discovery query: Retrieves active dealership branches that serve the specified regency.
 *
 * Rules:
 * 1. Matches active dealership_service_areas where regency_id = regencyId.
 * 2. Only includes dealerships where is_active = true.
 * 3. Preserves dealership sort_order and name.
 * 4. Multiple dealerships can serve the same regency; all matching branches are returned.
 */
export async function getDealershipsByRegency(
  regencyId: string,
  client?: ClientType
): Promise<DealershipItem[]> {
  if (!regencyId || typeof regencyId !== 'string') {
    return [];
  }

  try {
    const supabase = client ?? (await createClient());

    const { data, error } = await supabase
      .from('dealership_service_areas')
      .select(
        `
        dealership_id,
        is_active,
        dealerships (*)
      `
      )
      .eq('regency_id', regencyId.trim())
      .eq('is_active', true);

    if (error) {
      console.error('Error discovering dealerships for regency:', error.message);
      return [];
    }

    if (!data) return [];

    type ServiceAreaWithDealership = {
      dealership_id: string;
      is_active: boolean;
      dealerships:
        | Database['public']['Tables']['dealerships']['Row']
        | Database['public']['Tables']['dealerships']['Row'][]
        | null;
    };

    const rows = data as unknown as ServiceAreaWithDealership[];

    const activeDealerships = rows
      .map((row) => {
        if (!row.dealerships) return null;
        if (Array.isArray(row.dealerships)) {
          return row.dealerships[0] ?? null;
        }
        return row.dealerships;
      })
      .filter((d): d is Database['public']['Tables']['dealerships']['Row'] =>
        Boolean(d && d.is_active)
      )
      .map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        city: d.city,
        address: d.address,
        phone: d.phone,
        whatsappNumber: d.whatsapp_number,
        openingHours: d.opening_hours,
        isSynthetic: d.is_synthetic,
        isActive: d.is_active,
        sortOrder: d.sort_order,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));

    // Deduplicate by id if any duplicate junction rows exist
    const seen = new Set<string>();
    const unique = activeDealerships.filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    // Sort by sortOrder, then name
    return unique.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Exception discovering dealerships for regency:', err);
    return [];
  }
}
