import React from 'react';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { formatRupiah } from '@/lib/formatters';
import { HeroBannerCarousel } from '@/components/public/home/HeroBannerCarousel';
import { getActiveHeroBanners } from '@/lib/promotions/queries';

export default async function HomePage() {
  const banners = await getActiveHeroBanners();
  const samplePrice = 19500000;

  const categories = [
    {
      name: dealershipCopy.catalog.categories.matic,
      tag: 'Paling Populer',
      desc: 'Solusi mobilitas harian lincah, irit, dan berteknologi canggih eSP+.',
      href: '/motor',
    },
    {
      name: dealershipCopy.catalog.categories.cub,
      tag: 'Tangguh & Irit',
      desc: 'Pilihan legendaris untuk keandalan mesin tinggi dan efisiensi optimal.',
      href: '/motor',
    },
    {
      name: dealershipCopy.catalog.categories.sport,
      tag: 'Performa Tinggi',
      desc: 'Desain tajam agresif dengan handling presisi untuk sensasi berkendara sejati.',
      href: '/motor',
    },
    {
      name: dealershipCopy.catalog.categories.ev,
      tag: 'Inovasi Listrik',
      desc: 'Kendaraan listrik ramah lingkungan Honda dengan baterai swap efisien.',
      href: '/motor',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Banner Carousel or Fallback */}
      <HeroBannerCarousel banners={banners} />

      {/* Category Overview Section */}
      <section className="bg-neutral-2/40 py-16 sm:py-20 border-b border-hairline">
        <Container>
          <SectionHeading
            badge="Lini Produk"
            title={dealershipCopy.catalog.title}
            description={dealershipCopy.catalog.subtitle}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Card
                key={cat.name}
                variant="canvas"
                padding="lg"
                className="flex flex-col justify-between group hover:border-primary transition-colors"
              >
                <div>
                  <Badge variant="neutral" size="sm" className="mb-3">
                    {cat.tag}
                  </Badge>
                  <h3 className="text-lg font-bold text-ink font-manrope mb-2">{cat.name}</h3>
                  <p className="text-xs sm:text-sm text-body leading-relaxed">{cat.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-hairline">
                  <Link
                    href={cat.href}
                    className="text-xs font-bold text-primary flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
                  >
                    <span>{dealershipCopy.catalog.viewDetails}</span>
                    <span>→</span>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Design System Baseline Demonstration (M1 Standards) */}
      <section className="bg-canvas py-16 sm:py-20 border-b border-hairline">
        <Container>
          <SectionHeading
            badge="Standar Visual"
            title="Pondasi Desain & Status Rilis (M1)"
            description="Komponen UI modular, tipografi Manrope, kontras WCAG AA, dan geometri tajam yang selaras dengan panduan DESIGN.md."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Price Token Card */}
            <Card variant="canvas" padding="lg">
              <div className="text-xs uppercase font-semibold text-muted mb-2 font-manrope">
                Format Harga OTR Terverifikasi
              </div>
              <div className="text-3xl font-bold text-ink mb-1 font-manrope">
                {formatRupiah(samplePrice)}
              </div>
              <p className="text-xs text-muted mb-6">
                {dealershipCopy.catalog.startingFrom} OTR Sidoarjo
              </p>
              <div className="pt-4 border-t border-hairline flex items-center justify-between">
                <Badge variant="success" size="sm">
                  ✓ {dealershipCopy.status.verified}
                </Badge>
                <Link href="/harga" className="text-xs font-semibold text-primary hover:underline">
                  Lihat Daftar Harga →
                </Link>
              </div>
            </Card>

            {/* Semantic Feedback States Card */}
            <Card variant="neutral" padding="lg">
              <div className="text-xs uppercase font-semibold text-muted mb-3 font-manrope">
                Status Umpan Balik Semantik
              </div>
              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex items-center justify-between p-2.5 bg-green-50 text-status-success border border-green-200">
                  <span>Data Formulir Terkirim</span>
                  <span className="font-bold">✓ Sukses</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-amber-50 text-status-warning border border-amber-200">
                  <span>Menunggu Konfirmasi Sales</span>
                  <span className="font-bold">! Perhatian</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-red-50 text-status-error border border-red-200">
                  <span>Format Masukan Tidak Valid</span>
                  <span className="font-bold">✕ Galat</span>
                </div>
              </div>
            </Card>

            {/* Price Policy & Dealer Disclaimer */}
            <Card variant="canvas" padding="lg" className="flex flex-col justify-between">
              <div>
                <div className="text-xs uppercase font-semibold text-muted mb-2 font-manrope">
                  Transparansi & Kebijakan Dealer
                </div>
                <p className="text-xs text-body leading-relaxed">
                  {dealershipCopy.pricing.disclaimer}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-xs text-muted">
                <span>Cakupan: Sidoarjo</span>
                <Link href="/hubungi" className="text-primary font-semibold hover:underline">
                  {dealershipCopy.nav.aboutContact} →
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}
