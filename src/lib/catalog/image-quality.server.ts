import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type ClientType = SupabaseClient<Database>;

/**
 * Resolves file sizes (in bytes) for objects stored across public Supabase storage buckets.
 * Calls storage list in parallel to avoid redundant network overhead.
 */
export async function getStorageImageSizes(client?: ClientType): Promise<Record<string, number>> {
  try {
    const supabase = client ?? (await createClient());
    const buckets = ['motorcycles', 'hero-banners'];
    const sizeMap: Record<string, number> = {};

    await Promise.all(
      buckets.map(async (bucket) => {
        try {
          const { data, error } = await supabase.storage.from(bucket).list('', {
            limit: 100,
            offset: 0,
          });

          if (!error && data) {
            for (const item of data) {
              if (item.name && item.metadata?.size) {
                // Index bare filename as well as bucket-prefixed key
                sizeMap[item.name] = item.metadata.size;
                sizeMap[`${bucket}/${item.name}`] = item.metadata.size;
              }
            }
          }
        } catch {
          // Gracefully continue if bucket is unreadable or offline
        }
      })
    );

    return sizeMap;
  } catch (err) {
    console.error('Failed to resolve storage image sizes:', err);
    return {};
  }
}
