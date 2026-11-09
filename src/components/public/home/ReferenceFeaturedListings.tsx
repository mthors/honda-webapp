import React from 'react';
import Link from 'next/link';
import type { CatalogModelSummary } from '@/types/catalog';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MotorcycleCard } from '@/components/public/catalog/MotorcycleCard';

interface ReferenceFeaturedListingsProps {
  models: CatalogModelSummary[];
}

export function ReferenceFeaturedListings({ models }: ReferenceFeaturedListingsProps) {
  // Strictly filter only models that have isFeatured === true
  const featuredModels = models.filter((m) => m.isFeatured).slice(0, 6);

  // If no motorcycles are marked Unggulan, hide the section gracefully
  if (featuredModels.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Model Motor Terpopuler"
      className="bg-neutral-50/60 py-16 sm:py-20 lg:py-24 border-b border-hairline"
    >
      <Container>
        {/* Section Header: Matching the reference's "Most Popular Listings" */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary font-manrope">
              Pilihan Favorit Showroom
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink font-manrope">
              Model Motor Terpopuler
            </h2>
            <p className="mt-2 text-sm sm:text-base text-body leading-relaxed max-w-xl">
              Daftar sepeda motor Honda unggulan yang paling banyak diminati dengan jaminan keaslian
              unit, performa prima, dan layanan purna jual resmi terpercaya.
            </p>
          </div>

          <div className="shrink-0">
            <Link href="/motor">
              <Button
                variant="outline"
                size="md"
                className="font-semibold hover:border-ink transition-colors"
              >
                Lihat Semua Motor →
              </Button>
            </Link>
          </div>
        </div>

        {/* Motorcycle Cards Grid (Only Unggulan Models) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredModels.map((model) => (
            <div
              key={model.id}
              className="transform transition-transform duration-200 hover:-translate-y-1"
            >
              <MotorcycleCard model={model} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
