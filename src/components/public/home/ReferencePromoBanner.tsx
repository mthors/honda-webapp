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
import { Container } from '@/components/ui/Container';
import { getStorageImageUrl } from '@/lib/catalog/image';
import type { HeroBanner } from '@/types/promotions';

interface ReferencePromoBannerProps {
  banners: HeroBanner[];
}

const PROMO_AUTOPLAY_INTERVAL = 5000; // Refined 5 seconds
const PROMO_TRANSITION_DURATION = 550; // Refined 550ms (in 500–600ms range)
const PROMO_FALLBACK_TIMEOUT = 650; // 650ms safety reset

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

export function ReferencePromoBanner({ banners }: ReferencePromoBannerProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerSnapshot
  );

  const totalSlides = banners?.length ?? 0;

  // Track slides: For >= 2 slides, clone last to start and first to end for seamless looping
  const trackSlides = useMemo(() => {
    if (!banners || totalSlides <= 1) return banners || [];
    return [banners[totalSlides - 1], ...banners, banners[0]];
  }, [banners, totalSlides]);

  const [trackIndex, setTrackIndex] = useState(totalSlides >= 2 ? 1 : 0);
  const [prevTotalSlides, setPrevTotalSlides] = useState(totalSlides);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const isAnimatingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingTimeRef = useRef(PROMO_AUTOPLAY_INTERVAL);
  const startTimeRef = useRef<number | null>(null);

  // Sync track index if banners change
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
    if (totalSlides <= 1) return 0;
    return (trackIndex - 1 + totalSlides) % totalSlides;
  }, [trackIndex, totalSlides]);

  const currentBanner = totalSlides > 0 ? banners[realIndex] : null;

  // Seamless boundary loop handling
  const handleTransitionEnd = useCallback(() => {
    if (fallbackResetTimerRef.current) {
      clearTimeout(fallbackResetTimerRef.current);
      fallbackResetTimerRef.current = null;
    }

    if (totalSlides >= 2) {
      setTrackIndex((currentTrackIndex) => {
        if (currentTrackIndex === totalSlides + 1) {
          // Appended clone of first slide reached -> snap instantly to real first slide (index 1)
          setIsTransitioning(false);
          return 1;
        } else if (currentTrackIndex === 0) {
          // Prepended clone of last slide reached -> snap instantly to real last slide (index totalSlides)
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

    // Reset autoplay duration tracking for next cycle
    remainingTimeRef.current = PROMO_AUTOPLAY_INTERVAL;
    startTimeRef.current = Date.now();
    setProgressKey((k) => k + 1);

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

    if (fallbackResetTimerRef.current) clearTimeout(fallbackResetTimerRef.current);
    fallbackResetTimerRef.current = setTimeout(() => {
      handleTransitionEnd();
    }, PROMO_FALLBACK_TIMEOUT);
  }, [totalSlides, prefersReducedMotion, handleTransitionEnd]);

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    remainingTimeRef.current = PROMO_AUTOPLAY_INTERVAL;
    startTimeRef.current = Date.now();
    setProgressKey((k) => k + 1);

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

    if (fallbackResetTimerRef.current) clearTimeout(fallbackResetTimerRef.current);
    fallbackResetTimerRef.current = setTimeout(() => {
      handleTransitionEnd();
    }, PROMO_FALLBACK_TIMEOUT);
  }, [totalSlides, prefersReducedMotion, handleTransitionEnd]);

  const handleSelect = useCallback(
    (targetRealIndex: number) => {
      if (totalSlides <= 1 || isAnimatingRef.current || targetRealIndex === realIndex) return;

      const targetTrackIndex = targetRealIndex + 1;
      remainingTimeRef.current = PROMO_AUTOPLAY_INTERVAL;
      startTimeRef.current = Date.now();
      setProgressKey((k) => k + 1);

      if (prefersReducedMotion) {
        setIsTransitioning(false);
        setTrackIndex(targetTrackIndex);
        return;
      }

      isAnimatingRef.current = true;
      setIsTransitioning(true);
      setTrackIndex(targetTrackIndex);

      if (fallbackResetTimerRef.current) clearTimeout(fallbackResetTimerRef.current);
      fallbackResetTimerRef.current = setTimeout(() => {
        handleTransitionEnd();
      }, PROMO_FALLBACK_TIMEOUT);
    },
    [totalSlides, realIndex, prefersReducedMotion, handleTransitionEnd]
  );

  // Synchronized Autoplay & Progress Timer with Drift-Free Pause/Resume
  useEffect(() => {
    if (prefersReducedMotion || totalSlides <= 1) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    if (isPaused) {
      // Pause: capture used duration, calculate remaining time, clear timeout
      if (startTimeRef.current !== null) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Start / Resume: set timeout for remaining duration
    startTimeRef.current = Date.now();
    const timeoutDuration = remainingTimeRef.current;

    timerRef.current = setTimeout(() => {
      handleNext();
    }, timeoutDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [prefersReducedMotion, totalSlides, isPaused, handleNext, progressKey]);

  useEffect(() => {
    return () => {
      if (fallbackResetTimerRef.current) {
        clearTimeout(fallbackResetTimerRef.current);
        fallbackResetTimerRef.current = null;
      }
    };
  }, []);

  if (!banners || totalSlides === 0 || !currentBanner) {
    return null;
  }

  return (
    <section
      aria-label={`Spanduk Promosi: ${currentBanner.title || 'Promo Honda'}`}
      className="bg-canvas py-8 sm:py-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <Container>
        {/* Image-First Promotional Banner Container */}
        <div className="relative w-full">
          {/* Viewport with Overflow Clipping */}
          <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl border border-hairline shadow-xs">
            {/* Sliding Track */}
            <div
              className="flex w-full items-start"
              style={{
                transform: `translate3d(-${trackIndex * 100}%, 0, 0)`,
                transition:
                  isTransitioning && !prefersReducedMotion
                    ? `transform ${PROMO_TRANSITION_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
                    : 'none',
                willChange: 'transform',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {trackSlides.map((banner, idx) => {
                const desktopImg = getStorageImageUrl(
                  banner.desktopImagePath,
                  '/images/motorcycle-placeholder.svg',
                  'hero-banners'
                );
                const mobileImg = banner.mobileImagePath
                  ? getStorageImageUrl(
                      banner.mobileImagePath,
                      '/images/motorcycle-placeholder.svg',
                      'hero-banners'
                    )
                  : desktopImg;

                const bannerAlt = banner.altText || banner.title || 'Spanduk Promosi Honda';
                const hasDestination = Boolean(banner.ctaUrl && banner.ctaUrl.trim());

                const imageContent = (
                  <>
                    {banner.mobileImagePath ? (
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
                            priority={idx <= 1}
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
                            priority={idx <= 1}
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
                          priority={idx <= 1}
                        />
                      </div>
                    )}
                  </>
                );

                return (
                  <div
                    key={`${banner.id}-${idx}`}
                    className="w-full shrink-0 relative"
                    aria-hidden={idx !== trackIndex}
                  >
                    {hasDestination ? (
                      <Link
                        href={banner.ctaUrl!.trim()}
                        aria-label={bannerAlt}
                        tabIndex={idx === trackIndex ? 0 : -1}
                        className="group block relative w-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        {imageContent}
                      </Link>
                    ) : (
                      <div className="relative w-full">
                        {imageContent}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subtle Autoplay Progress Indicator (fills over 5s interval, pauses on hover/focus) */}
          {totalSlides > 1 && !prefersReducedMotion && (
            <div
              className="mt-2.5 w-full h-0.5 sm:h-1 bg-neutral-200/70 overflow-hidden rounded-full"
              role="progressbar"
              aria-label="Waktu jeda tayang spanduk promosi"
              aria-valuemin={0}
              aria-valuemax={100}
              data-testid="banner-progress-bar"
            >
              <div
                key={progressKey}
                data-testid="banner-progress-fill"
                className="h-full bg-primary origin-left rounded-full w-full animate-banner-progress"
                style={{
                  animationDuration: `${PROMO_AUTOPLAY_INTERVAL}ms`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                  willChange: 'transform',
                }}
              />
            </div>
          )}

          {/* Carousel Controls (when multiple active campaign artworks exist) */}
          {totalSlides > 1 && (
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
                    aria-selected={idx === realIndex}
                    onClick={() => handleSelect(idx)}
                    aria-label={`Lihat spanduk ${idx + 1}: ${b.title}`}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === realIndex
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
                  className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
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
                  aria-label="Spanduk berikutnya"
                  className="w-8 h-8 rounded-full bg-white border border-hairline hover:border-primary text-ink hover:text-primary flex items-center justify-center transition-colors shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
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
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
