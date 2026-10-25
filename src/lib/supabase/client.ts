import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates or reuses a browser-side Supabase client for Client Components.
 * Never use service-role credentials here.
 */
export function createClient(supabaseUrl?: string, supabaseAnonKey?: string) {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase client initialization failed: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined.'
    );
  }

  // Reuse singleton on browser when called without custom credentials
  if (!supabaseUrl && !supabaseAnonKey && browserClient) {
    return browserClient;
  }

  const client = createBrowserClient<Database>(url, anonKey);

  if (!supabaseUrl && !supabaseAnonKey && typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
}
