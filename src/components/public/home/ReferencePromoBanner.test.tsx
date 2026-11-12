import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReferencePromoBanner } from './ReferencePromoBanner';
import type { HeroBanner } from '@/types/promotions';

describe('ReferencePromoBanner Component (Image-First CMS Promotional Banner with Refined Timing and Progress Indicator)', () => {
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
    expect(images.length).toBe(2);
  });

  it('renders single desktop artwork when mobileImagePath is null', () => {
    render(<ReferencePromoBanner banners={[mockBanners[1]]} />);

    const images = screen.getAllByAltText('Banner Promo Scoopy');
    expect(images.length).toBe(1);
  });

  it('does not render navigation controls, progress indicator, or autoplay when only 1 banner exists', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    expect(screen.queryByRole('button', { name: /Spanduk berikutnya/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Spanduk sebelumnya/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  describe('Refined Slideshow Autoplay (5s), Transition Duration (550ms), and Loop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('automatically advances to the next banner after refined 5s interval', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

      // Fast-forward 5 seconds (refined interval)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Active slide advanced to second banner
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(
        screen.getByRole('region', { name: /Spanduk Promosi: All New Honda Scoopy/i })
      ).toBeInTheDocument();
    });

    it('loops continuously from the last banner back to the first with refined timing', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');

      // Advance to banner 2
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Advance again (hits clone of first banner at index 3)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Advance safety transition end timer (650ms)
      act(() => {
        vi.advanceTimersByTime(650);
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
        vi.advanceTimersByTime(650);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Click Prev manually
      act(() => {
        fireEvent.click(prevBtn);
        vi.advanceTimersByTime(650);
      });
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Click Tab dot directly
      act(() => {
        fireEvent.click(tabs[1]);
        vi.advanceTimersByTime(650);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('resets the autoplay interval after manual navigation', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');
      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });

      // Advance 3 seconds (not yet reaching 5s mark)
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // User manually navigates to banner 2
      act(() => {
        fireEvent.click(nextBtn);
      });
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Advance 3 seconds more (total 6s elapsed, but only 3s since manual interaction)
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      // Should STILL be on banner 2 because manual click reset the 5s countdown
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Advance 2 seconds more (now 5s since manual click)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      // Now it automatically advances
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('pauses autoplay on hover and resumes with remaining time on mouse leave', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const section = screen.getByRole('region', { name: /Spanduk Promosi/i });
      const tabs = screen.getAllByRole('tab');

      // Advance 2s into the 5s interval (3s remaining)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Hover over banner (pauses)
      act(() => {
        fireEvent.mouseEnter(section);
      });

      // Advance 10 seconds while paused
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // Remains paused on banner 1
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Unhover (resumes with the remaining 3s)
      act(() => {
        fireEvent.mouseLeave(section);
      });

      // Advance 2s (still within the 3s remaining window)
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      // Advance remaining 1s
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      // Now it advances to banner 2!
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

      // Advance 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Resumes and advances
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Autoplay Progress Indicator', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders subtle progress indicator below artwork with 5000ms linear fill animation', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const progressBar = screen.getByRole('progressbar', {
        name: /Waktu jeda tayang spanduk promosi/i,
      });
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');

      const fill = screen.getByTestId('banner-progress-fill');
      expect(fill).toHaveClass('animate-banner-progress');
      expect(fill).toHaveStyle({
        transform: 'scaleX(0)',
        animationDuration: '5000ms',
        animationPlayState: 'running',
      });
    });

    it('pauses the progress indicator animation on hover and resumes on mouse leave', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const section = screen.getByRole('region', { name: /Spanduk Promosi/i });
      const fill = screen.getByTestId('banner-progress-fill');

      expect(fill).toHaveStyle({ animationPlayState: 'running' });

      // Hover
      act(() => {
        fireEvent.mouseEnter(section);
      });
      expect(fill).toHaveStyle({ animationPlayState: 'paused' });

      // Mouse leave
      act(() => {
        fireEvent.mouseLeave(section);
      });
      expect(fill).toHaveStyle({ animationPlayState: 'running' });
    });

    it('pauses the progress indicator when focused and resumes on blur', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const section = screen.getByRole('region', { name: /Spanduk Promosi/i });
      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });
      const fill = screen.getByTestId('banner-progress-fill');

      // Focus
      act(() => {
        fireEvent.focus(nextBtn);
      });
      expect(fill).toHaveStyle({ animationPlayState: 'paused' });

      // Blur outside
      act(() => {
        fireEvent.blur(section, { relatedTarget: document.body });
      });
      expect(fill).toHaveStyle({ animationPlayState: 'running' });
    });

    it('resets progress indicator upon manual slide navigation', () => {
      const { rerender } = render(<ReferencePromoBanner banners={mockBanners} />);

      const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });

      // Advance 2s
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Manual click
      act(() => {
        fireEvent.click(nextBtn);
      });

      // Fresh fill element is remounted for the new slide
      rerender(<ReferencePromoBanner banners={mockBanners} />);
      const fill = screen.getByTestId('banner-progress-fill');
      expect(fill).toHaveClass('animate-banner-progress');
      expect(fill).toHaveStyle({
        transform: 'scaleX(0)',
        animationDuration: '5000ms',
        animationPlayState: 'running',
      });
    });

    it('resets and remounts progress indicator on every automatic slide transition', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

      let fill = screen.getByTestId('banner-progress-fill');
      expect(fill).toHaveStyle({ transform: 'scaleX(0)' });

      // Advance full autoplay interval (5000ms)
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Carousel advances to second slide
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');

      // Progress bar fill is remounted for the active slide with initial scaleX(0)
      fill = screen.getByTestId('banner-progress-fill');
      expect(fill).toHaveStyle({
        transform: 'scaleX(0)',
        animationDuration: '5000ms',
        animationPlayState: 'running',
      });
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

    it('disables autoplay rotation and hides progress indicator when reduced motion is preferred', () => {
      render(<ReferencePromoBanner banners={mockBanners} />);

      // Progress bar should NOT be rendered when reduced motion is requested
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

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
