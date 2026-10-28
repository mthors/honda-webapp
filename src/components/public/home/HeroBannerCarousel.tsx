'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { HeroBanner } from '@/types/promotions';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface HeroBannerCarouselProps {
  banners: HeroBanner[];
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  mediaQuery.addEventListener?.('change', callback);
  return () => mediaQuery.removeEventListener?.('change', callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, getServerSnapshot);
}

/**
 * Fallback static hero component preserving the approved M1/M3 design
 * when no active banners are scheduled or available.
 */
function StaticBrandHero() {
  return (
    <section className="bg-canvas border-b border-hairline py-12 sm:py-20 lg:py-24">
      <Container>
        <div className="max-w-3xl">
          <Badge variant="primary" size="md" className="mb-4">
            {dealershipCopy.dealer.officialBadge}
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-bold text-ink tracking-tight leading-tight font-manrope">
            {dealershipCopy.hero.headline}
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-body leading-relaxed max-w-2xl">
            {dealershipCopy.hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            <Link href="/motor">
              <Button variant="primary" size="lg">
                {dealershipCopy.hero.primaryCta}
              </Button>
            </Link>
            <Link href="/hubungi">
              <Button variant="outline" size="lg">
                {dealershipCopy.hero.secondaryCta}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ActiveBannerCarousel({ banners }: { banners: HeroBanner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = usePrefersReducedMotion();
  const totalBanners = banners.length;
  const isPlaying = !prefersReducedMotion && !isUserPaused && totalBanners > 1;

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  // Handle keyboard arrow navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  // Autoplay timer with pause on hover/focus
  useEffect(() => {
    if (!isPlaying || isHovered) return;

    const interval = setInterval(() => {
      goToNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, goToNext]);

  const activeBanner = banners[currentIndex];
  const desktopImg = getStorageImageUrl(activeBanner.desktopImagePath);
  const mobileImg = getStorageImageUrl(
    activeBanner.mobileImagePath || activeBanner.desktopImagePath
  );

  return (
    <section
      ref={carouselRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Spanduk Promosi Showroom Honda"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
      className="relative bg-canvas border-b border-hairline overflow-hidden focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {/* Visual Slide Display */}
      <div className="relative w-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] flex items-center bg-neutral-2/40">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          {/* Mobile Image */}
          <div className="block sm:hidden relative w-full h-full">
            <Image
              src={mobileImg}
              alt={activeBanner.altText || activeBanner.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          {/* Desktop Image */}
          <div className="hidden sm:block relative w-full h-full">
            <Image
              src={desktopImg}
              alt={activeBanner.altText || activeBanner.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          {/* High-contrast gradient overlay to ensure text contrast (WCAG AA) */}
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/85 to-transparent sm:w-3/4" />
        </div>

        {/* Slide Content */}
        <div className="relative z-10 py-12 sm:py-20 lg:py-24 w-full">
          <Container>
            <div className="max-w-2xl bg-canvas/60 backdrop-blur-xs p-6 sm:p-8 border-l-4 border-l-primary border-hairline">
              <Badge variant="primary" size="sm" className="mb-3">
                {dealershipCopy.dealer.officialBadge}
              </Badge>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight font-manrope leading-tight">
                {activeBanner.title}
              </h2>

              {activeBanner.subtitle && (
                <p className="mt-3 text-sm sm:text-base lg:text-lg text-body leading-relaxed max-w-xl">
                  {activeBanner.subtitle}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3 items-center">
                {activeBanner.ctaUrl && activeBanner.ctaLabel ? (
                  <Link href={activeBanner.ctaUrl}>
                    <Button variant="primary" size="md">
                      {activeBanner.ctaLabel} →
                    </Button>
                  </Link>
                ) : (
                  <Link href="/motor">
                    <Button variant="primary" size="md">
                      Lihat Katalog Motor →
                    </Button>
                  </Link>
                )}
                <Link href="/hubungi">
                  <Button variant="outline" size="md">
                    Hubungi Sales
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Navigation Controls (Rendered only when multiple banners exist) */}
      {totalBanners > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-canvas/90 backdrop-blur-xs px-3 py-1.5 border border-hairline shadow-xs">
          {/* Prev Button */}
          <button
            type="button"
            onClick={goToPrev}
            aria-label={dealershipCopy.banners.previous}
            className="p-1.5 text-ink hover:text-primary transition-colors focus:outline-none"
          >
            ←
          </button>

          {/* Slide Indicator Dots */}
          <div
            className="flex items-center gap-1.5 px-1"
            role="tablist"
            aria-label="Navigasi Spanduk"
          >
            {banners.map((b, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={b.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`${dealershipCopy.banners.slideIndicator} ${idx + 1}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    isSelected ? 'w-5 bg-primary' : 'bg-neutral-2 hover:bg-hairline'
                  }`}
                />
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={goToNext}
            aria-label={dealershipCopy.banners.next}
            className="p-1.5 text-ink hover:text-primary transition-colors focus:outline-none"
          >
            →
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={() => setIsUserPaused((prev) => !prev)}
            aria-label={
              isPlaying
                ? dealershipCopy.banners.pauseAutoplay
                : dealershipCopy.banners.resumeAutoplay
            }
            className="p-1 text-[11px] font-mono text-muted hover:text-ink transition-colors ml-1 border-l border-hairline pl-2"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>
      )}
    </section>
  );
}

export function HeroBannerCarousel({ banners }: HeroBannerCarouselProps) {
  // If zero banners exist, preserve the approved static brand hero
  if (!banners || banners.length === 0) {
    return <StaticBrandHero />;
  }

  return <ActiveBannerCarousel banners={banners} />;
}

