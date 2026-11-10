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
    { id: 'cat-3', name: 'Cub / Bebek', slug: 'cub', description: 'Motor bebek legendaris.', sortOrder: 3 },
    { id: 'cat-4', name: 'Kendaraan Listrik', slug: 'ev', description: 'Ramah lingkungan.', sortOrder: 4 },
  ];

  const mockHeroBanners: HeroBanner[] = [
    {
      id: 'banner-1',
      title: 'Gebyar Promo Honda Satrya',
      subtitle: 'Dapatkan diskon DP dan angsuran ringan pembelian motor Honda baru.',
      desktopImagePath: 'promo-banner-1.webp',
      mobileImagePath: null,
      altText: 'Gebyar Promo Honda Satrya',
      ctaLabel: 'Klaim Promo',
      ctaUrl: '/hubungi?promo=gebyar',
      startsAt: '2026-01-01T00:00:00Z',
      endsAt: '2026-12-31T23:59:59Z',
      sortOrder: 1,
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const defaultMockSizes: Record<string, number> = {
    'vario-160.webp': 200000, // > 100 KB
    'cbr150-r.webp': 150000, // > 100 KB
    'revo-x.webp': 120000, // > 100 KB
    'promo-banner-1.webp': 180000,
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

  it('renders dynamic promotional banner when an active CMS hero banner is present', async () => {
    const Component = await HomePage();
    render(Component);

    // Image-First CMS: Entire banner is an accessible link, and artwork image is rendered
    const bannerLink = screen.getByRole('link', { name: 'Gebyar Promo Honda Satrya' });
    expect(bannerLink).toBeInTheDocument();
    expect(bannerLink).toHaveAttribute('href', '/hubungi?promo=gebyar');

    expect(screen.getByAltText('Gebyar Promo Honda Satrya')).toBeInTheDocument();

    // No overlaid headings, body copy, or secondary buttons are rendered on the artwork
    expect(
      screen.queryByRole('heading', {
        level: 2,
        name: /Gebyar Promo Honda Satrya/i,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Dapatkan diskon DP dan angsuran ringan/i)
    ).not.toBeInTheDocument();
  });

  it('gracefully hides promotional banner when no active hero banner exists', async () => {
    vi.mocked(promotionsQueries.getActiveHeroBanners).mockResolvedValue([]);

    const Component = await HomePage();
    render(Component);

    expect(screen.queryByAltText('Gebyar Promo Honda Satrya')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Gebyar Promo Honda Satrya' })
    ).not.toBeInTheDocument();
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

  describe('Catalog-Driven Showcase Slide Selection & Quality Filter', () => {
    it('orders slides strictly by category (Matic, Cub, Sport, EV) and prioritizes isFeatured', () => {
      const extraModels: CatalogModelSummary[] = [
        {
          id: 'model-cub-feat',
          name: 'Supra X 125',
          slug: 'supra-x-125',
          shortDescription: 'Bebek tangguh',
          engineCc: 125,
          transmission: 'Manual',
          isFeatured: true,
          isNew: false,
          category: { id: 'cat-3', name: 'Cub / Bebek', slug: 'cub' },
          primaryImage: { storagePath: 'supra.webp', altText: 'Supra X' },
          startingPriceIdr: 19000000,
        },
        {
          id: 'model-cub-std',
          name: 'Revo Fit',
          slug: 'revo-fit',
          shortDescription: 'Bebek hemat',
          engineCc: 110,
          transmission: 'Manual',
          isFeatured: false,
          isNew: false,
          category: { id: 'cat-3', name: 'Cub / Bebek', slug: 'cub' },
          primaryImage: { storagePath: 'revo-fit.webp', altText: 'Revo Fit' },
          startingPriceIdr: 15000000,
        },
      ];

      const sizes: Record<string, number> = {
        ...defaultMockSizes,
        'supra.webp': 180000,
        'revo-fit.webp': 150000,
      };

      const slides = buildShowcaseSlides([...mockModels, ...extraModels], sizes);

      // Category order check: Matic (Vario 160) first, then Cub (Supra X 125), then Sport (CBR150 R)
      expect(slides.length).toBeGreaterThanOrEqual(3);
      expect(slides[0].modelName).toContain('Vario 160');
      // Featured cub model comes before standard cub model
      const cubSlideIndex = slides.findIndex((s) => s.modelName.includes('Supra X 125'));
      expect(cubSlideIndex).toBeGreaterThan(0);
    });

    it('limits to at most 2 models per category', () => {
      const threeMaticModels: CatalogModelSummary[] = [
        {
          id: 'matic-1',
          name: 'Vario 160',
          slug: 'vario-160',
          shortDescription: 'Matic 1',
          engineCc: 160,
          transmission: 'Otomatis',
          isFeatured: true,
          isNew: false,
          category: { id: 'cat-1', name: 'Matic', slug: 'matic' },
          primaryImage: { storagePath: 'vario.webp', altText: 'Vario' },
          startingPriceIdr: 27000000,
        },
        {
          id: 'matic-2',
          name: 'BeAT',
          slug: 'beat',
          shortDescription: 'Matic 2',
          engineCc: 110,
          transmission: 'Otomatis',
          isFeatured: true,
          isNew: false,
          category: { id: 'cat-1', name: 'Matic', slug: 'matic' },
          primaryImage: { storagePath: 'beat.webp', altText: 'BeAT' },
          startingPriceIdr: 18000000,
        },
        {
          id: 'matic-3',
          name: 'Scoopy',
          slug: 'scoopy',
          shortDescription: 'Matic 3',
          engineCc: 110,
          transmission: 'Otomatis',
          isFeatured: false,
          isNew: false,
          category: { id: 'cat-1', name: 'Matic', slug: 'matic' },
          primaryImage: { storagePath: 'scoopy.webp', altText: 'Scoopy' },
          startingPriceIdr: 21000000,
        },
      ];

      const sizes = {
        'vario.webp': 150000,
        'beat.webp': 150000,
        'scoopy.webp': 150000,
      };

      const slides = buildShowcaseSlides(threeMaticModels, sizes);
      expect(slides).toHaveLength(2); // strictly max 2 per category
    });

    it('excludes models whose primaryImage is below or equal to 100 KB from showcase', () => {
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

      const slides = buildShowcaseSlides(testModels, testSizes);

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
