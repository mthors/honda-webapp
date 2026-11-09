'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FloatingHeroFilter } from '@/components/public/home/FloatingHeroFilter';
import { getStorageImageUrl } from '@/lib/catalog/image';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import type { HeroBanner } from '@/types/promotions';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imagePath: string;
  modelName: string;
  ctaLabel: string;
  ctaUrl: string;
}

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-vario-125',
    title: 'Selamat Datang di Honda Satrya Dealership Group',
    subtitle:
      'Digital showroom resmi Honda Satrya Dealership Group. Temukan lini motor Honda terbaik dengan spesifikasi terverifikasi dan harga OTR lokal terpercaya.',
    imagePath: 'vario-125-street-1794191564438-1.webp',
    modelName: 'Honda Vario 125 Street',
    ctaLabel: 'Lihat Semua Motor',
    ctaUrl: '/motor',
  },
  {
    id: 'slide-pcx-160',
    title: 'Kenyamanan Berkendara Honda PCX 160 eSP+',
    subtitle:
      'Skutik mewah berteknologi canggih 160cc eSP+ dengan posisi berkendara ergonomis dan fitur HSTC untuk perjalanan harian maupun jarak jauh.',
    imagePath: 'pcx-160-1793861131468-1.webp',
    modelName: 'Honda PCX 160',
    ctaLabel: 'Jelajahi PCX 160',
    ctaUrl: '/motor',
  },
];

interface SplitHeroShowroomProps {
  categories: CatalogCategory[];
  models?: CatalogModelSummary[];
  banners?: HeroBanner[];
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener?.('change', callback);
  return () => mediaQuery.removeEventListener?.('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot() {
  return false;
}

export function SplitHeroShowroom({
  categories,
  models = [],
  banners = [],
}: SplitHeroShowroomProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  // Prepare slides from CMS Hero Banners or fallback to curated showcase slides
  const slides: HeroSlide[] =
    banners && banners.length > 0
      ? banners.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle:
            b.subtitle ||
            'Digital showroom resmi Honda Satrya Dealership Group. Temukan lini motor Honda terbaik dengan spesifikasi terverifikasi.',
          imagePath: b.desktopImagePath,
          modelName: b.altText || b.title,
          ctaLabel: b.ctaLabel || 'Lihat Semua Motor',
          ctaUrl: b.ctaUrl || '/motor',
        }))
      : DEFAULT_HERO_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = slides.length;
  const currentSlide = slides[currentIndex] || slides[0];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleSelectSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Automatic slide rotation (5 seconds), paused on hover/focus or reduced motion
  useEffect(() => {
    if (prefersReducedMotion || totalSlides <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [prefersReducedMotion, totalSlides, isPaused, handleNext]);

  const currentImageUrl = getStorageImageUrl(currentSlide.imagePath);

  return (
    <section
      aria-label="Hero Showroom Honda"
      className="relative w-full overflow-hidden bg-canvas"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
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

          <div className="max-w-xl relative z-10">
            {/* Dealer Official Badge */}
            <div className="animate-hero-fade mb-4 sm:mb-5">
              <Badge variant="primary" size="md" className="font-semibold tracking-wide">
                Dealer Resmi Honda
              </Badge>
            </div>

            {/* Split Headline with Honda Red Accent */}
            <div
              key={`headline-${currentSlide.id}`}
              className="transition-all duration-500 ease-out will-change-[opacity,transform]"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-white font-manrope leading-[1.15]">
                {currentSlide.id === 'slide-vario-125' ? (
                  <>
                    Selamat Datang di <span className="text-primary">Honda</span>
                    <br />
                    <span className="text-white">Satrya Dealership Group</span>
                  </>
                ) : (
                  currentSlide.title
                )}
              </h1>

              {/* Supporting Copy */}
              <p className="mt-4 sm:mt-5 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg min-h-[48px]">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4 items-center">
              <Link href={currentSlide.ctaUrl || '/motor'}>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-7 py-3.5 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {currentSlide.ctaLabel || 'Lihat Semua Motor'}
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

            {/* Micro Trust Stats & Slide Indicators */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-success inline-block" />
                  <span>Unit Baru Bergaransi AHM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  <span>Harga OTR Terverifikasi</span>
                </div>
              </div>

              {/* Carousel Dot Indicators (when multiple slides) */}
              {totalSlides > 1 && (
                <div
                  className="flex items-center gap-2"
                  role="tablist"
                  aria-label="Pilihan slide motor"
                >
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={idx === currentIndex}
                      aria-label={`Pindah ke slide ${idx + 1}: ${s.modelName}`}
                      onClick={() => handleSelectSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary ${
                        idx === currentIndex
                          ? 'w-6 bg-primary'
                          : 'w-2 bg-neutral-600 hover:bg-neutral-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Warm Textured Showcase */}
        <div className="lg:col-span-6 bg-[#F7F4EE] flex flex-col justify-center items-center px-6 sm:px-10 lg:px-12 py-12 sm:py-16 lg:py-20 relative overflow-hidden">
          {/* Organic Curved Graphic Stroke */}
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

          {/* Motorcycle Image Frame with GPU-Accelerated Slide Transition */}
          <div className="relative w-full max-w-lg lg:max-w-xl aspect-[4/3] flex items-center justify-center z-10">
            {/* Ground Contact Shadow */}
            <div
              className="absolute bottom-4 sm:bottom-6 w-3/4 h-8 bg-black/15 blur-xl rounded-full"
              aria-hidden="true"
            />

            {/* High-Resolution Cutout Motorcycle with smooth cross-fade */}
            <div
              key={`slide-img-${currentSlide.id}`}
              className="relative w-full h-full transition-all duration-500 ease-out will-change-[opacity,transform]"
              style={{
                transform: 'translate3d(0, 0, 0)',
              }}
            >
              <Image
                src={currentImageUrl}
                alt={`Sepeda motor unggulan: ${currentSlide.modelName}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                className="object-contain drop-shadow-xl"
                priority
              />
            </div>
          </div>

          {/* Bottom Reference Tag Line and Navigation Controls */}
          <div className="mt-4 sm:mt-6 z-10 w-full max-w-lg flex items-center justify-between text-xs tracking-wider text-muted font-manrope">
            <div className="flex items-center gap-3">
              <span className="font-bold text-ink text-sm">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <span className="w-12 sm:w-16 h-px bg-hairline" />
              <span className="font-semibold text-ink truncate max-w-[200px] sm:max-w-xs">
                {currentSlide.modelName}
              </span>
            </div>

            {/* Slide Navigation Buttons (when multiple slides) */}
            {totalSlides > 1 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Slide sebelumnya"
                  className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Slide berikutnya"
                  className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
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
