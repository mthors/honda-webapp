import React from 'react';
import Link from 'next/link';
import type { SiteSettings, DealershipItem } from '@/types/settings';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { normalizeIndonesianPhone } from '@/lib/formatters';
import { dealershipCopy } from '@/content/copy/id';

interface ReferenceDealerTrustProps {
  settings?: SiteSettings | null;
  dealerships?: DealershipItem[];
}

export function ReferenceDealerTrust({
  settings,
  dealerships = [],
}: ReferenceDealerTrustProps) {
  const dealerName = settings?.dealerName || dealershipCopy.dealer.name;
  const rawWhatsApp = settings?.whatsappNumber || process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
  const cleanWhatsApp = rawWhatsApp ? normalizeIndonesianPhone(rawWhatsApp) : '';
  const hasValidWhatsApp = cleanWhatsApp.length >= 9;
  const whatsappUrl = hasValidWhatsApp
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        `Halo ${dealerName}, saya ingin berkonsultasi mengenai pembelian motor Honda.`
      )}`
    : '/hubungi';

  const operationalHours =
    (settings?.openingHours && typeof settings.openingHours === 'object'
      ? (settings.openingHours as Record<string, string>).consultation_hours
      : null) || dealershipCopy.dealer.operatingHours;

  const servedCities = Array.from(new Set(dealerships.map((d) => d.city).filter(Boolean)));

  return (
    <section
      aria-label="Layanan dan Komitmen Showroom"
      className="bg-canvas py-16 sm:py-20 lg:py-24 border-b border-hairline"
    >
      <Container>
        {/* Dealership Introduction Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-14">
          <div className="lg:col-span-7">
            <Badge variant="primary" size="sm" className="mb-3">
              Jaringan Resmi Honda
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink font-manrope">
              {dealerName || 'Honda Satrya Dealership Group'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-body leading-relaxed">
              Sebagai bagian dari jaringan Honda Satrya Dealership Group, kami berkomitmen memberikan
              pengalaman kepemilikan sepeda motor Honda yang nyaman, transparan, dan terpercaya bagi
              seluruh masyarakat Jawa Timur.
            </p>

            <div className="mt-6 space-y-2.5 text-xs sm:text-sm text-body">
              <div className="flex items-start gap-3">
                <span className="font-semibold text-ink min-w-[130px]">Jam Layanan:</span>
                <span className="text-muted">{operationalHours}</span>
              </div>
              {servedCities.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="font-semibold text-ink min-w-[130px]">Wilayah Jangkauan:</span>
                  <span className="text-muted">{servedCities.join(', ')} dan sekitarnya</span>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/hubungi">
                <Button variant="primary" size="md" className="font-semibold px-6 py-2.5">
                  Hubungi Showroom Kami
                </Button>
              </Link>
              {hasValidWhatsApp && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button variant="outline" size="md" className="font-semibold px-6 py-2.5">
                    Konsultasi via WhatsApp
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card variant="canvas" padding="lg" className="border border-hairline shadow-xs rounded-xl">
              <h3 className="text-base font-bold text-ink font-manrope mb-3">
                Jaminan Pelayanan Resmi
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-body">
                <div className="flex items-start gap-2.5">
                  <span className="text-status-success font-bold">✓</span>
                  <span>
                    <strong>Unit 100% Baru:</strong> Bergaransi resmi dari PT Astra Honda Motor.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-status-success font-bold">✓</span>
                  <span>
                    <strong>Harga OTR Terverifikasi:</strong> Informasi harga On The Road transparan
                    sesuai ketentuan dealer.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-status-success font-bold">✓</span>
                  <span>
                    <strong>Proses Cepat:</strong> Pendampingan pengurusan registrasi STNK & BPKB
                    resmi.
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-hairline">
                <Link href="/hubungi" className="text-xs font-bold text-primary hover:underline">
                  Lihat Lokasi Showroom & Formulir Kontak →
                </Link>
              </div>
            </Card>

            <p className="mt-4 text-[11px] text-muted leading-relaxed">
              {dealershipCopy.dealer.corporateDisclaimer}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
