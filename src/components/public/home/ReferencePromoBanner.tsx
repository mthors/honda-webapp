'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { getStorageImageUrl } from '@/lib/catalog/image';
import type { HeroBanner } from '@/types/promotions';

interface ReferencePromoBannerProps {
  banners: HeroBanner[];
}

export function ReferencePromoBanner({ banners }: ReferencePromoBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!banners || banners.length === 0) {
    return null;
  }

  // Bound index safely
  const safeIndex = currentIndex >= banners.length ? 0 : currentIndex;
  const activeBanner = banners[safeIndex];

  const desktopImg = getStorageImageUrl(
    activeBanner.desktopImagePath,
    '/images/motorcycle-placeholder.svg',
    'hero-banners'
  );
  const mobileImg = activeBanner.mobileImagePath
    ? getStorageImageUrl(
        activeBanner.mobileImagePath,
        '/images/motorcycle-placeholder.svg',
        'hero-banners'
      )
    : desktopImg;

  const bannerAlt = activeBanner.altText || activeBanner.title || 'Spanduk Promosi Honda';
  const hasDestination = Boolean(activeBanner.ctaUrl && activeBanner.ctaUrl.trim());

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : banners.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < banners.length - 1 ? prev + 1 : 0));
  };

  const bannerContent = (
    <>
      {activeBanner.mobileImagePath ? (
        <>
          {/* Mobile Artwork (< sm) */}
          <div className="block sm:hidden w-full relative">
            <Image
              src={mobileImg}
              alt={bannerAlt}
              width={1080}
              height={1080}
              sizes="100vw"
              className="w-full h-auto object-contain block"
              priority
            />
          </div>
          {/* Desktop Artwork (>= sm) */}
          <div className="hidden sm:block w-full relative">
            <Image
              src={desktopImg}
              alt={bannerAlt}
              width={1920}
              height={800}
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="w-full h-auto object-contain block"
              priority
            />
          </div>
        </>
      ) : (
        <div className="w-full relative">
          <Image
            src={desktopImg}
            alt={bannerAlt}
            width={1920}
            height={800}
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="w-full h-auto object-contain block"
            priority
          />
        </div>
      )}
    </>
  );

  return (
    <section
      aria-label={`Spanduk Promosi: ${activeBanner.title}`}
      className="bg-canvas py-8 sm:py-12"
    >
      <Container>
        {/* Image-First Promotional Banner Container */}
        <div className="relative w-full">
          {hasDestination ? (
            <Link
              href={activeBanner.ctaUrl!.trim()}
              aria-label={bannerAlt}
              className="group block relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-hairline shadow-xs hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {bannerContent}
            </Link>
          ) : (
            <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-hairline shadow-xs">
              {bannerContent}
            </div>
          )}

          {/* Carousel Controls (when multiple active campaign artworks exist) */}
          {banners.length > 1 && (
            <div className="mt-3 flex items-center justify-between px-1">
              {/* Pagination Dots */}
              <div
                className="flex items-center gap-1.5"
                role="tablist"
                aria-label="Navigasi Spanduk Promosi"
              >
                {banners.map((b, idx) => (
                  <button
                    key={b.id || idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === safeIndex}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Lihat spanduk ${idx + 1}: ${b.title}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex
                        ? 'w-6 bg-primary'
                        : 'w-2 bg-neutral-300 hover:bg-neutral-400'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Spanduk sebelumnya"
                  className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center transition-colors shadow-xs cursor-pointer text-xs"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Spanduk berikutnya"
                  className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center transition-colors shadow-xs cursor-pointer text-xs"
                >
                  &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
