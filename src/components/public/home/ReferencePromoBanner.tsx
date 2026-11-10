'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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

  const hasCta = Boolean(activeBanner.ctaLabel && activeBanner.ctaUrl);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : banners.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < banners.length - 1 ? prev + 1 : 0));
  };

  return (
    <section
      aria-label={`Spanduk Promosi: ${activeBanner.title}`}
      className="bg-canvas py-10 sm:py-16"
    >
      <Container>
        {/* Wide Dark Banner matching the Reference design */}
        <div className="bg-[#181818] text-white rounded-2xl border border-neutral-800 p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Red Glow in Background */}
          <div
            className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Bold Editorial Typography & CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <Badge variant="primary" size="sm" className="mb-4 self-start font-semibold">
                Program Promo Honda
              </Badge>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold font-manrope text-white tracking-tight leading-snug">
                {activeBanner.title}
              </h2>

              {activeBanner.subtitle && (
                <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
                  {activeBanner.subtitle}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                {hasCta ? (
                  <Link href={activeBanner.ctaUrl!}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="font-semibold px-7 py-3 shadow-md hover:shadow-lg"
                    >
                      {activeBanner.ctaLabel}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/hubungi">
                    <Button
                      variant="primary"
                      size="lg"
                      className="font-semibold px-7 py-3 shadow-md hover:shadow-lg"
                    >
                      Konsultasi Sales Showroom
                    </Button>
                  </Link>
                )}

                <Link href="/promo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white hover:text-ink font-semibold px-6 py-3"
                  >
                    Cek Program Promo
                  </Button>
                </Link>
              </div>

              {/* Multi-banner Navigation Controls */}
              {banners.length > 1 && (
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        aria-label={`Lihat spanduk ${idx + 1}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          idx === safeIndex
                            ? 'w-6 bg-primary'
                            : 'w-2 bg-neutral-600 hover:bg-neutral-400'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Spanduk sebelumnya"
                      className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      aria-label="Spanduk berikutnya"
                      className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Motorcycle in Front of Radiant Red Circle */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
              {/* Vibrant Red Radiant Sun Circle */}
              <div
                className="w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-primary to-[#ff4757] shadow-[0_0_60px_rgba(230,27,51,0.35)] shrink-0"
                aria-hidden="true"
              />

              {/* High-Resolution Cutout Motorcycle Layered in Front */}
              <div className="absolute inset-0 flex items-center justify-center">
                {activeBanner.mobileImagePath ? (
                  <>
                    <div className="block sm:hidden relative w-full h-full aspect-[4/3] max-w-md">
                      <Image
                        src={mobileImg}
                        alt={activeBanner.altText || activeBanner.title}
                        fill
                        sizes="100vw"
                        className="object-contain drop-shadow-2xl"
                        priority
                      />
                    </div>
                    <div className="hidden sm:block relative w-full h-full aspect-[4/3] max-w-md">
                      <Image
                        src={desktopImg}
                        alt={activeBanner.altText || activeBanner.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 45vw"
                        className="object-contain drop-shadow-2xl"
                        priority
                      />
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full aspect-[4/3] max-w-md">
                    <Image
                      src={desktopImg}
                      alt={activeBanner.altText || activeBanner.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
