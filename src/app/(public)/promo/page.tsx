import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PromotionCard } from '@/components/public/promotions/PromotionCard';
import { getActivePromotions } from '@/lib/promotions/queries';
import { normalizeIndonesianPhone } from '@/lib/formatters';

export const metadata: Metadata = {
  title: 'Promo Sepeda Motor Honda — Honda Satrya Dealer Group',
  description:
    'Program promo resmi, diskon spesial, cashback, dan penawaran menarik pembelian sepeda motor Honda di Honda Satrya Dealer Group.',
  alternates: {
    canonical: '/promo',
  },
};

export default async function PromoPage() {
  const promotions = await getActivePromotions();
  const waNumber = normalizeIndonesianPhone(
    process.env.NEXT_PUBLIC_DEALER_WHATSAPP || '081234567890'
  );

  return (
    <div className="py-10 sm:py-16">
      <Container>
        {/* Header Section */}
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            {dealershipCopy.dealer.officialBadge}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.promotions.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-body leading-relaxed">
            {dealershipCopy.promotions.subtitle}
          </p>
        </div>

        {/* Promotions Grid or Empty State */}
        {promotions.length > 0 ? (
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted">
                Menampilkan <span className="text-ink font-bold">{promotions.length}</span> program
                promo aktif
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promotions.map((promo) => (
                <PromotionCard key={promo.id} promotion={promo} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 px-6 text-center bg-neutral-2/40 border border-hairline max-w-xl mx-auto my-8">
            <Badge variant="neutral" size="sm" className="mb-3">
              Program Showroom
            </Badge>
            <h3 className="text-lg font-bold text-ink font-manrope mb-2">
              {dealershipCopy.promotions.emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
              {dealershipCopy.promotions.emptyDescription}
            </p>
            <div className="flex justify-center flex-wrap gap-3">
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                  'Halo Honda Satrya Dealer Group, saya ingin informasi program promo atau diskon showroom yang sedang berjalan bulan ini.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="sm">
                  {dealershipCopy.promotions.claimPromo}
                </Button>
              </a>
              <Link href="/motor">
                <Button variant="outline" size="sm">
                  Lihat Katalog Motor
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
