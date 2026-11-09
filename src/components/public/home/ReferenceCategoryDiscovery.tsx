import React from 'react';
import Link from 'next/link';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import { Container } from '@/components/ui/Container';

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

        {/* Category Cards: Matching the reference's distinct card row with one highlighted accent card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {categories.map((cat) => {
            const isHighlighted = cat.slug === 'matic';
            const modelCount = models.filter((m) => m.category.slug === cat.slug).length;

            if (isHighlighted) {
              // Highlighted Card (Honda Red Accent with White Text & Pill Button)
              return (
                <Link
                  key={cat.id}
                  href={`/motor?kategori=${encodeURIComponent(cat.slug)}`}
                  className="group relative flex flex-col justify-between bg-primary text-white rounded-xl p-6 sm:p-7 shadow-[0_12px_30px_rgba(230,27,51,0.3)] hover:shadow-[0_16px_36px_rgba(230,27,51,0.4)] hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div>
                    {/* Category Icon */}
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-5 text-white">
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
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold font-manrope text-white">{cat.name}</h3>
                      <span className="text-[11px] font-semibold bg-white/25 px-2.5 py-0.5 rounded-full">
                        Paling Favorit
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-4">
                      {cat.description ||
                        'Solusi mobilitas harian lincah, praktis, dan berteknologi canggih eSP+.'}
                    </p>

                    <span className="text-xs font-semibold text-white/80 block mb-6">
                      {modelCount > 0 ? `${modelCount} Pilihan Model` : 'Lini Lengkap Tersedia'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-white text-primary font-bold text-xs rounded-full group-hover:bg-neutral-100 transition-colors shadow-xs">
                      Eksplorasi {cat.name} →
                    </span>
                  </div>
                </Link>
              );
            }

            // Standard White Card (Clean border, red icon, subtle hover elevation)
            return (
              <Link
                key={cat.id}
                href={`/motor?kategori=${encodeURIComponent(cat.slug)}`}
                className="group flex flex-col justify-between bg-white text-ink border border-hairline hover:border-primary/50 rounded-xl p-6 sm:p-7 hover:shadow-[0_10px_25px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Category Icon */}
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 group-hover:bg-primary/10 text-primary flex items-center justify-center mb-5 transition-colors">
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
                  </div>

                  <h3 className="text-lg font-bold font-manrope text-ink group-hover:text-primary transition-colors mb-2">
                    {cat.name}
                  </h3>

                  <p className="text-xs text-body leading-relaxed mb-4">
                    {cat.description || 'Pilihan sepeda motor Honda dengan performa andal.'}
                  </p>

                  <span className="text-xs font-semibold text-muted block mb-6">
                    {modelCount > 0 ? `${modelCount} Model Tersedia` : 'Unit Resmi'}
                  </span>
                </div>

                <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Lihat Pilihan</span>
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
