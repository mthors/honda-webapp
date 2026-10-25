'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { dealershipCopy } from '@/content/copy/id';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  error?: string | null;
}

export async function signInAdmin(
  prevState: LoginActionState | undefined,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get('email');
  const password = formData.get('password');

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      error: 'Masukkan alamat email dan kata sandi yang valid.',
    };
  }

  try {
    const supabase = await createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      return {
        error: dealershipCopy.adminAuth.invalidCredentialsError,
      };
    }

    // Verify staff profile authorization: An authenticated user is NOT automatically an admin
    const adminSession = await getAuthenticatedAdmin(supabase);
    if (!adminSession) {
      // Force immediate sign-out to prevent lingering unauthorized session
      await supabase.auth.signOut();
      return {
        error: dealershipCopy.adminAuth.unauthorizedError,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    return {
      error: dealershipCopy.adminAuth.unexpectedError,
    };
  }

  redirect('/admin');
}

export async function signOutAdmin(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // If sign-out fails on client or network, still redirect to login
  }
  redirect('/admin/login');
}
