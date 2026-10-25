import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInAdmin, signOutAdmin } from './actions';
import * as serverSupabase from '@/lib/supabase/server';
import * as adminAuth from '@/lib/auth/admin';
import { dealershipCopy } from '@/content/copy/id';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe('Admin Server Actions', () => {
  const mockSignInWithPassword = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  describe('signInAdmin', () => {
    it('returns error when email format is invalid', async () => {
      const formData = new FormData();
      formData.set('email', 'not-an-email');
      formData.set('password', 'secret123');

      const result = await signInAdmin(undefined, formData);
      expect(result.error).toBe('Masukkan alamat email dan kata sandi yang valid.');
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('returns error when password is too short', async () => {
      const formData = new FormData();
      formData.set('email', 'admin@example.com');
      formData.set('password', '123');

      const result = await signInAdmin(undefined, formData);
      expect(result.error).toBe('Masukkan alamat email dan kata sandi yang valid.');
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('returns invalid credentials error when Supabase auth fails', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        error: new Error('Invalid login credentials'),
      });

      const formData = new FormData();
      formData.set('email', 'admin@example.com');
      formData.set('password', 'wrong-password');

      const result = await signInAdmin(undefined, formData);
      expect(result.error).toBe(dealershipCopy.adminAuth.invalidCredentialsError);
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1);
    });

    it('immediately signs out and rejects if user has no active admin record in staff_profiles', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });
      vi.spyOn(adminAuth, 'getAuthenticatedAdmin').mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.set('email', 'regular-user@example.com');
      formData.set('password', 'secret123');

      const result = await signInAdmin(undefined, formData);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(result.error).toBe(dealershipCopy.adminAuth.unauthorizedError);
    });

    it('redirects to /admin when user is a verified active admin', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({ error: null });
      vi.spyOn(adminAuth, 'getAuthenticatedAdmin').mockResolvedValueOnce({
        user: { id: 'usr-1' } as unknown as adminAuth.AuthenticatedAdminSession['user'],
        profile: {
          userId: 'usr-1',
          displayName: 'Admin User',
          role: 'admin',
          isActive: true,
        },
      });

      const formData = new FormData();
      formData.set('email', 'admin@megapersada.co.id');
      formData.set('password', 'secret123');

      await expect(signInAdmin(undefined, formData)).rejects.toThrow('NEXT_REDIRECT:/admin');
    });
  });

  describe('signOutAdmin', () => {
    it('calls signOut and redirects to /admin/login', async () => {
      await expect(signOutAdmin()).rejects.toThrow('NEXT_REDIRECT:/admin/login');
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
