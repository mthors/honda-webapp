import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReferencePromoBanner } from './ReferencePromoBanner';
import type { HeroBanner } from '@/types/promotions';

describe('ReferencePromoBanner Component (Image-First CMS Promotional Banner)', () => {
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

    // The entire banner container is an accessible link
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

  it('supports carousel navigation and tab controls when multiple banners exist', () => {
    render(<ReferencePromoBanner banners={mockBanners} />);

    // Initially displays first banner
    expect(screen.getAllByAltText('Banner Promo Honda Genio').length).toBeGreaterThan(0);
    expect(screen.queryByAltText('Banner Promo Scoopy')).not.toBeInTheDocument();

    // Carousel controls exist
    const nextBtn = screen.getByRole('button', { name: 'Spanduk berikutnya' });
    const prevBtn = screen.getByRole('button', { name: 'Spanduk sebelumnya' });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);

    // Click next -> switches to second banner
    fireEvent.click(nextBtn);
    expect(screen.getByAltText('Banner Promo Scoopy')).toBeInTheDocument();
    expect(screen.queryByAltText('Banner Promo Honda Genio')).not.toBeInTheDocument();

    // Click prev -> returns to first banner
    fireEvent.click(prevBtn);
    expect(screen.getAllByAltText('Banner Promo Honda Genio').length).toBeGreaterThan(0);

    // Click tab 2
    fireEvent.click(tabs[1]);
    expect(screen.getByAltText('Banner Promo Scoopy')).toBeInTheDocument();
  });
});
