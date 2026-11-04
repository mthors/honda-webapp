import React from 'react';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import type { SiteSettings } from '@/types/settings';

export interface PublicFooterProps {
  settings?: SiteSettings | null;
}

export function PublicFooter({ settings }: PublicFooterProps) {
  const currentYear = new Date().getFullYear();
  const dealerName = settings?.dealerName?.trim() || dealershipCopy.dealer.name;

  // Derive brand display parts
  let brandPrefix = 'HONDA';
  let brandSuffix = 'SATRYA DEALER GROUP';
  if (dealerName.toLowerCase().startsWith('honda ')) {
    brandPrefix = 'HONDA';
    brandSuffix = dealerName.slice(6).trim().toUpperCase();
  } else if (dealerName.toUpperCase() !== 'HONDA') {
    brandPrefix = dealerName.toUpperCase();
    brandSuffix = '';
  }

  const publicNavLinks = [
    { href: '/', label: dealershipCopy.nav.home },
    { href: '/motor', label: dealershipCopy.nav.motorcycles },
    { href: '/harga', label: dealershipCopy.nav.priceList },
    { href: '/promo', label: dealershipCopy.nav.promotions },
    { href: '/hubungi', label: dealershipCopy.nav.aboutContact },
  ];

  // Resolve configured social links
  const instagram = settings?.socialLinks?.instagram?.trim();
  const facebook = settings?.socialLinks?.facebook?.trim();
  const hasSocialLinks = Boolean(instagram || facebook);

  // Resolve consultation/operating hours
  const consultationHours =
    settings?.openingHours?.consultation_hours?.trim() || dealershipCopy.dealer.operatingHours;

  return (
    <footer className="bg-surface-alt text-on-primary border-t border-neutral-3">
      {/* Upper Content Section */}
      <div className="py-12 sm:py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Dealership Identity & Corporate Disclaimer */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-on-primary font-manrope">
                  {brandPrefix} {brandSuffix && <span className="text-primary">{brandSuffix}</span>}
                </span>
                <span className="text-xs text-muted mt-1">{dealershipCopy.dealer.tagline}</span>
              </div>

              <p className="text-xs text-muted leading-relaxed max-w-md">
                {dealershipCopy.dealer.corporateDisclaimer}
              </p>

              <div className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-neutral-3 text-on-primary rounded-none border border-neutral-2/20">
                <span>{dealershipCopy.dealer.officialBadge}</span>
              </div>

              {/* Social Media Links (Only rendered when configured) */}
              {hasSocialLinks && (
                <div className="pt-2 space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-manrope">
                    Media Sosial Resmi
                  </h4>
                  <div className="flex items-center space-x-4 text-xs">
                    {instagram && (
                      <a
                        href={instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-on-primary/80 hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        aria-label="Instagram Resmi Dealer"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                        <span>Instagram</span>
                      </a>
                    )}
                    {facebook && (
                      <a
                        href={facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-on-primary/80 hover:text-primary transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        aria-label="Facebook Resmi Dealer"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                        </svg>
                        <span>Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted font-manrope">
                {dealershipCopy.nav.quickLinks}
              </h3>
              <ul className="space-y-2 text-sm">
                {publicNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-on-primary/80 hover:text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Showroom & Operational Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted font-manrope">
                {dealershipCopy.contact.showroomLocation}
              </h3>
              {settings?.address && settings.address.trim() !== '' ? (
                <p className="text-xs text-on-primary/80 leading-relaxed">{settings.address}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-on-primary/80 leading-relaxed">
                    {dealershipCopy.contact.infoUnavailable}
                  </p>
                  <Link
                    href="/hubungi"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium transition-colors"
                  >
                    Lihat Lokasi Showroom &rarr;
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-manrope">
                  {dealershipCopy.contact.operatingHoursTitle}
                </h4>
                <p className="text-xs text-on-primary/80 mt-1 leading-relaxed">
                  {consultationHours}
                </p>
              </div>

              {/* Public Email (Only rendered when configured) */}
              {settings?.publicEmail && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-manrope">
                    Layanan Email
                  </h4>
                  <a
                    href={`mailto:${settings.publicEmail}`}
                    className="text-xs text-on-primary/80 hover:text-primary transition-colors block mt-1 underline font-mono"
                  >
                    {settings.publicEmail}
                  </a>
                </div>
              )}

              <div className="pt-2 text-xs text-muted">
                <span>Wilayah Jaringan Dealer: Sidoarjo, Surabaya, Gresik & Sekitarnya</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Bottom Bar: Copyright & Compliance */}
      <div className="border-t border-neutral-3 py-6 bg-neutral-1/40">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted space-y-2 sm:space-y-0 text-center sm:text-left">
            <p>
              © {currentYear} {dealerName}. {dealershipCopy.common.copyrightNotice}
            </p>
            <p className="text-[11px] text-muted">Platform Digital Showroom Honda V1</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
