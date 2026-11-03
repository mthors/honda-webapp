import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { AdminLayoutShell } from '@/components/admin/AdminLayoutShell';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <AdminLayoutShell
      adminProfile={{
        displayName: session.profile.displayName,
        role: session.profile.role,
      }}
    >
      {children}
    </AdminLayoutShell>
  );
}
