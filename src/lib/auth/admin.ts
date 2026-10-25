import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createClient } from '@/lib/supabase/server';

export interface AdminProfile {
  userId: string;
  displayName: string;
  role: 'admin';
  isActive: boolean;
  email?: string;
}

export interface AuthenticatedAdminSession {
  user: User;
  profile: AdminProfile;
}

/**
 * Validates whether the current caller is an authenticated user with an active
 * administrator record in `staff_profiles`.
 *
 * An authenticated session alone DOES NOT grant administrative access.
 * The user record must match an active row in `staff_profiles` with role = 'admin'.
 */
export async function getAuthenticatedAdmin(
  client?: SupabaseClient<Database>
): Promise<AuthenticatedAdminSession | null> {
  const supabase = client ?? (await createClient());

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error: profileError } = await supabase
    .from('staff_profiles')
    .select('user_id, display_name, role, is_active')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle();

  const profile = data as {
    user_id: string;
    display_name: string;
    role: string;
    is_active: boolean;
  } | null;

  if (profileError || !profile) {
    return null;
  }

  return {
    user,
    profile: {
      userId: profile.user_id,
      displayName: profile.display_name,
      role: 'admin',
      isActive: profile.is_active,
      email: user.email,
    },
  };
}

/**
 * Server-side guard for protected Admin routes and actions.
 * Redirects to `/admin/login` if the user is unauthenticated or not an active administrator.
 */
export async function requireAdmin(
  client?: SupabaseClient<Database>
): Promise<AuthenticatedAdminSession> {
  const session = await getAuthenticatedAdmin(client);
  if (!session) {
    redirect('/admin/login');
  }
  return session;
}
