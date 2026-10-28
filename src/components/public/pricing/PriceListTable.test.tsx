import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceListTable } from './PriceListTable';
import type { CategoryPriceGroup } from '@/types/pricing';

describe('PriceListTable Component', () => {
  const mockGroups: CategoryPriceGroup[] = [
    {
      categoryId: 'cat-1',
      categoryName: 'Matic',
      categorySlug: 'matic',
      categorySortOrder: 1,
      items: [
        {
          modelId: 'm-1',
          modelName: 'All New Honda Vario 160',
          modelSlug: 'vario-160',
          category: { id: 'cat-1', name: 'Matic', slug: 'matic' },
          variantId: 'v-1',
          variantName: 'CBS',
          engineCc: 160,
          transmission: 'Otomatis',
          primaryImage: { storagePath: 'vario.png', altText: 'Vario 160' },
          activePrice: {
            id: 'p-1',
            amountIdr: 27500000,
            priceType: 'otr',
            city: 'Sidoarjo',
            validFrom: '2026-01-01',
            validUntil: null,
          },
        },
      ],
    },
  ];

  it('renders verified OTR prices grouped by category', () => {
    render(<PriceListTable groups={mockGroups} city="Sidoarjo" />);

    expect(screen.getByRole('heading', { level: 3, name: 'Matic' })).toBeInTheDocument();
    expect(screen.getAllByText('All New Honda Vario 160')[0]).toBeInTheDocument();
    expect(screen.getAllByText('CBS')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Rp 27.500.000')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/OTR Sidoarjo/i)[0]).toBeInTheDocument();
  });

  it('renders empty update state when no prices are published or all are null', () => {
    const unverifiedGroups: CategoryPriceGroup[] = [
      {
        categoryId: 'cat-1',
        categoryName: 'Matic',
        categorySlug: 'matic',
        categorySortOrder: 1,
        items: [
          {
            modelId: 'm-1',
            modelName: 'All New Honda Vario 160',
            modelSlug: 'vario-160',
            category: { id: 'cat-1', name: 'Matic', slug: 'matic' },
            variantId: 'v-1',
            variantName: 'CBS',
            engineCc: 160,
            transmission: 'Otomatis',
            primaryImage: null,
            activePrice: null, // Unpublished
          },
        ],
      },
    ];

    render(<PriceListTable groups={unverifiedGroups} city="Sidoarjo" />);

    expect(
      screen.getByRole('heading', { level: 3, name: /Daftar Harga Sedang Diselaraskan/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Tanya Harga via WhatsApp/i)).toBeInTheDocument();
  });

  it('renders official dealer disclaimer box', () => {
    render(<PriceListTable groups={mockGroups} city="Sidoarjo" />);

    expect(screen.getByText(/Kebijakan & Disclaimer Harga Dealer/i)).toBeInTheDocument();
    expect(screen.getByText(/Wilayah: Sidoarjo/i)).toBeInTheDocument();
  });
});

