'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { SignOutButton } from '@/components/admin/SignOutButton';

interface AdminLayoutShellProps {
  adminProfile: {
    displayName: string;
    role: string;
  };
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  exact: boolean;
  icon: (active: boolean) => React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Dasbor',
    href: '/admin',
    exact: true,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: 'Motor',
    href: '/admin/motor',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    name: 'Harga',
    href: '/admin/harga',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    name: 'Promo',
    href: '/admin/promo',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        />
      </svg>
    ),
  },
  {
    name: 'Spanduk',
    href: '/admin/banner',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Inquiry',
    href: '/admin/leads',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
  {
    name: 'Dealer',
    href: '/admin/dealerships',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    name: 'Pengaturan',
    href: '/admin/settings',
    exact: false,
    icon: (active) => (
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

export function AdminLayoutShell({ adminProfile, children }: AdminLayoutShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile drawer upon route transition during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isItemActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Determine current section title for the top bar breadcrumb
  const currentNav = navItems.find((item) => isItemActive(item.href, item.exact));
  const currentSectionName = currentNav?.name || 'Portal Admin';

  const renderNavLinks = (onNavigate?: () => void) => (
    <nav aria-label="Navigasi Admin Utama" className="space-y-1 px-3 py-4">
      {navItems.map((item) => {
        const active = isItemActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`group flex items-center px-3 py-2.5 text-xs font-semibold rounded-none transition-colors border-l-4 ${
              active
                ? 'bg-primary/5 text-primary border-primary font-bold'
                : 'text-body hover:text-ink hover:bg-neutral-2/60 border-transparent'
            } focus-visible:ring-2 focus-visible:ring-primary focus:outline-none`}
          >
            {item.icon(active)}
            <span className="ml-3 tracking-wide">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* =========================================================================
          1. Desktop Persistent Left Sidebar
         ========================================================================= */}
      <aside
        aria-label="Bilah Sisi Admin"
        className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-64 flex-col justify-between border-r border-hairline bg-surface"
      >
        <div className="flex-1 flex flex-col">
          {/* Sidebar Brand Header */}
          <div className="h-16 px-6 border-b border-hairline flex items-center space-x-3 shrink-0">
            <span className="w-3 h-3 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <Link
                href="/admin"
                className="font-heading font-bold text-sm tracking-tight text-ink truncate block hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {dealershipCopy.dealer.name}
              </Link>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted block">
                Portal Administrator
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto">{renderNavLinks()}</div>
        </div>

        {/* Sidebar Footer Link */}
        <div className="p-4 border-t border-hairline bg-neutral-2/20 shrink-0">
          <Link
            href="/"
            className="flex items-center justify-between text-xs font-medium text-body hover:text-ink transition-colors p-2 rounded-none hover:bg-neutral-2/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Tinjau Showroom Publik</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </aside>

      {/* =========================================================================
          2. Mobile/Tablet Collapsible Drawer (Accessible)
         ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-neutral-1/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface border-r border-hairline shadow-xl z-50">
            {/* Drawer Header */}
            <div className="h-16 px-6 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-primary shrink-0" aria-hidden="true" />
                <span className="font-heading font-bold text-sm text-ink truncate">
                  {dealershipCopy.dealer.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-muted hover:text-ink hover:bg-neutral-2 rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Tutup menu navigasi admin"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto">
              {renderNavLinks(() => setIsMobileMenuOpen(false))}
            </div>

            {/* Drawer Footer Link */}
            <div className="p-4 border-t border-hairline bg-neutral-2/20">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-xs font-medium text-body hover:text-ink transition-colors p-2 rounded-none"
              >
                <span>Tinjau Showroom Publik</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. Top Bar & Main Content (Offset by Sidebar on Desktop)
         ========================================================================= */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Minimal Top Bar */}
        <header className="sticky top-0 z-20 w-full border-b border-hairline bg-surface/95 backdrop-blur-xs shadow-xs">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left side: Mobile Toggle & Context Indicator */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 text-ink hover:bg-neutral-2 border border-hairline rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={isMobileMenuOpen}
                aria-label="Buka menu navigasi admin"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-ink font-heading">
                  {currentSectionName}
                </span>
                <span className="hidden sm:inline-block text-muted text-xs">&bull;</span>
                <span className="hidden sm:inline-block text-xs text-muted">
                  Portal Administrasi Showroom
                </span>
              </div>
            </div>

            {/* Right side: Admin profile & Logout button */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-ink">{adminProfile.displayName}</p>
                <p className="text-[10px] text-muted uppercase tracking-wider">
                  {adminProfile.role === 'admin' ? 'Administrator' : adminProfile.role}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-hairline bg-surface py-4 text-center text-xs text-muted">
          <p>
            &copy; {new Date().getFullYear()} {dealershipCopy.dealer.name}.{' '}
            {dealershipCopy.common.copyrightNotice}
          </p>
        </footer>
      </div>
    </div>
  );
}
