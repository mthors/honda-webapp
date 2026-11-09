import React from 'react';
import Link from 'next/link';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import { Container } from '@/components/ui/Container';

interface ReferenceCategoryDiscoveryProps {
  categories: CatalogCategory[];
  models?: CatalogModelSummary[];
}

function CategoryIcon({ slug }: { slug: string }) {
  switch (slug) {
    case 'matic':
      // Scooter / Skutik with step-through floorboard and front cowl
      return (
        <svg
          className="w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="17.5" r="3" />
          <circle cx="18.5" cy="17.5" r="3" />
          <path d="M5.5 17.5h4.5l3.5-6.5h3l2 6.5" />
          <path d="M16.5 11l-1.5-6h2" />
          <path d="M7 13.5h3.5" />
        </svg>
      );
    case 'cub':
      // Bebek / Underbone with diagonal backbone frame and slim chassis
      return (
        <svg
          className="w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="17.5" r="3" />
          <circle cx="18.5" cy="17.5" r="3" />
          <path d="M5.5 17.5l4-7h4.5l4.5 7" />
          <path d="M7 11.5l3-2h4l1.5 2" />
          <path d="M17 12l-1.5-7h2.5" />
        </svg>
      );
    case 'sport':
      // Sportbike with aerodynamic full fairing, low clip-ons and high tail
      return (
        <svg
          className="w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="17.5" r="3" />
          <circle cx="18.5" cy="17.5" r="3" />
          <path d="M5.5 17.5l4.5-5.5 4.5 1 3.5-3.5 1.5 8" />
          <path d="M4 11l4-3 4.5 1.5 4-4.5" />
          <path d="M15.5 6l1.5-1.5" />
        </svg>
      );
    case 'ev':
      // Electric motorcycle with lightning energy bolt
      return (
        <svg
          className="w-7 h-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="17.5" r="3" />
          <circle cx="18.5" cy="17.5" r="3" />
          <path d="M5.5 17.5h3.5l3-5.5h4l2.5 5.5" />
          <path d="M15 12l-1-6h2" />
          <path d="M11.5 6l-2 3.5h2.5l-1.5 3.5" stroke="currentColor" strokeWidth={2} />
        </svg>
      );
    default:
      return (
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M6 18h4l2-6 5 2 1-4" />
          <path d="M12 12h5" />
        </svg>
      );
  }
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
            const modelCount = models.filter((m) => m.category.slug === cat.slug).length;

            return (
              <Link
                key={cat.id}
                href={`/motor?kategori=${encodeURIComponent(cat.slug)}`}
                className="group flex flex-col justify-between bg-white text-ink border border-hairline hover:border-primary/50 rounded-xl p-6 sm:p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Category Distinct Icon */}
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-primary/10 text-primary flex items-center justify-center mb-5 transition-colors">
                    <CategoryIcon slug={cat.slug} />
                  </div>

                  <h3 className="text-lg font-bold font-manrope text-ink group-hover:text-primary transition-colors mb-2">
                    {cat.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-body leading-relaxed mb-4 min-h-[40px]">
                    {cat.description || 'Pilihan sepeda motor Honda dengan performa andal.'}
                  </p>

                  <span className="text-xs font-semibold text-muted block mb-6">
                    {modelCount > 0 ? `${modelCount} Pilihan Model` : 'Lini Lengkap'}
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
