'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';

export const PublicHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const navItems = [
    { href: '/', label: dealershipCopy.nav.home },
    { href: '/motor', label: dealershipCopy.nav.motorcycles },
    { href: '/harga', label: dealershipCopy.nav.priceList },
    { href: '/promo', label: dealershipCopy.nav.promotions },
    { href: '/hubungi', label: dealershipCopy.nav.aboutContact },
  ];

  const whatsappNumber = process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Halo Honda Mega Persada Mandiri, saya ingin berkonsultasi mengenai motor Honda.'
      )}`
    : '/hubungi';

  return (
    <>
      {/* Top Dealer Identity & Operating Area Announcement Strip */}
      <div className="bg-surface-alt text-on-primary py-2 px-4 text-xs font-medium text-center border-b border-neutral-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>{dealershipCopy.dealer.officialBadge} — Sidoarjo, Jawa Timur</span>
        </div>
      </div>

      {/* Main Sticky Navigation Header */}
      <header className="border-b border-hairline bg-canvas sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Dealership Logo & Identity */}
          <Link
            href="/"
            className="flex flex-col focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-1"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-ink font-manrope">
              HONDA <span className="text-primary">MEGA PERSADA MANDIRI</span>
            </span>
            <span className="text-[11px] sm:text-xs text-muted font-normal">
              {dealershipCopy.dealer.tagline}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-2 transition-colors relative hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    isActive ? 'text-primary font-semibold border-b-2 border-primary' : 'text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Call to Action & Mobile Hamburger Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              {whatsappNumber ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Button variant="primary" size="sm">
                    {dealershipCopy.common.contactSales}
                  </Button>
                </a>
              ) : (
                <Link
                  href="/hubungi"
                  className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Button variant="primary" size="sm">
                    {dealershipCopy.common.contactSales}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              id="mobile-menu-toggle"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={
                isMenuOpen ? dealershipCopy.nav.menuButtonClose : dealershipCopy.nav.menuButtonOpen
              }
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] text-ink hover:text-primary hover:bg-neutral-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            >
              {isMenuOpen ? (
                /* Accessible Close 'X' Icon */
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                /* Accessible Hamburger Icon */
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Accessible Mobile Navigation Panel / Drawer */}
        <div
          id="mobile-navigation"
          role="region"
          aria-label="Menu Navigasi Mobile"
          className={`md:hidden overflow-hidden transition-all duration-200 motion-reduce:transition-none border-t border-hairline bg-canvas ${
            isMenuOpen
              ? 'max-h-[450px] opacity-100 shadow-lg'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="px-4 pt-3 pb-6 space-y-2">
            {navItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-3 text-base font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                    isActive
                      ? 'bg-neutral-2 text-primary font-bold border-l-4 border-primary pl-2'
                      : 'text-ink hover:bg-neutral-2 hover:text-primary'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-hairline mt-4">
              {whatsappNumber ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="primary" fullWidth size="md">
                    {dealershipCopy.common.contactSales}
                  </Button>
                </a>
              ) : (
                <Link
                  href="/hubungi"
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="primary" fullWidth size="md">
                    {dealershipCopy.common.contactSales}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
