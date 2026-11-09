import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import * as catalogQueries from '@/lib/catalog/queries';
import * as promotionsQueries from '@/lib/promotions/queries';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import type { HeroBanner } from '@/types/promotions';

vi.mock('@/lib/catalog/queries');
vi.mock('@/lib/promotions/queries');

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
  ];

  const mockHeroBanners: HeroBanner[] = [
    {
      id: 'banner-1',
      title: 'Selamat Datang di Honda Satrya Dealership Group',
      subtitle: 'Digital showroom resmi Honda Satrya Dealership Group.',
      desktopImagePath: 'vario-125-street-1794191564438-1.webp',
      mobileImagePath: null,
      altText: 'Honda Vario 125 Street',
      ctaLabel: 'Lihat Semua Motor',
      ctaUrl: '/motor',
      startsAt: null,
      endsAt: null,
      sortOrder: 1,
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'banner-2',
      title: 'Honda PCX 160 eSP+ Skutik Mewah',
      subtitle: 'Kenyamanan berkendara kelas premium.',
      desktopImagePath: 'pcx-160-1793861131468-1.webp',
      mobileImagePath: null,
      altText: 'Honda PCX 160',
      ctaLabel: 'Jelajahi PCX 160',
      ctaUrl: '/motor',
      startsAt: null,
      endsAt: null,
      sortOrder: 2,
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogQueries.getPublishedModels).mockResolvedValue(mockModels);
    vi.mocked(catalogQueries.getFeaturedModels).mockResolvedValue(
      mockModels.filter((m) => m.isFeatured)
    );
    vi.mocked(catalogQueries.getActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(promotionsQueries.getActiveHeroBanners).mockResolvedValue(mockHeroBanners);
  });

  it('renders dramatic split hero section with multiple slides, manual navigation controls, and CTAs', async () => {
    const Component = await HomePage();
    render(Component);

    // Hero Headline
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Selamat Datang di Honda.*Satrya Dealership Group/i,
      })
    ).toBeInTheDocument();

    // Supporting copy
    expect(
      screen.getByText(/Digital showroom resmi Honda Satrya Dealership Group/i)
    ).toBeInTheDocument();

    // CTAs
    const catalogCta = screen.getByRole('link', { name: 'Lihat Semua Motor' });
    expect(catalogCta).toHaveAttribute('href', '/motor');

    const contactCta = screen.getByRole('link', { name: 'Konsultasi Sales' });
    expect(contactCta).toHaveAttribute('href', '/hubungi');

    // Slide navigation controls exist for multiple slides
    expect(screen.getByRole('button', { name: 'Slide sebelumnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide berikutnya' })).toBeInTheDocument();

    // Vertical text is NOT present
    expect(screen.queryByText(/Showroom Resmi • Honda Satrya Group/i)).not.toBeInTheDocument();
  });

  it('renders floating search/filter bar with category and model selectors', async () => {
    const Component = await HomePage();
    render(Component);

    expect(screen.getByLabelText(/Kategori Motor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pilih Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kapasitas Mesin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cari Motor/i })).toBeInTheDocument();
  });

  it('renders category discovery section with visually consistent cards', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Kategori Sepeda Motor/i,
      })
    ).toBeInTheDocument();

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

    // Dealer trust section heading and content was removed from the homepage
    expect(
      screen.queryByRole('region', { name: /Layanan dan Komitmen Showroom/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Hubungi Showroom Kami/i })
    ).not.toBeInTheDocument();
  });
});
