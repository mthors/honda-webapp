'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { normalizeIndonesianPhone } from '@/lib/formatters';
import { useUserLocation } from '@/lib/sales/useUserLocation';
import type { SiteSettings } from '@/types/settings';

export interface PublicHeaderProps {
  settings?: SiteSettings | null;
}

export function PublicHeader({ settings }: PublicHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'motorcycles' | 'promoAgenda' | null>(null);
  const [mobileExpandedOverride, setMobileExpandedOverride] = useState<{
    motorcycles?: boolean;
    promoAgenda?: boolean;
  }>({});

  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  const motorcyclesDropdownRef = useRef<HTMLDivElement>(null);
  const promoAgendaDropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state during render when pathname changes
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenDropdown(null);
    setIsMenuOpen(false);
    setMobileExpandedOverride({});
  }

  const { location } = useUserLocation();
  const tLoc = dealershipCopy.locationDiscovery;

  const handleOpenLocationModal = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('honda-open-location-modal'));
    }
  };

  const isHomeActive = pathname === '/';
  const isMotorcyclesActive = pathname.startsWith('/motor') || pathname.startsWith('/harga');
  const isPromoAgendaActive = pathname.startsWith('/promo') || pathname.startsWith('/events');
  const isAboutContactActive = pathname.startsWith('/hubungi');

  const isMobileMotorcyclesExpanded = mobileExpandedOverride.motorcycles ?? isMotorcyclesActive;
  const isMobilePromoAgendaExpanded = mobileExpandedOverride.promoAgenda ?? isPromoAgendaActive;

  const handleLinkClick = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(null);
    setIsMenuOpen(false);
  };

  const handleMouseEnter = (dropdown: 'motorcycles' | 'promoAgenda') => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 180);
  };

  // Clear closing timeout on component unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Close mobile menu or open dropdown on Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        if (openDropdown) {
          setOpenDropdown(null);
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, openDropdown]);

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdown) return;

      const target = event.target as Node;
      if (
        openDropdown === 'motorcycles' &&
        motorcyclesDropdownRef.current &&
        !motorcyclesDropdownRef.current.contains(target)
      ) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setOpenDropdown(null);
      } else if (
        openDropdown === 'promoAgenda' &&
        promoAgendaDropdownRef.current &&
        !promoAgendaDropdownRef.current.contains(target)
      ) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

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

  const dealerName = settings?.dealerName?.trim() || dealershipCopy.dealer.name;

  // Derive brand display parts while preserving styling
  let brandPrefix = 'HONDA';
  let brandSuffix = 'SATRYA DEALER GROUP';
  if (dealerName.toLowerCase().startsWith('honda ')) {
    brandPrefix = 'HONDA';
    brandSuffix = dealerName.slice(6).trim().toUpperCase();
  } else if (dealerName.toUpperCase() !== 'HONDA') {
    brandPrefix = dealerName.toUpperCase();
    brandSuffix = '';
  }

  // Safe WhatsApp URL construction
  const rawWhatsApp = settings?.whatsappNumber || process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
  const cleanWhatsApp = rawWhatsApp ? normalizeIndonesianPhone(rawWhatsApp) : '';
  const hasValidWhatsApp = cleanWhatsApp.length >= 9;
  const whatsappUrl = hasValidWhatsApp
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        `Halo ${dealerName}, saya ingin berkonsultasi mengenai motor Honda.`
      )}`
    : null;

  return (
    <>
      {/* Top Dealer Identity & Operating Area Announcement Strip */}
      <div className="bg-surface-alt text-on-primary py-2 px-4 text-xs font-medium text-center border-b border-neutral-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>
            {dealershipCopy.dealer.officialBadge} — {dealerName}
          </span>
        </div>
      </div>

      {/* Main Sticky Navigation Header */}
      <header className="border-b border-hairline bg-canvas sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Dealership Logo & Identity */}
          <Link
            href="/"
            className="flex flex-col focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-1"
            onClick={handleLinkClick}
          >
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-ink font-manrope">
              {brandPrefix} {brandSuffix && <span className="text-primary">{brandSuffix}</span>}
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
            {/* 1. Beranda */}
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`py-2 transition-colors relative hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isHomeActive ? 'text-primary font-semibold border-b-2 border-primary' : 'text-ink'
              }`}
            >
              {dealershipCopy.nav.home}
            </Link>

            {/* 2. Sepeda Motor Dropdown */}
            <div
              ref={motorcyclesDropdownRef}
              className="relative"
              onMouseEnter={() => handleMouseEnter('motorcycles')}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter('motorcycles')}
              onBlur={(e) => {
                if (!motorcyclesDropdownRef.current?.contains(e.relatedTarget as Node)) {
                  handleMouseLeave();
                }
              }}
            >
              <button
                type="button"
                aria-expanded={openDropdown === 'motorcycles'}
                aria-haspopup="true"
                onClick={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setOpenDropdown((prev) => (prev === 'motorcycles' ? null : 'motorcycles'));
                }}
                className={`inline-flex items-center py-2 transition-colors relative hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isMotorcyclesActive
                    ? 'text-primary font-semibold border-b-2 border-primary'
                    : 'text-ink'
                }`}
              >
                <span>{dealershipCopy.nav.motorcycles}</span>
                <svg
                  className={`w-4 h-4 ml-1 transition-transform duration-200 motion-reduce:transition-none ${
                    openDropdown === 'motorcycles' ? 'rotate-180 text-primary' : 'text-neutral-5'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                className={`absolute top-full left-0 pt-1.5 z-50 transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                  openDropdown === 'motorcycles'
                    ? 'opacity-100 translate-y-0 visible pointer-events-auto'
                    : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                }`}
              >
                <div
                  role="menu"
                  aria-label={dealershipCopy.nav.motorcycles}
                  aria-hidden={openDropdown !== 'motorcycles'}
                  className="w-48 bg-canvas border border-hairline shadow-md py-1 rounded-none focus:outline-none"
                >
                  <Link
                    href="/motor"
                    role="menuitem"
                    onClick={handleLinkClick}
                    tabIndex={openDropdown === 'motorcycles' ? 0 : -1}
                    className={`block px-4 py-2.5 text-sm transition-colors focus:outline-none focus:bg-neutral-2 ${
                      pathname.startsWith('/motor')
                        ? 'text-primary font-semibold bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.motorcycleCatalog}
                  </Link>
                  <Link
                    href="/harga"
                    role="menuitem"
                    onClick={handleLinkClick}
                    tabIndex={openDropdown === 'motorcycles' ? 0 : -1}
                    className={`block px-4 py-2.5 text-sm transition-colors focus:outline-none focus:bg-neutral-2 ${
                      pathname.startsWith('/harga')
                        ? 'text-primary font-semibold bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.priceList}
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. Promo & Agenda Dropdown */}
            <div
              ref={promoAgendaDropdownRef}
              className="relative"
              onMouseEnter={() => handleMouseEnter('promoAgenda')}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter('promoAgenda')}
              onBlur={(e) => {
                if (!promoAgendaDropdownRef.current?.contains(e.relatedTarget as Node)) {
                  handleMouseLeave();
                }
              }}
            >
              <button
                type="button"
                aria-expanded={openDropdown === 'promoAgenda'}
                aria-haspopup="true"
                onClick={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setOpenDropdown((prev) => (prev === 'promoAgenda' ? null : 'promoAgenda'));
                }}
                className={`inline-flex items-center py-2 transition-colors relative hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isPromoAgendaActive
                    ? 'text-primary font-semibold border-b-2 border-primary'
                    : 'text-ink'
                }`}
              >
                <span>{dealershipCopy.nav.promoAndAgenda}</span>
                <svg
                  className={`w-4 h-4 ml-1 transition-transform duration-200 motion-reduce:transition-none ${
                    openDropdown === 'promoAgenda' ? 'rotate-180 text-primary' : 'text-neutral-5'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <div
                className={`absolute top-full left-0 pt-1.5 z-50 transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                  openDropdown === 'promoAgenda'
                    ? 'opacity-100 translate-y-0 visible pointer-events-auto'
                    : 'opacity-0 -translate-y-2 invisible pointer-events-none'
                }`}
              >
                <div
                  role="menu"
                  aria-label={dealershipCopy.nav.promoAndAgenda}
                  aria-hidden={openDropdown !== 'promoAgenda'}
                  className="w-48 bg-canvas border border-hairline shadow-md py-1 rounded-none focus:outline-none"
                >
                  <Link
                    href="/promo"
                    role="menuitem"
                    onClick={handleLinkClick}
                    tabIndex={openDropdown === 'promoAgenda' ? 0 : -1}
                    className={`block px-4 py-2.5 text-sm transition-colors focus:outline-none focus:bg-neutral-2 ${
                      pathname.startsWith('/promo')
                        ? 'text-primary font-semibold bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.promotions}
                  </Link>
                  <Link
                    href="/events"
                    role="menuitem"
                    onClick={handleLinkClick}
                    tabIndex={openDropdown === 'promoAgenda' ? 0 : -1}
                    className={`block px-4 py-2.5 text-sm transition-colors focus:outline-none focus:bg-neutral-2 ${
                      pathname.startsWith('/events')
                        ? 'text-primary font-semibold bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.events}
                  </Link>
                </div>
              </div>
            </div>

            {/* 4. Tentang & Kontak */}
            <Link
              href="/hubungi"
              onClick={handleLinkClick}
              className={`py-2 transition-colors relative hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isAboutContactActive
                  ? 'text-primary font-semibold border-b-2 border-primary'
                  : 'text-ink'
              }`}
            >
              {dealershipCopy.nav.aboutContact}
            </Link>
          </nav>

          {/* Desktop Call to Action & Mobile Hamburger Button */}
          <div className="flex items-center space-x-3">
            {/* Location Selector Trigger (Desktop) */}
            <button
              type="button"
              onClick={handleOpenLocationModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-body hover:text-primary border border-hairline bg-surface hover:bg-neutral-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary select-none rounded-none"
              title={
                location
                  ? `Lokasi terpilih: ${location.regencyName}. Klik untuk mengubah.`
                  : 'Pilih wilayah domisili Anda'
              }
            >
              <svg
                className="w-3.5 h-3.5 text-primary shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate max-w-[140px]">
                {location ? location.regencyName : tLoc.selectLocationPrompt}
              </span>
              <span className="text-[10px] text-muted font-normal uppercase">
                ({tLoc.changeLocationShort})
              </span>
            </button>

            <div className="hidden sm:block">
              {whatsappUrl ? (
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
              ? 'max-h-[600px] opacity-100 shadow-lg overflow-y-auto'
              : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="px-4 pt-3 pb-6 space-y-1">
            {/* Mobile Location Selector Trigger */}
            <div className="pb-2 border-b border-hairline mb-2">
              <button
                type="button"
                onClick={() => {
                  handleLinkClick();
                  handleOpenLocationModal();
                }}
                className="w-full inline-flex items-center justify-between px-3 py-2 text-xs font-semibold text-body hover:text-primary border border-hairline bg-surface hover:bg-neutral-1 transition-colors rounded-none"
              >
                <div className="flex items-center gap-2 truncate">
                  <svg
                    className="w-4 h-4 text-primary shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">
                    {location ? location.regencyName : tLoc.selectLocationPrompt}
                  </span>
                </div>
                <span className="text-[11px] text-primary font-bold uppercase shrink-0 pl-2">
                  {tLoc.changeLocationShort} &rarr;
                </span>
              </button>
            </div>

            {/* 1. Beranda */}
            <Link
              href="/"
              onClick={handleLinkClick}
              className={`block px-3 py-3 text-base font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                isHomeActive
                  ? 'bg-neutral-2 text-primary font-bold border-l-4 border-primary pl-2'
                  : 'text-ink hover:bg-neutral-2 hover:text-primary'
              }`}
            >
              {dealershipCopy.nav.home}
            </Link>

            {/* 2. Sepeda Motor Accordion */}
            <div>
              <button
                type="button"
                aria-expanded={isMobileMotorcyclesExpanded}
                onClick={() =>
                  setMobileExpandedOverride((prev) => ({
                    ...prev,
                    motorcycles: !isMobileMotorcyclesExpanded,
                  }))
                }
                className={`w-full px-3 py-3 text-base font-medium rounded-none min-h-[44px] flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  isMotorcyclesActive
                    ? 'bg-neutral-2 text-primary font-bold'
                    : 'text-ink hover:bg-neutral-2 hover:text-primary'
                }`}
              >
                <span>{dealershipCopy.nav.motorcycles}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileMotorcyclesExpanded ? 'rotate-180 text-primary' : 'text-neutral-5'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isMobileMotorcyclesExpanded && (
                <div className="pl-3 pr-1 py-1 space-y-1 bg-neutral-2/40 border-l-2 border-hairline ml-3">
                  <Link
                    href="/motor"
                    onClick={handleLinkClick}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      pathname.startsWith('/motor')
                        ? 'text-primary font-bold border-l-4 border-primary pl-2 bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.motorcycleCatalog}
                  </Link>
                  <Link
                    href="/harga"
                    onClick={handleLinkClick}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      pathname.startsWith('/harga')
                        ? 'text-primary font-bold border-l-4 border-primary pl-2 bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.priceList}
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Promo & Agenda Accordion */}
            <div>
              <button
                type="button"
                aria-expanded={isMobilePromoAgendaExpanded}
                onClick={() =>
                  setMobileExpandedOverride((prev) => ({
                    ...prev,
                    promoAgenda: !isMobilePromoAgendaExpanded,
                  }))
                }
                className={`w-full px-3 py-3 text-base font-medium rounded-none min-h-[44px] flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  isPromoAgendaActive
                    ? 'bg-neutral-2 text-primary font-bold'
                    : 'text-ink hover:bg-neutral-2 hover:text-primary'
                }`}
              >
                <span>{dealershipCopy.nav.promoAndAgenda}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobilePromoAgendaExpanded ? 'rotate-180 text-primary' : 'text-neutral-5'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isMobilePromoAgendaExpanded && (
                <div className="pl-3 pr-1 py-1 space-y-1 bg-neutral-2/40 border-l-2 border-hairline ml-3">
                  <Link
                    href="/promo"
                    onClick={handleLinkClick}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      pathname.startsWith('/promo')
                        ? 'text-primary font-bold border-l-4 border-primary pl-2 bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.promotions}
                  </Link>
                  <Link
                    href="/events"
                    onClick={handleLinkClick}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      pathname.startsWith('/events')
                        ? 'text-primary font-bold border-l-4 border-primary pl-2 bg-neutral-2'
                        : 'text-ink hover:text-primary hover:bg-neutral-2'
                    }`}
                  >
                    {dealershipCopy.nav.events}
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Tentang & Kontak */}
            <Link
              href="/hubungi"
              onClick={handleLinkClick}
              className={`block px-3 py-3 text-base font-medium rounded-none min-h-[44px] flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                isAboutContactActive
                  ? 'bg-neutral-2 text-primary font-bold border-l-4 border-primary pl-2'
                  : 'text-ink hover:bg-neutral-2 hover:text-primary'
              }`}
            >
              {dealershipCopy.nav.aboutContact}
            </Link>

            <div className="pt-4 border-t border-hairline mt-4">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={handleLinkClick}
                >
                  <Button variant="primary" fullWidth size="md">
                    {dealershipCopy.common.contactSales}
                  </Button>
                </a>
              ) : (
                <Link
                  href="/hubungi"
                  className="block w-full focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={handleLinkClick}
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
}
