import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { SiteSettings, DealershipItem } from '@/types/settings';

type ClientType = SupabaseClient<Database>;

/**
 * Fetches group-level site settings (singleton row 'default').
 * Falls back to null if unseeded or database unavailable.
 */
export async function getSiteSettings(client?: ClientType): Promise<SiteSettings | null> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('Error fetching site_settings:', error.message);
      return null;
    }

    if (!data) return null;

    type SettingsRow = Database['public']['Tables']['site_settings']['Row'];
    const row = data as unknown as SettingsRow;

    return {
      id: row.id,
      dealerName: row.dealer_name,
      logoPath: row.logo_path,
      address: row.address,
      city: row.city,
      phone: row.phone,
      whatsappNumber: row.whatsapp_number,
      publicEmail: row.public_email,
      openingHours: (row.opening_hours || {}) as Record<string, string>,
      socialLinks: (row.social_links || {}) as Record<string, string>,
      privacyNotice: row.privacy_notice,
      updatedBy: row.updated_by,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load site_settings:', err);
    return null;
  }
}

/**
 * Fetches the registered dealership records.
 * Keeps individual dealership locations separate from group settings.
 */
export async function getDealerships(client?: ClientType): Promise<DealershipItem[]> {
  try {
    const supabase = client ?? (await createClient());
    const { data, error } = await supabase
      .from('dealerships')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching dealerships:', error.message);
      return [];
    }

    if (!data) return [];

    type DealershipRow = Database['public']['Tables']['dealerships']['Row'];
    const rows = data as unknown as DealershipRow[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      city: r.city,
      address: r.address,
      phone: r.phone,
      whatsappNumber: r.whatsapp_number,
      openingHours: r.opening_hours,
      isSynthetic: r.is_synthetic,
      isActive: r.is_active,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    if ((err as { digest?: string })?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('Failed to load dealerships:', err);
    return [];
  }
}
