import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromoPage from './page';

vi.mock('@/lib/promotions/queries', () => ({
  getActivePromotions: vi.fn(),
}));

import { getActivePromotions } from '@/lib/promotions/queries';

describe('PromoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of active promotions when available', async () => {
    vi.mocked(getActivePromotions).mockResolvedValue([
      {
        id: 'promo-1',
        title: 'Promo Spesial Vario 160',
        slug: 'promo-vario-160',
        summary: 'Cashback Rp 1.000.000 untuk pembelian All New Honda Vario 160.',
        imagePath: '/images/promo.jpg',
        startsAt: '2026-10-01T00:00:00Z',
        endsAt: '2026-11-30T23:59:59Z',
        status: 'published',
        ctaLabel: null,
        ctaUrl: null,
        eligibleModelCount: 1,
      },
    ]);

    const pageResult = await PromoPage();
    render(pageResult);

    expect(
      screen.getByRole('heading', { level: 1, name: /Promo & Penawaran Spesial/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Promo Spesial Vario 160')).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === 'p' &&
          /Menampilkan.*1.*program promo aktif/i.test(element?.textContent || '')
        );
      })
    ).toBeInTheDocument();
  });

  it('renders designed empty state when zero promotions are active', async () => {
    vi.mocked(getActivePromotions).mockResolvedValue([]);

    const pageResult = await PromoPage();
    render(pageResult);

    expect(
      screen.getByRole('heading', { level: 3, name: /Belum Ada Promo Aktif/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Tanya Promo via WhatsApp/i)).toBeInTheDocument();
  });
});
