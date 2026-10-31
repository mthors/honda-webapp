import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HargaPage from './page';

vi.mock('@/lib/pricing/queries', () => ({
  getPublishedPriceList: vi.fn(),
}));

import { getPublishedPriceList } from '@/lib/pricing/queries';

describe('HargaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title, official badge, and price list table', async () => {
    vi.mocked(getPublishedPriceList).mockResolvedValue([
      {
        categoryId: 'cat-1',
        categoryName: 'Matic',
        categorySlug: 'matic',
        categorySortOrder: 1,
        items: [],
      },
    ]);

    const pageResult = await HargaPage({
      searchParams: Promise.resolve({ kota: 'Sidoarjo' }),
    });

    render(pageResult);

    expect(
      screen.getByRole('heading', { level: 1, name: /Daftar Harga OTR Sidoarjo/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Dealer Resmi Honda/i)).toBeInTheDocument();
  });
});
