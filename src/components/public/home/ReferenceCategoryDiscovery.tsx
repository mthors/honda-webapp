import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import { Container } from '@/components/ui/Container';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface ReferenceCategoryDiscoveryProps {
  categories: CatalogCategory[];
  models?: CatalogModelSummary[];
}

export function ReferenceCategoryDiscovery({
  categories,
  models = [],
}: ReferenceCategoryDiscoveryProps) {
  return (
    <section
      aria-label="Kategori Sepeda Motor Honda"
      className="bg-canvas py-16 sm:py-20 lg:py-24 border-b border-hairline"
    >
      <Container>
        {/* Section Header: Centered layout matching reference "Popular Body Type" */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary font-manrope">
            Lini Produk Showroom
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink font-manrope">
            Kategori Sepeda Motor
          </h2>
          <p className="mt-3 text-sm sm:text-base text-body leading-relaxed">
            Pilih lini sepeda motor Honda yang dirancang sesuai dengan rutinitas, kenyamanan, dan
            gaya berkendara Anda.
          </p>
        </div>

        {/* Category Cards: Visually consistent, balanced dimensions, equal visual hierarchy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {categories.map((cat) => {
            const categoryModels = models.filter((m) => m.category.slug === cat.slug);
            const modelCount = categoryModels.length;

            // Select valid representative motorcycle from this category with an image
            const representativeModel =
              categoryModels.find((m) => m.isFeatured && m.primaryImage?.storagePath) ||
              categoryModels.find((m) => m.primaryImage?.storagePath);

            const thumbnailStoragePath = representativeModel?.primaryImage?.storagePath;
            const thumbnailUrl = thumbnailStoragePath
              ? getStorageImageUrl(thumbnailStoragePath)
              : null;

            return (
              <Link
                key={cat.id}
                href={`/motor?kategori=${encodeURIComponent(cat.slug)}`}
                className="group flex flex-col justify-between bg-white text-ink border border-hairline hover:border-primary/50 rounded-xl p-6 sm:p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Category Representative Motorcycle Thumbnail */}
                  <div className="relative w-full h-32 sm:h-36 mb-5 flex items-center justify-center bg-[#F7F4EE]/60 rounded-lg overflow-hidden border border-hairline/60">
                    {thumbnailUrl ? (
                      <div className="relative w-full h-full p-2 transform group-hover:scale-105 transition-transform duration-300">
                        <Image
                          src={thumbnailUrl}
                          alt={`Sepeda motor kategori ${cat.name}: ${representativeModel?.name || ''}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-4 text-muted">
                        <span className="text-xs font-semibold text-neutral-400">
                          Unit Segera Hadir
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold font-manrope text-ink group-hover:text-primary transition-colors mb-2">
                    {cat.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-body leading-relaxed mb-4 min-h-[40px]">
                    {cat.description || 'Pilihan sepeda motor Honda dengan performa andal.'}
                  </p>

                  <span className="text-xs font-semibold text-muted block mb-6">
                    {modelCount > 0 ? `${modelCount} Pilihan Model` : 'Unit Segera Hadir'}
                  </span>
                </div>

                <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Eksplorasi {cat.name}</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
