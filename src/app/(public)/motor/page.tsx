import React, { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CategoryFilter } from '@/components/public/catalog/CategoryFilter';
import { MotorcycleCard } from '@/components/public/catalog/MotorcycleCard';
import { getActiveCategories, getPublishedModels } from '@/lib/catalog/queries';

export const metadata: Metadata = {
  title: 'Katalog Sepeda Motor Honda — Honda Satrya Dealer Group',
  description:
    'Temukan lini sepeda motor Honda resmi: Matic, Sport, Cub, dan EV dengan spesifikasi lengkap dan harga OTR lokal terverifikasi di Honda Satrya Dealer Group.',
  alternates: {
    canonical: '/motor',
  },
};

interface MotorCatalogPageProps {
  searchParams: Promise<{
    kategori?: string;
    q?: string;
    sort?: string;
  }>;
}

export default async function MotorCatalogPage({ searchParams }: MotorCatalogPageProps) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.kategori || 'all';
  const currentSearch = resolvedParams.q || '';
  const currentSort = resolvedParams.sort;

  const [categories, models] = await Promise.all([
    getActiveCategories(),
    getPublishedModels({
      categorySlug: currentCategory,
      search: currentSearch,
      sort: currentSort,
    }),
  ]);

  return (
    <div className="py-10 sm:py-16">
      <Container>
        {/* Header Section */}
        <div className="max-w-3xl mb-8 sm:mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            {dealershipCopy.dealer.officialBadge}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.catalog.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-body leading-relaxed">
            {dealershipCopy.catalog.subtitle}
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="mb-10 pb-6 border-b border-hairline">
          <Suspense fallback={<div className="h-20 bg-neutral-2/30 animate-pulse" />}>
            <CategoryFilter
              categories={categories}
              currentCategory={currentCategory}
              currentSearch={currentSearch}
            />
          </Suspense>
        </div>

        {/* Motorcycle Grid or Empty State */}
        {models.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-semibold text-muted">
                Menampilkan <span className="text-ink font-bold">{models.length}</span> model motor
                Honda
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {models.map((model) => (
                <MotorcycleCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        ) : (
          <div className="py-16 px-6 text-center bg-neutral-2/40 border border-hairline max-w-xl mx-auto my-8">
            <h3 className="text-lg font-bold text-ink font-manrope mb-2">
              {dealershipCopy.catalog.emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
              {dealershipCopy.catalog.emptyDescription}
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/motor">
                <Button variant="outline" size="sm">
                  {dealershipCopy.catalog.resetFilter}
                </Button>
              </Link>
              <Link href="/hubungi">
                <Button variant="primary" size="sm">
                  {dealershipCopy.common.contactSales}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Group Showcase Disclaimer Footer Band */}
        <div className="mt-16 p-5 bg-neutral-2/30 border border-hairline text-xs text-muted leading-relaxed">
          <p className="font-semibold text-ink mb-1">Informasi Showroom Digital:</p>
          <p>{dealershipCopy.dealer.corporateDisclaimer}</p>
        </div>
      </Container>
    </div>
  );
}
