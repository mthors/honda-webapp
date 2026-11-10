'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useSyncExternalStore,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FloatingHeroFilter } from '@/components/public/home/FloatingHeroFilter';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { isHeroImageEligibleBySize } from '@/lib/catalog/image-quality';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';

export interface ShowcaseSlide {
  id: string;
  modelName: string;
  imagePath: string;
}

interface SplitHeroShowroomProps {
  categories: CatalogCategory[];
  models?: CatalogModelSummary[];
  imageSizes?: Record<string, number>;
}

const SHOWCASE_AUTOPLAY_INTERVAL = 5500; // 5.5 seconds (refined 5–6s range)
const SHOWCASE_TRANSITION_DURATION = 550; // 550ms (refined 500–600ms range)
const SHOWCASE_FALLBACK_TIMEOUT = 650; // 650ms safety reset

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

/**
 * Builds the list of eligible showcase slides strictly driven by the published
 * motorcycle catalog data and enforcing the minimum 100 KB image file size requirement.
 *
 * Requirements:
 * - Powered exclusively by motorcycle product catalog data.
 * - Categories ordered strictly: Matic, Cub/Bebek, Sport, EV.
 * - Prioritizes featured models (isFeatured = true) first within each category.
 * - Takes up to 2 models per category when available.
 * - Image file size must exceed 100 KB (102,400 bytes).
 * - Gracefully skips unavailable or ineligible images.
 */
export function buildShowcaseSlides(
  models: CatalogModelSummary[],
  imageSizes?: Record<string, number>
): ShowcaseSlide[] {
  const targetCategorySlugs = ['matic', 'cub', 'sport', 'ev'];
  const slides: ShowcaseSlide[] = [];

  for (const slug of targetCategorySlugs) {
    const categoryModels = models.filter((m) => {
      if (m.category.slug !== slug || !m.primaryImage?.storagePath) {
        return false;
      }

      const barePath = m.primaryImage.storagePath.replace(/^motorcycles\//, '');
      const size =
        (m.primaryImage as { sizeBytes?: number }).sizeBytes ??
        imageSizes?.[m.primaryImage.storagePath] ??
        imageSizes?.[barePath];

      // Check minimum 100 KB eligibility
      if (size !== undefined && !isHeroImageEligibleBySize(size)) {
        return false; // Ineligible: file size <= 100 KB
      }

      return true;
    });

    // Prioritize featured models first
    const sorted = [...categoryModels].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    // Take up to 2 models per category
    const selected = sorted.slice(0, 2);
    for (const m of selected) {
      if (m.primaryImage?.storagePath) {
        slides.push({
          id: `model-${m.id}`,
          modelName: m.name.startsWith('Honda') ? m.name : `Honda ${m.name}`,
          imagePath: m.primaryImage.storagePath,
        });
      }
    }
  }

  return slides;
}

export function SplitHeroShowroom({
  categories,
  models = [],
  imageSizes = {},
}: SplitHeroShowroomProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const slides = useMemo(
    () => buildShowcaseSlides(models, imageSizes),
    [models, imageSizes]
  );
  const totalSlides = slides.length;

  // Track items: for totalSlides >= 2, prepend clone of last item and append clone of first item
  // e.g. for [S0, S1]: track is [S1_clone, S0, S1, S0_clone]
  const trackSlides = useMemo(() => {
    if (totalSlides <= 1) return slides;
    return [slides[totalSlides - 1], ...slides, slides[0]];
  }, [slides, totalSlides]);

  // trackIndex represents position in trackSlides:
  // For totalSlides >= 2: starts at 1 (which corresponds to slides[0])
  // For totalSlides <= 1: starts at 0
  const [trackIndex, setTrackIndex] = useState(totalSlides >= 2 ? 1 : 0);
  const [prevTotalSlides, setPrevTotalSlides] = useState(totalSlides);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isAnimatingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync track index if slides length changes during render
  if (prevTotalSlides !== totalSlides) {
    setPrevTotalSlides(totalSlides);
    setTrackIndex(totalSlides >= 2 ? 1 : 0);
    setIsTransitioning(false);
  }

  useEffect(() => {
    isAnimatingRef.current = false;
  }, [totalSlides]);

  // Map trackIndex back to real slide index (0 .. totalSlides - 1)
  const realIndex = useMemo(() => {
    if (totalSlides <= 0) return 0;
    if (totalSlides === 1) return 0;
    return (trackIndex - 1 + totalSlides) % totalSlides;
  }, [trackIndex, totalSlides]);

  const currentSlide = totalSlides > 0 ? slides[realIndex] : null;

  // Handles loop teleportation when hitting the clone boundary
  const handleTransitionEnd = useCallback(() => {
    if (fallbackResetTimerRef.current) {
      clearTimeout(fallbackResetTimerRef.current);
      fallbackResetTimerRef.current = null;
    }

    if (totalSlides >= 2) {
      setTrackIndex((currentTrackIndex) => {
        if (currentTrackIndex === totalSlides + 1) {
          // Hit appended clone of first slide (index N+1) -> instantly snap to real first slide (index 1)
          setIsTransitioning(false);
          return 1;
        } else if (currentTrackIndex === 0) {
          // Hit prepended clone of last slide (index 0) -> instantly snap to real last slide (index N)
          setIsTransitioning(false);
          return totalSlides;
        }
        return currentTrackIndex;
      });
    }

    isAnimatingRef.current = false;
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    if (totalSlides <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (prefersReducedMotion) {
      setIsTransitioning(false);
      setTrackIndex((prev) => {
        const next = (prev % totalSlides) + 1;
        return next;
      });
      isAnimatingRef.current = false;
      return;
    }

    setIsTransitioning(true);
    setTrackIndex((prev) => prev + 1);

    // Safety timeout in case transitionEnd event is skipped (e.g. background tab)
    if (fallbackResetTimerRef.current) clearTimeout(fallbackResetTimerRef.current);
    fallbackResetTimerRef.current = setTimeout(() => {
      handleTransitionEnd();
    }, SHOWCASE_FALLBACK_TIMEOUT);
  }, [totalSlides, prefersReducedMotion, handleTransitionEnd]);

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (prefersReducedMotion) {
      setIsTransitioning(false);
      setTrackIndex((prev) => {
        const next = prev <= 1 ? totalSlides : prev - 1;
        return next;
      });
      isAnimatingRef.current = false;
      return;
    }

    setIsTransitioning(true);
    setTrackIndex((prev) => prev - 1);

    // Safety timeout in case transitionEnd event is skipped
    if (fallbackResetTimerRef.current) clearTimeout(fallbackResetTimerRef.current);
    fallbackResetTimerRef.current = setTimeout(() => {
      handleTransitionEnd();
    }, SHOWCASE_FALLBACK_TIMEOUT);
  }, [totalSlides, prefersReducedMotion, handleTransitionEnd]);

  // Automatic slide rotation (5.5s), paused on hover/focus or reduced motion
  useEffect(() => {
    if (prefersReducedMotion || totalSlides <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, SHOWCASE_AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fallbackResetTimerRef.current) clearTimeout(fallbackResetTimerRef.current);
    };
  }, [prefersReducedMotion, totalSlides, isPaused, handleNext]);

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
        {/* Left Side: Dark Automotive Atelier (Fixed Headline, Copy, & CTAs) */}
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
            {/* Dealer Official Badge (Fixed) */}
            <div className="mb-4 sm:mb-5">
              <Badge variant="primary" size="md" className="font-semibold tracking-wide">
                Dealer Resmi Honda
              </Badge>
            </div>

            {/* Split Headline (Fixed — does not change when right-side motorcycle rotates) */}
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-white font-manrope leading-[1.15]">
                Selamat Datang di <span className="text-primary">Honda</span>
                <br />
                <span className="text-white">Satrya Dealership Group</span>
              </h1>

              {/* Supporting Copy (Fixed) */}
              <p className="mt-4 sm:mt-5 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-lg">
                Digital showroom resmi Honda Satrya Dealership Group. Temukan lini motor Honda terbaik
                dengan spesifikasi terverifikasi dan harga OTR lokal terpercaya.
              </p>
            </div>

            {/* CTAs (Fixed) */}
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4 items-center">
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

          {totalSlides > 0 && currentSlide ? (
            <>
              {/* Motorcycle Image Frame with Smooth Horizontal Sliding Track */}
              <div className="relative w-full max-w-lg lg:max-w-xl aspect-[4/3] flex items-center justify-center z-10">
                {/* Ground Contact Shadow (Fixed beneath the sliding track) */}
                <div
                  className="absolute bottom-4 sm:bottom-6 w-3/4 h-8 bg-black/15 blur-xl rounded-full pointer-events-none"
                  aria-hidden="true"
                />

                {/* Sliding Viewport with Overflow Clipping */}
                <div className="relative w-full h-full overflow-hidden">
                  <div
                    className="flex w-full h-full"
                    style={{
                      transform: `translate3d(-${trackIndex * 100}%, 0, 0)`,
                      transition:
                        isTransitioning && !prefersReducedMotion
                          ? `transform ${SHOWCASE_TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
                          : 'none',
                      willChange: 'transform',
                    }}
                    onTransitionEnd={handleTransitionEnd}
                  >
                    {trackSlides.map((slide, idx) => (
                      <div
                        key={`${slide.id}-${idx}`}
                        className="relative w-full h-full shrink-0 flex items-center justify-center"
                        aria-hidden={idx !== trackIndex}
                      >
                        <Image
                          src={getStorageImageUrl(slide.imagePath)}
                          alt={`Sepeda motor showroom: ${slide.modelName}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 45vw"
                          className="object-contain drop-shadow-xl select-none"
                          priority={idx === 1}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Reference Tag Line and Discrete Navigation Controls */}
              <div className="mt-4 sm:mt-6 z-10 w-full max-w-lg flex items-center justify-between text-xs tracking-wider text-muted font-manrope">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-ink text-sm">
                    {String(realIndex + 1).padStart(2, '0')}
                    <span className="text-neutral-400 font-normal">
                      {' '}
                      / {String(totalSlides).padStart(2, '0')}
                    </span>
                  </span>
                  <span className="w-12 sm:w-16 h-px bg-hairline" />
                  <span className="font-semibold text-ink truncate max-w-[180px] sm:max-w-xs transition-opacity duration-300">
                    {currentSlide.modelName}
                  </span>
                </div>

                {/* Discrete Manual Navigation Controls */}
                {totalSlides > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handlePrev}
                      aria-label="Slide sebelumnya"
                      className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
                      className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
            </>
          ) : (
            /* Graceful Fallback State: No eligible images > 100 KB available */
            <div className="relative w-full max-w-lg aspect-[4/3] flex flex-col items-center justify-center p-8 text-center bg-white/80 backdrop-blur-xs rounded-2xl border border-hairline shadow-xs z-10">
              <Badge variant="primary" size="sm" className="mb-3">
                Digital Showroom
              </Badge>
              <h3 className="text-xl font-bold text-ink font-manrope">
                Lini Sepeda Motor Honda Resmi
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-body leading-relaxed max-w-xs">
                Jelajahi seluruh varian sepeda motor resmi Honda dengan harga OTR lokal dan
                spesifikasi terverifikasi.
              </p>
              <div className="mt-5">
                <Link href="/motor">
                  <Button variant="primary" size="sm" className="font-semibold">
                    Buka Katalog Motor →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Floating Overlapping Search Filter Bar */}
      <div className="-mt-7 sm:-mt-9 lg:-mt-10 pb-8 sm:pb-12">
        <FloatingHeroFilter categories={categories} models={models} />
      </div>
    </section>
  );
}
