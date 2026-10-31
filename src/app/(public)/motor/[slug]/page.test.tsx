import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModelDetailPage, { generateMetadata } from './page';
import * as catalogQueries from '@/lib/catalog/queries';

const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

vi.mock('@/lib/catalog/queries', () => ({
  getPublishedModelBySlug: vi.fn(),
}));

vi.mock('@/lib/promotions/queries', () => ({
  getModelActivePromotions: vi.fn().mockResolvedValue([]),
}));

import { getModelActivePromotions } from '@/lib/promotions/queries';

describe('ModelDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockModelDetail = {
    id: 'model-1',
    name: 'All New Honda Vario 160',
    slug: 'vario-160',
    category: {
      id: 'cat-1',
      name: 'Matic',
      slug: 'matic',
    },
    shortDescription: 'Skutik premium 160cc 4 katup eSP+',
    description: 'Deskripsi lengkap bodi dan fitur All New Honda Vario 160.',
    engineCc: 160,
    transmission: 'Otomatis, V-Matic',
    keySpecs: {
      Mesin: {
        'Tipe Mesin': '4-Langkah, 4-Katup, eSP+',
        'Daya Maksimum': '11,3 kW / 8.500 rpm',
      },
      'Rangka & Kaki-kaki': {
        'Tipe Rangka': 'Underbone - eSAF',
      },
    },
    isFeatured: true,
    isNew: true,
    seoTitle: 'All New Honda Vario 160 — Harga OTR & Spesifikasi',
    seoDescription: 'Informasi lengkap spesifikasi dan harga OTR Honda Vario 160.',
    publishedAt: '2026-01-01T00:00:00Z',
    images: [
      {
        id: 'img-1',
        storagePath: '/images/motorcycle-placeholder.svg',
        altText: 'All New Honda Vario 160 Tampak Depan',
        imageRole: 'card' as const,
        sortOrder: 1,
        variantId: null,
        colorId: null,
      },
    ],
    variants: [
      {
        id: 'var-1',
        modelId: 'model-1',
        name: 'CBS',
        code: 'CBS',
        description: 'Tipe Combi Brake System',
        sortOrder: 1,
        priceIdr: 27500000,
        colors: [
          {
            id: 'vc-1',
            colorId: 'col-1',
            name: 'Grande Matte Black',
            slug: 'grande-matte-black',
            hexCode: '#1A1A1A',
            imagePath: null,
            isAvailable: true,
            sortOrder: 1,
          },
        ],
      },
    ],
    startingPriceIdr: 27500000,
  };

  it('renders breadcrumb, title, badges, variants, and specifications', async () => {
    vi.mocked(catalogQueries.getPublishedModelBySlug).mockResolvedValue(mockModelDetail);

    const pageResult = await ModelDetailPage({
      params: Promise.resolve({ slug: 'vario-160' }),
    });

    render(pageResult);

    // Title and breadcrumbs
    expect(
      screen.getByRole('heading', { level: 1, name: 'All New Honda Vario 160' })
    ).toBeInTheDocument();
    expect(screen.getByText('Sepeda Motor')).toBeInTheDocument();
    expect(screen.getByText('Skutik premium 160cc 4 katup eSP+')).toBeInTheDocument();

    // Specs
    expect(screen.getByText('Spesifikasi Lengkap')).toBeInTheDocument();
    expect(screen.getByText('160 cc')).toBeInTheDocument();
    expect(screen.getByText('Otomatis, V-Matic')).toBeInTheDocument();
    expect(screen.getByText('4-Langkah, 4-Katup, eSP+')).toBeInTheDocument();

    // Pricing disclaimer
    expect(screen.getByText(/Catatan Harga & Wilayah/i)).toBeInTheDocument();
  });

  it('renders promotional callout when model has active promotions', async () => {
    vi.mocked(catalogQueries.getPublishedModelBySlug).mockResolvedValue(mockModelDetail);
    vi.mocked(getModelActivePromotions).mockResolvedValue([
      {
        id: 'promo-1',
        title: 'Promo Cashback Vario 160',
        slug: 'promo-cashback-vario',
        summary: 'Potongan hingga Rp 1.500.000',
        imagePath: null,
        startsAt: '2026-10-01T00:00:00Z',
        endsAt: '2026-11-30T23:59:59Z',
        status: 'published',
        ctaLabel: null,
        ctaUrl: null,
        eligibleModelCount: 1,
      },
    ]);

    const pageResult = await ModelDetailPage({
      params: Promise.resolve({ slug: 'vario-160' }),
    });

    render(pageResult);

    expect(screen.getByText('Promo Cashback Vario 160')).toBeInTheDocument();
    expect(screen.getByText('Lihat Promo →')).toBeInTheDocument();
  });

  it('calls notFound() when model does not exist or is unpublished', async () => {
    vi.mocked(catalogQueries.getPublishedModelBySlug).mockResolvedValue(null);

    await expect(
      ModelDetailPage({
        params: Promise.resolve({ slug: 'non-existent-or-draft-bike' }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('generates appropriate metadata for model detail', async () => {
    vi.mocked(catalogQueries.getPublishedModelBySlug).mockResolvedValue(mockModelDetail);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'vario-160' }),
    });

    expect(metadata.title).toBe('All New Honda Vario 160 — Harga OTR & Spesifikasi');
    expect(metadata.description).toBe(
      'Informasi lengkap spesifikasi dan harga OTR Honda Vario 160.'
    );
    expect(metadata.alternates?.canonical).toBe('/motor/vario-160');
  });

  it('generates fallback metadata when model is not found', async () => {
    vi.mocked(catalogQueries.getPublishedModelBySlug).mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'unknown' }),
    });

    expect(metadata.title).toContain('Sepeda Motor Tidak Ditemukan');
  });
});
