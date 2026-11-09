import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import * as catalogQueries from '@/lib/catalog/queries';
import * as settingsQueries from '@/lib/settings/queries';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';
import type { SiteSettings, DealershipItem } from '@/types/settings';

vi.mock('@/lib/catalog/queries');
vi.mock('@/lib/settings/queries');

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
  ];

  const mockCategories: CatalogCategory[] = [
    { id: 'cat-1', name: 'Matic', slug: 'matic', description: 'Skutik harian lincah.', sortOrder: 1 },
    { id: 'cat-2', name: 'Sport', slug: 'sport', description: 'Performa tinggi.', sortOrder: 2 },
  ];

  const mockSettings: SiteSettings = {
    id: 'default',
    dealerName: 'Honda Satrya Dealership Group',
    logoPath: null,
    address: 'Jl. Raya Sidoarjo',
    city: 'Sidoarjo',
    phone: '(031) 894-1234',
    whatsappNumber: '6281234567890',
    publicEmail: 'info@satryagroup.co.id',
    openingHours: { consultation_hours: 'Senin - Sabtu: 08:00 - 17:00 WIB' },
    socialLinks: {},
    privacyNotice: 'Kebijakan Privasi',
    updatedBy: null,
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const mockDealerships: DealershipItem[] = [
    {
      id: 'dealership-1',
      name: 'Honda Satrya Sidoarjo Sentral',
      code: 'satrya-sidoarjo',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo',
      phone: '(031) 894-1234',
      whatsappNumber: '6281234567890',
      openingHours: '08:00 - 17:00',
      isSynthetic: false,
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogQueries.getPublishedModels).mockResolvedValue(mockModels);
    vi.mocked(catalogQueries.getActiveCategories).mockResolvedValue(mockCategories);
    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValue(mockSettings);
    vi.mocked(settingsQueries.getActiveDealerships).mockResolvedValue(mockDealerships);
  });

  it('renders dramatic split hero section with headline, dealer badge, and CTAs', async () => {
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
    expect(screen.getByText(/Digital showroom resmi Honda Satrya Dealer Group/i)).toBeInTheDocument();

    // CTAs
    const catalogCta = screen.getByRole('link', { name: 'Lihat Semua Motor' });
    expect(catalogCta).toHaveAttribute('href', '/motor');

    const contactCta = screen.getByRole('link', { name: 'Konsultasi Sales' });
    expect(contactCta).toHaveAttribute('href', '/hubungi');
  });

  it('renders floating search/filter bar with category and model selectors', async () => {
    const Component = await HomePage();
    render(Component);

    expect(screen.getByLabelText(/Kategori Motor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pilih Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kapasitas Mesin/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cari Motor/i })).toBeInTheDocument();
  });

  it('renders category discovery section with highlighted Matic card', async () => {
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

    const sportLink = screen.getByRole('link', { name: /Lihat Pilihan/i });
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

  it('renders popular listings section with published motorcycle models', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Model Motor Terpopuler/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText('Vario 160')).toBeInTheDocument();
    expect(screen.getByText('CBR150 R')).toBeInTheDocument();
  });

  it('renders dealer trust section with accurate dealership details and CTAs', async () => {
    const Component = await HomePage();
    render(Component);

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Honda Satrya Dealership Group/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/Senin - Sabtu: 08:00 - 17:00 WIB/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Hubungi Showroom Kami/i })).toHaveAttribute(
      'href',
      '/hubungi'
    );
  });
});
