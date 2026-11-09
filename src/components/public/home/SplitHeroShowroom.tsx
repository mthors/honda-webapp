import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FloatingHeroFilter } from '@/components/public/home/FloatingHeroFilter';
import { getStorageImageUrl } from '@/lib/catalog/image';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';

interface SplitHeroShowroomProps {
  categories: CatalogCategory[];
  models?: CatalogModelSummary[];
  heroImageStoragePath?: string;
  heroModelName?: string;
}

export function SplitHeroShowroom({
  categories,
  models = [],
  heroImageStoragePath = 'vario-125-street-1794191564438-1.webp',
  heroModelName = 'Honda Vario 125 Street',
}: SplitHeroShowroomProps) {
  const imageUrl = getStorageImageUrl(heroImageStoragePath);

  return (
    <section aria-label="Hero Showroom Honda" className="relative w-full overflow-hidden bg-canvas">
      {/* 1. Dramatic Split Composition Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px] sm:min-h-[580px] lg:min-h-[620px]">
        {/* Left Side: Dark Automotive Atelier */}
        <div className="lg:col-span-6 bg-[#181818] text-white flex flex-col justify-center px-6 sm:px-10 md:px-14 lg:px-16 py-14 sm:py-16 lg:py-20 relative overflow-hidden">
          {/* Subtle Decorative Dot Matrix */}
          <div
            className="absolute bottom-6 left-6 grid grid-cols-5 gap-2 opacity-25 pointer-events-none"
            aria-hidden="true"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>

          {/* Left Vertical Brand Bar */}
          <div
            className="hidden xl:flex absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] tracking-widest text-neutral-500 uppercase font-semibold select-none"
            aria-hidden="true"
          >
            Showroom Resmi • Honda Satrya Group
          </div>

          <div className="max-w-xl relative z-10">
            {/* Dealer Official Badge */}
            <div className="animate-hero-fade mb-4 sm:mb-5">
              <Badge variant="primary" size="md" className="font-semibold tracking-wide">
                Dealer Resmi Honda
              </Badge>
            </div>

            {/* Split Headline with Honda Red Accent */}
            <h1 className="animate-hero-up text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-white font-manrope leading-[1.15]">
              Selamat Datang di <span className="text-primary">Honda</span>
              <br />
              <span className="text-white">Satrya Dealership Group</span>
            </h1>

            {/* Supporting Copy */}
            <p className="animate-hero-up-delay mt-4 sm:mt-5 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg">
              Digital showroom resmi Honda Satrya Dealer Group. Temukan lini motor Honda terbaik
              dengan spesifikasi terverifikasi dan harga OTR lokal terpercaya.
            </p>

            {/* CTAs */}
            <div className="animate-hero-up-delay mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4 items-center">
              <Link href="/motor">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-7 py-3.5 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Lihat Semua Motor
                </Button>
              </Link>
              <Link href="/hubungi">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-7 py-3.5 font-semibold border-white/30 text-white hover:bg-white hover:text-ink transition-colors"
                >
                  Konsultasi Sales
                </Button>
              </Link>
            </div>

            {/* Micro Trust Stats */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                <span>Unit Baru Bergaransi AHM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                <span>Harga OTR Resmi Terverifikasi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Warm Textured Showcase */}
        <div className="lg:col-span-6 bg-[#F7F4EE] flex flex-col justify-center items-center px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
          {/* Organic Curved Graphic Stroke (reproducing the reference design) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
            viewBox="0 0 600 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M-50,220 C150,120 300,420 550,260 C650,200 680,350 750,450"
              stroke="#E2D7C8"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Motorcycle Image Frame with Soft Shadow */}
          <div className="relative w-full max-w-lg lg:max-w-xl aspect-[4/3] flex items-center justify-center z-10">
            {/* Ground Contact Shadow */}
            <div
              className="absolute bottom-4 sm:bottom-6 w-3/4 h-8 bg-black/15 blur-xl rounded-full"
              aria-hidden="true"
            />

            {/* High-Resolution Cutout Motorcycle */}
            <div className="relative w-full h-full animate-hero-float">
              <Image
                src={imageUrl}
                alt={`Sepeda motor unggulan: ${heroModelName}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                className="object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>

          {/* Bottom Reference Tag Line: "01 ──── Model Name" */}
          <div className="mt-4 sm:mt-6 z-10 flex items-center gap-3 text-xs tracking-wider text-muted font-manrope">
            <span className="font-bold text-ink text-sm">01</span>
            <span className="w-16 h-px bg-hairline" />
            <span className="font-semibold text-ink">{heroModelName}</span>
          </div>
        </div>
      </div>

      {/* 2. Floating Overlapping Search Filter Bar */}
      <div className="-mt-7 sm:-mt-9 lg:-mt-10 pb-8 sm:pb-12">
        <FloatingHeroFilter categories={categories} models={models} />
      </div>
    </section>
  );
}
