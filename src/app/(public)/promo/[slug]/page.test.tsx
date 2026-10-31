import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromoDetailPage, { generateMetadata } from './page';

const notFoundMock = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

vi.mock('@/lib/promotions/queries', () => ({
  getPromotionBySlug: vi.fn(),
}));

import { getPromotionBySlug } from '@/lib/promotions/queries';

describe('PromoDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPromoDetail = {
    id: 'promo-1',
    title: 'Promo Spesial Vario 160 Sidoarjo',
    slug: 'promo-vario-160-sidoarjo',
    summary: 'Cashback Rp 1.500.000 untuk pembelian All New Honda Vario 160.',
    details: 'Rincian syarat dan ketentuan promo dealer resmi Honda Satrya.',
    imagePath: '/images/promo.jpg',
    startsAt: '2026-10-01T00:00:00Z',
    endsAt: '2026-11-30T23:59:59Z',
    terms: 'Khusus KTP wilayah Sidoarjo.',
    status: 'published' as const,
    ctaLabel: 'Klaim Sekarang',
    ctaUrl: '/hubungi',
    createdBy: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    eligibleModels: [
      {
        id: 'm-1',
        name: 'All New Honda Vario 160',
        slug: 'vario-160',
        categoryName: 'Matic',
        primaryImage: { storagePath: 'vario.png', altText: 'Vario 160' },
        startingPriceIdr: 27500000,
      },
    ],
  };

  it('renders promo title, dates, summary, terms, and eligible models', async () => {
    vi.mocked(getPromotionBySlug).mockResolvedValue(mockPromoDetail);

    const pageResult = await PromoDetailPage({
      params: Promise.resolve({ slug: 'promo-vario-160-sidoarjo' }),
    });

    render(pageResult);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Promo Spesial Vario 160 Sidoarjo' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Cashback Rp 1.500.000/i)).toBeInTheDocument();
    expect(screen.getByText('Syarat & Ketentuan Berlaku')).toBeInTheDocument();
    expect(screen.getByText('Khusus KTP wilayah Sidoarjo.')).toBeInTheDocument();
    expect(screen.getByText('Pilihan Motor dalam Program Ini')).toBeInTheDocument();
    expect(screen.getByText('All New Honda Vario 160')).toBeInTheDocument();
    expect(screen.getByText('Rp 27.500.000')).toBeInTheDocument();
  });

  it('calls notFound() when promo is not found or expired', async () => {
    vi.mocked(getPromotionBySlug).mockResolvedValue(null);

    await expect(
      PromoDetailPage({
        params: Promise.resolve({ slug: 'non-existent' }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalled();
  });

  it('generates metadata correctly', async () => {
    vi.mocked(getPromotionBySlug).mockResolvedValue(mockPromoDetail);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'promo-vario-160-sidoarjo' }),
    });

    expect(metadata.title).toBe('Promo Spesial Vario 160 Sidoarjo — Promo Dealer Honda Satrya');
    expect(metadata.description).toBe(mockPromoDetail.summary);
  });
});
