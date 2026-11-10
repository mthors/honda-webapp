import React from 'react';
import type { Metadata } from 'next';
import {
  getPublishedModels,
  getFeaturedModels,
  getActiveCategories,
} from '@/lib/catalog/queries';
import { getActiveHeroBanners } from '@/lib/promotions/queries';
import { getStorageImageSizes } from '@/lib/catalog/image-quality.server';
import { SplitHeroShowroom } from '@/components/public/home/SplitHeroShowroom';
import { ReferenceCategoryDiscovery } from '@/components/public/home/ReferenceCategoryDiscovery';
import { ReferencePromoBanner } from '@/components/public/home/ReferencePromoBanner';
import { ReferenceFeaturedListings } from '@/components/public/home/ReferenceFeaturedListings';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Digital Showroom Honda Satrya Dealership Group',
  description:
    'Temukan sepeda motor Honda resmi impian Anda dengan harga OTR lokal, spesifikasi terverifikasi, dan konsultasi pembelian terpercaya di Honda Satrya Dealership Group.',
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const [allModels, featuredModels, categories, heroBanners, imageSizes] =
    await Promise.all([
      getPublishedModels(),
      getFeaturedModels(),
      getActiveCategories(),
      getActiveHeroBanners(),
      getStorageImageSizes(),
    ]);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Dramatic Split Hero with Multiple Carousel Slides & Overlapping Floating Filter */}
      <SplitHeroShowroom
        categories={categories}
        models={allModels}
        imageSizes={imageSizes}
      />

      {/* 2. Popular Body Type: Category Discovery with Consistent Cards */}
      <ReferenceCategoryDiscovery categories={categories} models={allModels} />

      {/* 3. Wide Dark Editorial Promotional Banner Driven by CMS Hero Banners */}
      {heroBanners.length > 0 && <ReferencePromoBanner banners={heroBanners} />}

      {/* 4. Most Popular Listings: Featured Motorcycle Product Discovery (Only Unggulan Models) */}
      <ReferenceFeaturedListings models={featuredModels} />
    </div>
  );
}
