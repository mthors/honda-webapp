import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import * as catalogQueries from '@/lib/catalog/queries';
import * as promotionsQueries from '@/lib/promotions/queries';
import * as imageQualityServer from '@/lib/catalog/image-quality.server';
import { buildShowcaseSlides } from '@/components/public/home/SplitHeroShowroom';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import type { HeroBanner } from '@/types/promotions';

vi.mock('@/lib/catalog/queries');
vi.mock('@/lib/promotions/queries');
vi.mock('@/lib/catalog/image-quality.server', () => ({
  getStorageImageSizes: vi.fn(),
}));

// Mock next/navigation useRouter for FloatingHeroFilter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Public HomePage (Reference Redesign)', () => {
  const mockModels: CatalogModelSummary[] = [
    {
      id: 'model-1',
      name: 'Vario 160',
      slug: 'vario-160',
      shortDescription: 'Skutik premium 160cc 4 katup eSP+.',
      engineCc: 160,
      transmission: 'Otomatis',
      isFeatured: true,
      isNew: true,
      category: { id: 'cat-1', name: 'Matic', slug: 'matic' },
      primaryImage: {
        storagePath: 'vario-160.webp',
        altText: 'Honda Vario 160',
      },
      startingPriceIdr: 27500000,
    },
    {
      id: 'model-2',
      name: 'CBR150 R',
      slug: 'cbr150-r',
      shortDescription: 'Motor sport 150cc DOHC agresif.',
      engineCc: 150,
      transmission: 'Manual 6-Kecepatan',
      isFeatured: true,
      isNew: false,
      category: { id: 'cat-2', name: 'Sport', slug: 'sport' },
      primaryImage: {
        storagePath: 'cbr150-r.webp',
        altText: 'Honda CBR150 R',
      },
      startingPriceIdr: 37500000,
    },
    {
      id: 'model-3',
      name: 'Revo X',
      slug: 'revo-x',
      shortDescription: 'Motor bebek tangguh dan irit.',
      engineCc: 110,
      transmission: 'Manual 4-Kecepatan',
      isFeatured: false,
      isNew: false,
      category: { id: 'cat-3', name: 'Cub', slug: 'cub' },
      primaryImage: {
        storagePath: 'revo-x.webp',
        altText: 'Honda Revo X',
      },
      startingPriceIdr: 16500000,
    },
  ];

  const mockCategories: CatalogCategory[] = [
    { id: 'cat-1', name: 'Matic', slug: 'matic', description: 'Skutik harian lincah.', sortOrder: 1 },
    { id: 'cat-2', name: 'Sport', slug: 'sport', description: 'Performa tinggi.', sortOrder: 2 },
    { id: 'cat-4', name: 'Kendaraan Listrik', slug: 'ev', description: 'Ramah lingkungan.', sortOrder: 4 },
  ];

  const mockHeroBanners: HeroBanner[] = [];

  const defaultMockSizes: Record<string, number> = {
    'vario-160.webp': 200000, // > 100 KB
    'cbr150-r.webp': 150000, // > 100 KB
    'revo-x.webp': 120000, // > 100 KB
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogQueries.getPublishedModels).mockResolvedValue(mockModels);
    vi.mocked(catalogQueries.getFeaturedModels).mockResolvedValue(
      mockModels.filter((m) => m.isFeatured)
    );
    vi.mocked(catalogQueries.getActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(promotionsQueries.getActiveHeroBanners).mockResolvedValue(mockHeroBanners);
    vi.mocked(imageQualityServer.getStorageImageSizes).mockResolvedValue(defaultMockSizes);
  });

  it('renders dramatic split hero with fixed left copy and dynamic right showcase', async () => {
    const Component = await HomePage();
    render(Component);

    // Fixed Left Hero Headline
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Selamat Datang di Honda.*Satrya Dealership Group/i,
      })
    ).toBeInTheDocument();

    // Fixed Left Supporting copy
    expect(
      screen.getByText(/Digital showroom resmi Honda Satrya Dealership Group/i)
    ).toBeInTheDocument();

    // Fixed Left CTAs
    const catalogCta = screen.getByRole('link', { name: 'Lihat Semua Motor' });
    expect(catalogCta).toHaveAttribute('href', '/motor');

    const contactCta = screen.getByRole('link', { name: 'Konsultasi Sales' });
    expect(contactCta).toHaveAttribute('href', '/hubungi');

    // Right-side Showcase: Manual navigation controls exist
    expect(screen.getByRole('button', { name: 'Slide sebelumnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide berikutnya' })).toBeInTheDocument();

    // Vertical text is NOT present
    expect(screen.queryByText(/Showroom Resmi • Honda Satrya Group/i)).not.toBeInTheDocument();

    // Redundant status indicators (dots/bars) are NOT present
    expect(screen.queryByText(/Unit Baru Bergaransi AHM/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Harga OTR Terverifikasi/i)).not.toBeInTheDocument();
  });

  it('renders floating search/filter bar with category and model selectors', async () => {
    const Component = await HomePage();
    render(Component);

    expect(screen.getByLabelText(/Kategori Motor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pilih Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kapasitas Mesin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cari Motor/i })).toBeInTheDocument();
  });

  it('renders category discovery section with actual motorcycle thumbnails and graceful empty states', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Kategori Sepeda Motor/i,
      })
    ).toBeInTheDocument();

    // Matic category card has representative thumbnail from mock models
    expect(
      screen.getByAltText(/Sepeda motor kategori Matic: Vario 160/i)
    ).toBeInTheDocument();

    // Sport category card has representative thumbnail from mock models
    expect(
      screen.getByAltText(/Sepeda motor kategori Sport: CBR150 R/i)
    ).toBeInTheDocument();

    // EV category has 0 models in mock -> displays graceful "Unit Segera Hadir" without fabricated image
    expect(screen.getAllByText(/Unit Segera Hadir/i).length).toBeGreaterThanOrEqual(1);

    const maticLink = screen.getByRole('link', { name: /Eksplorasi Matic/i });
    expect(maticLink).toHaveAttribute('href', '/motor?kategori=matic');

    const sportLink = screen.getByRole('link', { name: /Eksplorasi Sport/i });
    expect(sportLink).toHaveAttribute('href', '/motor?kategori=sport');
  });

  it('renders wide dark editorial promotional banner', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Performa Tangguh Mesin eSP\+.*Dan Rangka Presisi eSAF/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /Konsultasi Sales Showroom/i })
    ).toHaveAttribute('href', '/hubungi');
  });

  it('renders popular listings section displaying strictly Unggulan (isFeatured) models', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Model Motor Terpopuler/i,
      })
    ).toBeInTheDocument();

    // Featured models are rendered
    expect(screen.getByText('Vario 160')).toBeInTheDocument();
    expect(screen.getByText('CBR150 R')).toBeInTheDocument();

    // Non-featured model (Revo X) is NOT rendered in the featured section
    expect(screen.queryByText('Revo X')).not.toBeInTheDocument();
  });

  it('does not render dealer trust section on the homepage', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.queryByRole('region', { name: /Layanan dan Komitmen Showroom/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Hubungi Showroom Kami/i })
    ).not.toBeInTheDocument();
  });

  describe('Hero Image Quality Filter (Minimum 100 KB)', () => {
    it('skips hero banners with image file sizes below or equal to 100 KB and retains eligible ones', () => {
      const testBanners: HeroBanner[] = [
        {
          id: 'banner-small',
          title: 'Banner Kecil',
          subtitle: null,
          desktopImagePath: 'banner-small.webp',
          mobileImagePath: null,
          altText: 'Banner Kecil',
          ctaLabel: null,
          ctaUrl: null,
          startsAt: null,
          endsAt: null,
          sortOrder: 1,
          status: 'published',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'banner-exact-100kb',
          title: 'Banner Pas 100 KB',
          subtitle: null,
          desktopImagePath: 'banner-exact.webp',
          mobileImagePath: null,
          altText: 'Banner Pas 100 KB',
          ctaLabel: null,
          ctaUrl: null,
          startsAt: null,
          endsAt: null,
          sortOrder: 2,
          status: 'published',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'banner-hd',
          title: 'Banner HD Berkualitas',
          subtitle: null,
          desktopImagePath: 'banner-hd.webp',
          mobileImagePath: null,
          altText: 'Banner HD Berkualitas',
          ctaLabel: null,
          ctaUrl: null,
          startsAt: null,
          endsAt: null,
          sortOrder: 3,
          status: 'published',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ];

      const testSizes: Record<string, number> = {
        'banner-small.webp': 50 * 1024, // 50 KB -> excluded
        'banner-exact.webp': 100 * 1024, // 100 KB exactly -> excluded
        'banner-hd.webp': 250 * 1024, // 250 KB -> eligible!
      };

      const slides = buildShowcaseSlides([], testBanners, testSizes);

      // Only banner-hd is eligible
      expect(slides).toHaveLength(1);
      expect(slides[0].id).toBe('banner-hd');
      expect(slides[0].imagePath).toBe('banner-hd.webp');
    });

    it('excludes models whose primaryImage is below 100 KB from showcase', () => {
      const testModels: CatalogModelSummary[] = [
        {
          ...mockModels[0], // Vario 160
          primaryImage: { storagePath: 'small-vario.webp', altText: 'Vario' },
        },
        {
          ...mockModels[1], // CBR150 R
          primaryImage: { storagePath: 'hd-cbr.webp', altText: 'CBR' },
        },
      ];

      const testSizes: Record<string, number> = {
        'small-vario.webp': 45000, // 45 KB -> excluded
        'hd-cbr.webp': 160000, // 160 KB -> eligible!
      };

      const slides = buildShowcaseSlides(testModels, [], testSizes);

      // Only hd-cbr should be in slides
      expect(slides.some((s) => s.imagePath === 'small-vario.webp')).toBe(false);
      expect(slides.some((s) => s.imagePath === 'hd-cbr.webp')).toBe(true);
    });

    it('renders graceful fallback state when no eligible hero images exist', async () => {
      // Mock all image sizes to be below 100 KB
      vi.mocked(imageQualityServer.getStorageImageSizes).mockResolvedValue({
        'vario-160.webp': 30000, // 30 KB
        'cbr150-r.webp': 40000, // 40 KB
        'revo-x.webp': 25000, // 25 KB
      });

      const Component = await HomePage();
      render(Component);

      // Fallback state displays brand invitation without stretching low-quality images
      expect(
        screen.getByRole('heading', {
          level: 3,
          name: /Lini Sepeda Motor Honda Resmi/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', { name: /Buka Katalog Motor →/i })
      ).toHaveAttribute('href', '/motor');

      // Fixed left copy remains intact
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Selamat Datang di Honda.*Satrya Dealership Group/i,
        })
      ).toBeInTheDocument();
    });
  });
});
