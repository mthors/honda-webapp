import React from 'react';
import { Metadata } from 'next';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { PriceListTable } from '@/components/public/pricing/PriceListTable';
import { getPublishedPriceList } from '@/lib/pricing/queries';

export const metadata: Metadata = {
  title: 'Daftar Harga OTR Sepeda Motor Honda — Honda Satrya Dealer Group',
  description:
    'Informasi daftar harga On The Road (OTR) resmi sepeda motor Honda Matic, Sport, Cub, dan EV di Honda Satrya Dealer Group.',
  alternates: {
    canonical: '/harga',
  },
};

interface HargaPageProps {
  searchParams?: Promise<{
    kategori?: string;
    kota?: string;
    q?: string;
  }>;
}

export default async function HargaPage({ searchParams }: HargaPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const currentCategory = resolved.kategori || 'all';
  const currentCity = resolved.kota || 'Sidoarjo';
  const currentSearch = resolved.q || '';

  const groups = await getPublishedPriceList({
    categorySlug: currentCategory,
    city: currentCity,
    search: currentSearch,
  });

  return (
    <div className="py-10 sm:py-16">
      <Container>
        {/* Header Section */}
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            {dealershipCopy.dealer.officialBadge}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.pricing.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-body leading-relaxed">
            {dealershipCopy.pricing.subtitle}
          </p>
        </div>

        {/* Grouped Category Tables & Disclaimers */}
        <PriceListTable
          groups={groups}
          city={currentCity}
          dealerWhatsApp={process.env.NEXT_PUBLIC_DEALER_WHATSAPP || '081234567890'}
        />
      </Container>
    </div>
  );
}
