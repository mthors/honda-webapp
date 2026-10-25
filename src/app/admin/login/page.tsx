import React from 'react';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';

export const metadata = {
  title: 'Masuk Portal Administrator — Honda Mega Persada Mandiri',
  description: 'Halaman masuk staf dan administrator resmi Honda Mega Persada Mandiri.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginPage() {
  try {
    const adminSession = await getAuthenticatedAdmin();
    if (adminSession) {
      redirect('/admin');
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // In unconfigured local dev environments, allow rendering the login UI
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
