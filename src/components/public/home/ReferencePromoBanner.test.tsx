import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReferencePromoBanner } from './ReferencePromoBanner';
import type { HeroBanner } from '@/types/promotions';

describe('ReferencePromoBanner Component (Image-First CMS Promotional Banner with Smooth Autoplay)', () => {
  const mockBanners: HeroBanner[] = [
    {
      id: 'banner-genio',
      title: 'New Honda Genio Promo',
      subtitle: 'Skutik fashionable dengan rangka eSAF.',
      desktopImagePath: 'genio-desktop-1794280689170.webp',
      mobileImagePath: 'genio-mobile-1794280689170.webp',
      altText: 'Banner Promo Honda Genio',
      ctaLabel: 'Lihat Promo Genio',
      ctaUrl: '/motor/genio',
      startsAt: null,
      endsAt: null,
      sortOrder: 1,
      status: 'published',
      createdAt: '2026-11-10T03:00:00Z',
      updatedAt: '2026-11-10T03:00:00Z',
    },
    {
      id: 'banner-scoopy',
      title: 'All New Honda Scoopy',
      subtitle: null,
      desktopImagePath: 'scoopy-desktop.webp',
      mobileImagePath: null,
      altText: 'Banner Promo Scoopy',
      ctaLabel: null,
      ctaUrl: null,
      startsAt: null,
      endsAt: null,
      sortOrder: 2,
      status: 'published',
      createdAt: '2026-11-10T03:10:00Z',
      updatedAt: '2026-11-10T03:10:00Z',
    },
  ];

  it('renders null when banners array is empty or undefined', () => {
    const { container: emptyContainer } = render(<ReferencePromoBanner banners={[]} />);
    expect(emptyContainer.firstChild).toBeNull();

    const { container: undefinedContainer } = render(
      <ReferencePromoBanner banners={undefined as unknown as HeroBanner[]} />
    );
    expect(undefinedContainer.firstChild).toBeNull();
  });

  it('renders uploaded artwork cleanly without overlaid headings, subtitles, or CTA buttons', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    // In Image-First CMS, no visual headings or overlaid body copy are rendered
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Skutik fashionable dengan rangka eSAF.')).not.toBeInTheDocument();
    expect(screen.queryByText('Lihat Promo Genio')).not.toBeInTheDocument();

    // Ensures former hardcoded PCX 160 copy is absent
    expect(screen.queryByText(/Performa Tangguh Mesin eSP\+/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Konsultasi Sales Showroom/i)).not.toBeInTheDocument();

    // Renders the banner artwork with accessible alt text
    const images = screen.getAllByAltText('Banner Promo Honda Genio');
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('makes the entire banner clickable when ctaUrl is provided', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    // The banner container link exists with accessible label
    const bannerLink = screen.getByRole('link', { name: 'Banner Promo Honda Genio' });
    expect(bannerLink).toBeInTheDocument();
    expect(bannerLink).toHaveAttribute('href', '/motor/genio');
  });

  it('renders as a non-clickable container when ctaUrl is null or empty', () => {
    render(<ReferencePromoBanner banners={[mockBanners[1]]} />);

    // No link element should exist
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    // Banner image is rendered
    expect(screen.getByAltText('Banner Promo Scoopy')).toBeInTheDocument();
  });

  it('renders both mobile and desktop artwork when mobileImagePath is provided', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    const images = screen.getAllByAltText('Banner Promo Honda Genio');
    // Mobile (< sm) and desktop (>= sm) representations
    expect(images.length).toBe(2);
  });

  it('renders single desktop artwork when mobileImagePath is null', () => {
    render(<ReferencePromoBanner banners={[mockBanners[1]]} />);

    const images = screen.getAllByAltText('Banner Promo Scoopy');
    expect(images.length).toBe(1);
  });

  it('does not render navigation controls or autoplay when only 1 banner exists', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    expect(screen.queryByRole('button', { name: /Spanduk berikutnya/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Spanduk sebelumnya/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  describe('Slideshow Autoplay, Loop, and Manual Navigation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('automatically advances to the next banner after interval', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      // Fast-forward 7 seconds
      act(() => {
        vi.advanceTimersByTime(7000);
      });

      // Active slide advanced to second banner
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.getByRole('region', { name: /Spanduk Promosi: All New Honda Scoopy/i })
      ).toBeInTheDocument();
    });

    it('loops continuously from the last banner back to the first', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');

      // Advance to banner 2
      act(() => {
        vi.advanceTimersByTime(7000);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Advance again (hits clone of first banner at index 3)
      act(() => {
        vi.advanceTimersByTime(7000);
      });

      // Advance safety transition end timer
      act(() => {
        vi.advanceTimersByTime(850);
      });

      // Seamlessly loops back to banner 1
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      expect(
        screen.getByRole('region', { name: /Spanduk Promosi: New Honda Genio Promo/i })
      ).toBeInTheDocument();
    });

    it('manual navigation triggers smooth slide transition and updates realIndex', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });
      const prevBtn = screen.getByRole('button', { name: 'Spanduk sebelumnya' });
      const tabs = screen.getAllByRole('tab');

      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Click Next manually
      act(() => {
        fireEvent.click(nextBtn);
        vi.advanceTimersByTime(850);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Click Prev manually
      act(() => {
        fireEvent.click(prevBtn);
        vi.advanceTimersByTime(850);
      });
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Click Tab dot directly
      act(() => {
        fireEvent.click(tabs[1]);
        vi.advanceTimersByTime(850);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('resets the autoplay interval after manual navigation so it does not jump immediately', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');
      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });

      // Advance 5 seconds (not yet reaching the 7s mark)
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // User manually navigates to banner 2
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Advance 5 seconds more (total 10s elapsed, but only 5s since manual interaction)
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      // Should STILL be on banner 2 because manual click reset the 7s countdown
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Advance 2 seconds more (now 7s since manual click)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      // Now it automatically advances
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('pauses autoplay on hover and resumes on mouse leave', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const section = screen.getByRole('region', { name: /Spanduk Promosi/i });
      const tabs = screen.getAllByRole('tab');

      // Hover over banner
      act(() => {
        fireEvent.mouseEnter(section);
      });

      // Advance 14 seconds (twice the normal interval)
      act(() => {
        vi.advanceTimersByTime(14000);
      });

      // Should remain paused on banner 1
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Unhover
      act(() => {
        fireEvent.mouseLeave(section);
      });

      // Advance 7 seconds
      act(() => {
        vi.advanceTimersByTime(7000);
      });

      // Resumed and advanced to banner 2
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('pauses autoplay when controls or links inside the banner are focused', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const section = screen.getByRole('region', { name: /Spanduk Promosi/i });
      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });
      const tabs = screen.getAllByRole('tab');

      // Focus inside section
      act(() => {
        fireEvent.focus(nextBtn);
      });

      // Advance 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Remains paused
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Blur outside section
      act(() => {
        fireEvent.blur(section, { relatedTarget: document.body });
      });

      // Advance 7 seconds
      act(() => {
        vi.advanceTimersByTime(7000);
      });

      // Resumes
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('prefers-reduced-motion', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Mock window.matchMedia for reduced motion
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('disables autoplay rotation when reduced motion is preferred', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Advance time by 20 seconds
      act(() => {
        vi.advanceTimersByTime(20000);
      });

      // Stays on banner 1 (no automatic motion)
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('performs instant manual navigation without smooth slide animation when reduced motion is preferred', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });
      const tabs = screen.getAllByRole('tab');

      // Manual next transitions immediately without isTransitioning animation
      act(() => {
        fireEvent.click(nextBtn);
      });

      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });
});
