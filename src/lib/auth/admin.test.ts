import { describe, it, expect, vi } from 'vitest';
import { getAuthenticatedAdmin, requireAdmin } from './admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

function createMockClient(options: {
  user?: { id: string; email?: string } | null;
  profile?: { user_id: string; display_name: string; role: string; is_active: boolean } | null;
  authError?: Error | null;
  profileError?: Error | null;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.authError ?? null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: options.profile ?? null,
          error: options.profileError ?? null,
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

describe('Admin authentication and authorization helpers', () => {
  it('returns null if there is no authenticated user session', async () => {
    const mockClient = createMockClient({ user: null });
    const result = await getAuthenticatedAdmin(mockClient);
    expect(result).toBeNull();
  });

  it('returns null if an auth error occurs', async () => {
    const mockClient = createMockClient({
      user: null,
      authError: new Error('Session expired'),
    });
    const result = await getAuthenticatedAdmin(mockClient);
    expect(result).toBeNull();
  });

  it('returns null if the authenticated user has no record in staff_profiles', async () => {
    const mockClient = createMockClient({
      user: { id: 'usr-123', email: 'guest@example.com' },
      profile: null,
    });
    const result = await getAuthenticatedAdmin(mockClient);
    expect(result).toBeNull();
  });

  it('returns null if the staff profile is not active or not an admin', async () => {
    const mockClient = createMockClient({
      user: { id: 'usr-123', email: 'staff@example.com' },
      profile: null, // query filtered on role='admin' and is_active=true returned null
    });
    const result = await getAuthenticatedAdmin(mockClient);
    expect(result).toBeNull();
  });

  it('returns user and profile when the user has an active admin record', async () => {
    const mockClient = createMockClient({
      user: { id: 'usr-admin-1', email: 'admin@satryagroup.co.id' },
      profile: {
        user_id: 'usr-admin-1',
        display_name: 'Budi Santoso',
        role: 'admin',
        is_active: true,
      },
    });

    const result = await getAuthenticatedAdmin(mockClient);
    expect(result).not.toBeNull();
    expect(result?.profile.displayName).toBe('Budi Santoso');
    expect(result?.profile.role).toBe('admin');
    expect(result?.profile.isActive).toBe(true);
    expect(result?.profile.email).toBe('admin@satryagroup.co.id');
  });

  it('redirects to /admin/login when requireAdmin encounters an unauthenticated caller', async () => {
    const mockClient = createMockClient({ user: null });

    await expect(requireAdmin(mockClient)).rejects.toThrow('NEXT_REDIRECT:/admin/login');
  });

  it('returns authenticated session when requireAdmin succeeds', async () => {
    const mockClient = createMockClient({
      user: { id: 'usr-admin-1', email: 'admin@satryagroup.co.id' },
      profile: {
        user_id: 'usr-admin-1',
        display_name: 'Budi Santoso',
        role: 'admin',
        is_active: true,
      },
    });

    const session = await requireAdmin(mockClient);
    expect(session.user.id).toBe('usr-admin-1');
    expect(session.profile.displayName).toBe('Budi Santoso');
  });
});
