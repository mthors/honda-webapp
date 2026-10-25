import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { dealershipCopy } from '@/content/copy/id';
import { SignOutButton } from '@/components/admin/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-hairline bg-surface shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="font-heading font-bold text-sm tracking-tight text-ink">
                {dealershipCopy.dealer.name}
              </span>
              <span className="hidden sm:inline-block text-xs text-muted border-l border-hairline pl-2">
                Portal Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-ink">{session.profile.displayName}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider">
                {session.profile.role}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      <footer className="border-t border-hairline bg-surface py-4 text-center text-xs text-muted">
        <p>
          &copy; {new Date().getFullYear()} {dealershipCopy.dealer.name}.{' '}
          {dealershipCopy.common.copyrightNotice}
        </p>
      </footer>
    </div>
  );
}
