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

            <nav
              aria-label="Navigasi Admin Utama"
              className="hidden md:flex items-center space-x-1 text-xs font-medium ml-4 pl-4 border-l border-hairline"
            >
              <Link
                href="/admin"
                className="px-2.5 py-1.5 text-body hover:text-ink hover:bg-neutral-2 rounded-xs transition-colors"
              >
                Dasbor
              </Link>
              <Link
                href="/admin/harga"
                className="px-2.5 py-1.5 text-body hover:text-ink hover:bg-neutral-2 rounded-xs transition-colors"
              >
                Harga
              </Link>
              <Link
                href="/admin/promo"
                className="px-2.5 py-1.5 text-body hover:text-ink hover:bg-neutral-2 rounded-xs transition-colors"
              >
                Promo
              </Link>
              <Link
                href="/admin/banner"
                className="px-2.5 py-1.5 text-body hover:text-ink hover:bg-neutral-2 rounded-xs transition-colors"
              >
                Spanduk
              </Link>
            </nav>
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

      <div className="md:hidden border-b border-hairline bg-surface px-4 py-2.5 flex items-center space-x-2 text-xs font-medium overflow-x-auto">
        <Link
          href="/admin"
          className="px-2.5 py-1 text-body hover:text-ink bg-neutral-2/50 rounded-xs whitespace-nowrap"
        >
          Dasbor
        </Link>
        <Link
          href="/admin/harga"
          className="px-2.5 py-1 text-body hover:text-ink bg-neutral-2/50 rounded-xs whitespace-nowrap"
        >
          Harga
        </Link>
        <Link
          href="/admin/promo"
          className="px-2.5 py-1 text-body hover:text-ink bg-neutral-2/50 rounded-xs whitespace-nowrap"
        >
          Promo
        </Link>
        <Link
          href="/admin/banner"
          className="px-2.5 py-1 text-body hover:text-ink bg-neutral-2/50 rounded-xs whitespace-nowrap"
        >
          Spanduk
        </Link>
      </div>

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
