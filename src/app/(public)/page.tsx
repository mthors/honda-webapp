import React from 'react';
import type { Metadata } from 'next';
import { getPublishedModels, getActiveCategories } from '@/lib/catalog/queries';
import { getSiteSettings, getActiveDealerships } from '@/lib/settings/queries';
import { SplitHeroShowroom } from '@/components/public/home/SplitHeroShowroom';
import { ReferenceCategoryDiscovery } from '@/components/public/home/ReferenceCategoryDiscovery';
import { ReferencePromoBanner } from '@/components/public/home/ReferencePromoBanner';
import { ReferenceFeaturedListings } from '@/components/public/home/ReferenceFeaturedListings';
import { ReferenceDealerTrust } from '@/components/public/home/ReferenceDealerTrust';

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
  const [models, categories, settings, dealerships] = await Promise.all([
    getPublishedModels(),
    getActiveCategories(),
    getSiteSettings(),
    getActiveDealerships(),
  ]);

  return (
    <div className="flex flex-col w-full">
      {/* 1. Dramatic Split Hero with Warm Textured Showcase & Overlapping Floating Filter */}
      <SplitHeroShowroom
        categories={categories}
        models={models}
        heroImageStoragePath="vario-125-street-1794191564438-1.webp"
        heroModelName="Honda Vario 125 Street"
      />

      {/* 2. Popular Body Type: Category Discovery with Highlighted Red Accent Card */}
      <ReferenceCategoryDiscovery categories={categories} models={models} />

      {/* 3. Wide Dark Editorial Promotional Banner with Radiant Circle & Motorcycle Cutout */}
      <ReferencePromoBanner
        imageStoragePath="pcx-160-1793861131468-1.webp"
        promoTitle="Honda PCX 160 eSP+ Teknologi Terdepan"
      />

      {/* 4. Most Popular Listings: Featured Motorcycle Product Discovery */}
      <ReferenceFeaturedListings models={models} />

      {/* 5. Dealership Commitment, Service Guarantees & Network Contact */}
      <ReferenceDealerTrust settings={settings} dealerships={dealerships} />
    </div>
  );
}
