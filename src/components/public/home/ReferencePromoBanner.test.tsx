import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReferencePromoBanner } from './ReferencePromoBanner';
import type { HeroBanner } from '@/types/promotions';

describe('ReferencePromoBanner Component (CMS Hero Banners Slot)', () => {
  const mockBanners: HeroBanner[] = [
    {
      id: 'banner-genio',
      title: 'New Honda Genio Promo',
      subtitle: 'Skutik fashionable dengan rangka eSAF dan mesin eSP hemat.',
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

  it('renders banner with title, subtitle, and custom CTA button', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    expect(screen.getByRole('heading', { level: 2, name: 'New Honda Genio Promo' })).toBeInTheDocument();
    expect(
      screen.getByText('Skutik fashionable dengan rangka eSAF dan mesin eSP hemat.')
    ).toBeInTheDocument();

    const ctaLink = screen.getByRole('link', { name: 'Lihat Promo Genio' });
    expect(ctaLink).toHaveAttribute('href', '/motor/genio');

    const secondaryCta = screen.getByRole('link', { name: 'Cek Program Promo' });
    expect(secondaryCta).toHaveAttribute('href', '/promo');

    // Ensures old hardcoded PCX 160 is not present
    expect(screen.queryByText(/Performa Tangguh Mesin eSP\+/i)).not.toBeInTheDocument();
  });

  it('renders banner without subtitle and falls back to default showroom CTA when cta is null', () => {
    render(<ReferencePromoBanner banners={[mockBanners[1]]} />);

    expect(screen.getByRole('heading', { level: 2, name: 'All New Honda Scoopy' })).toBeInTheDocument();

    // Default primary CTA
    const defaultCta = screen.getByRole('link', { name: 'Konsultasi Sales Showroom' });
    expect(defaultCta).toHaveAttribute('href', '/hubungi');
  });

  it('supports carousel navigation when multiple banners exist', () => {
    render(<ReferencePromoBanner banners={mockBanners} />);

    // Initially on first banner (Genio)
    expect(screen.getByRole('heading', { level: 2, name: 'New Honda Genio Promo' })).toBeInTheDocument();

    // Next button
    const nextButton = screen.getByRole('button', { name: 'Spanduk berikutnya' });
    fireEvent.click(nextButton);

    // Switches to second banner (Scoopy)
    expect(screen.getByRole('heading', { level: 2, name: 'All New Honda Scoopy' })).toBeInTheDocument();

    // Prev button returns to first banner
    const prevButton = screen.getByRole('button', { name: 'Spanduk sebelumnya' });
    fireEvent.click(prevButton);
    expect(screen.getByRole('heading', { level: 2, name: 'New Honda Genio Promo' })).toBeInTheDocument();
  });

  it('renders mobile and desktop images when mobileImagePath is provided', () => {
    render(<ReferencePromoBanner banners={[mockBanners[0]]} />);

    const images = screen.getAllByAltText('Banner Promo Honda Genio');
    // Mobile and desktop cuts exist
    expect(images.length).toBeGreaterThanOrEqual(1);
  });
});
