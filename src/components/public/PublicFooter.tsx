import React from 'react';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const publicNavLinks = [
    { href: '/', label: dealershipCopy.nav.home },
    { href: '/motor', label: dealershipCopy.nav.motorcycles },
    { href: '/harga', label: dealershipCopy.nav.priceList },
    { href: '/promo', label: dealershipCopy.nav.promotions },
    { href: '/hubungi', label: dealershipCopy.nav.aboutContact },
  ];

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
                  HONDA <span className="text-primary">MEGA PERSADA MANDIRI</span>
                </span>
                <span className="text-xs text-muted mt-1">{dealershipCopy.dealer.tagline}</span>
              </div>

              <p className="text-xs text-muted leading-relaxed max-w-md">
                {dealershipCopy.dealer.corporateDisclaimer}
              </p>

              <div className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-neutral-3 text-on-primary rounded-none border border-neutral-2/20">
                <span>{dealershipCopy.dealer.officialBadge}</span>
              </div>
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
              <p className="text-xs text-on-primary/80 leading-relaxed">
                {dealershipCopy.dealer.addressPlaceholder}
              </p>

              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted font-manrope">
                  {dealershipCopy.contact.operatingHoursTitle}
                </h4>
                <p className="text-xs text-on-primary/80 mt-1 leading-relaxed">
                  {dealershipCopy.dealer.operatingHours}
                </p>
              </div>

              <div className="pt-2 text-xs text-muted">
                <span>Wilayah Penjualan: Sidoarjo & Sekitarnya</span>
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
              © {currentYear} {dealershipCopy.dealer.name}. {dealershipCopy.common.copyrightNotice}
            </p>
            <p className="text-[11px] text-muted">Platform Digital Showroom Honda V1</p>
          </div>
        </Container>
      </div>
    </footer>
  );
};
