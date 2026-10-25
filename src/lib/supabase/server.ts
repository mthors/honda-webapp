import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a server-side Supabase client for Server Components, Server Actions,
 * and Route Handlers with secure cookie persistence.
 */
export async function createClient(
  customUrl?: string,
  customAnonKey?: string,
  customCookieStore?: Awaited<ReturnType<typeof cookies>>
) {
  const url = customUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = customAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Server Supabase client initialization failed: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }

  const cookieStore = customCookieStore ?? (await cookies());

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // In Next.js, Server Components cannot mutate cookies directly.
          // This can be ignored if session refreshing is handled via middleware or actions.
        }
      },
    },
  });
}
