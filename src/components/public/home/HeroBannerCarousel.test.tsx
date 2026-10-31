import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroBannerCarousel } from './HeroBannerCarousel';
import type { HeroBanner } from '@/types/promotions';

describe('HeroBannerCarousel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock matchMedia for prefers-reduced-motion
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const mockBanners: HeroBanner[] = [
    {
      id: 'banner-1',
      title: 'All New Honda Vario 160',
      subtitle: 'Brand New Perfection dengan Mesin 160cc 4 Katup eSP+',
      desktopImagePath: '/banners/vario-desktop.webp',
      mobileImagePath: '/banners/vario-mobile.webp',
      altText: 'Spanduk Vario 160',
      ctaLabel: 'Lihat Spesifikasi',
      ctaUrl: '/motor/vario-160',
      startsAt: null,
      endsAt: null,
      sortOrder: 1,
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'banner-2',
      title: 'Pesta Diskon Showroom Sidoarjo',
      subtitle: 'Dapatkan promo cashback menarik',
      desktopImagePath: '/banners/event-desktop.webp',
      mobileImagePath: null,
      altText: 'Event Showroom',
      ctaLabel: 'Cek Promo',
      ctaUrl: '/promo',
      startsAt: '2026-10-01T00:00:00Z',
      endsAt: '2026-11-30T23:59:59Z',
      sortOrder: 2,
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  it('preserves the approved static brand hero when banners array is empty', () => {
    render(<HeroBannerCarousel banners={[]} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Digital Showroom Honda Satrya/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lihat Daftar Motor/i })).toBeInTheDocument();
  });

  it('renders active slide with title, subtitle, and CTA button', () => {
    render(<HeroBannerCarousel banners={mockBanners} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'All New Honda Vario 160' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Brand New Perfection dengan Mesin 160cc/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lihat Spesifikasi →/i })).toHaveAttribute(
      'href',
      '/motor/vario-160'
    );
  });

  it('switches slide on next and previous button clicks', () => {
    render(<HeroBannerCarousel banners={mockBanners} />);

    // Initial slide
    expect(
      screen.getByRole('heading', { level: 2, name: 'All New Honda Vario 160' })
    ).toBeInTheDocument();

    // Click next
    const nextBtn = screen.getByRole('button', { name: /Spanduk Berikutnya/i });
    fireEvent.click(nextBtn);

    // Slide 2 is now active
    expect(
      screen.getByRole('heading', { level: 2, name: 'Pesta Diskon Showroom Sidoarjo' })
    ).toBeInTheDocument();

    // Click previous
    const prevBtn = screen.getByRole('button', { name: /Spanduk Sebelumnya/i });
    fireEvent.click(prevBtn);

    // Slide 1 active again
    expect(
      screen.getByRole('heading', { level: 2, name: 'All New Honda Vario 160' })
    ).toBeInTheDocument();
  });

  it('supports keyboard navigation using arrow keys', () => {
    render(<HeroBannerCarousel banners={mockBanners} />);

    const region = screen.getByRole('region', { name: /Spanduk Promosi Showroom Honda/i });

    // Press ArrowRight
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Pesta Diskon Showroom Sidoarjo' })
    ).toBeInTheDocument();

    // Press ArrowLeft
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'All New Honda Vario 160' })
    ).toBeInTheDocument();
  });

  it('toggles autoplay on play/pause button click', () => {
    render(<HeroBannerCarousel banners={mockBanners} />);

    // In non-reduced-motion, it starts playing
    const pauseBtn = screen.getByRole('button', { name: /Jeda rotasi otomatis/i });
    expect(pauseBtn).toBeInTheDocument();

    fireEvent.click(pauseBtn);

    // State changes to paused
    const resumeBtn = screen.getByRole('button', { name: /Lanjutkan rotasi otomatis/i });
    expect(resumeBtn).toBeInTheDocument();
  });
});
