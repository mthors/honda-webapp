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
  // Show up to 6 published models for the showroom showcase
  const displayedModels = models.slice(0, 6);

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
              Daftar sepeda motor Honda yang paling banyak diminati dengan jaminan keaslian unit,
              performa unggul, dan nilai jual kembali yang stabil.
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

        {/* Motorcycle Cards Grid */}
        {displayedModels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedModels.map((model) => (
              <div
                key={model.id}
                className="transform transition-transform duration-200 hover:-translate-y-1"
              >
                <MotorcycleCard model={model} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 px-6 text-center bg-white border border-hairline max-w-lg mx-auto rounded-xl">
            <h3 className="text-base font-bold text-ink font-manrope mb-2">
              Unit Sedang Disiapkan
            </h3>
            <p className="text-xs text-body mb-4">
              Katalog model motor unggulan sedang diperbarui oleh tim showroom.
            </p>
            <Link href="/motor">
              <Button variant="outline" size="sm">
                Lihat Semua Motor
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
