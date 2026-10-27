import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MotorCatalogPage from './page';
import * as catalogQueries from '@/lib/catalog/queries';

vi.mock('@/lib/catalog/queries', () => ({
  getActiveCategories: vi.fn(),
  getPublishedModels: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/motor',
  useSearchParams: () => new URLSearchParams(),
}));

describe('MotorCatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header and motorcycle cards when models exist', async () => {
    vi.mocked(catalogQueries.getActiveCategories).mockResolvedValue([
      { id: '1', name: 'Matic', slug: 'matic', description: null, sortOrder: 1 },
    ]);

    vi.mocked(catalogQueries.getPublishedModels).mockResolvedValue([
      {
        id: 'model-1',
        name: 'Honda Vario 160',
        slug: 'vario-160',
        category: { id: '1', name: 'Matic', slug: 'matic' },
        shortDescription: 'Skutik 160cc',
        engineCc: 160,
        transmission: 'Otomatis',
        isFeatured: true,
        isNew: false,
        primaryImage: null,
        startingPriceIdr: 27500000,
      },
    ]);

    const pageResult = await MotorCatalogPage({
      searchParams: Promise.resolve({ kategori: 'matic' }),
    });

    render(pageResult);

    expect(screen.getByText('Katalog Sepeda Motor Honda')).toBeInTheDocument();
    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();
    expect(screen.getByText(/Menampilkan/i)).toBeInTheDocument();
  });

  it('renders empty state when no models match the query', async () => {
    vi.mocked(catalogQueries.getActiveCategories).mockResolvedValue([]);
    vi.mocked(catalogQueries.getPublishedModels).mockResolvedValue([]);

    const pageResult = await MotorCatalogPage({
      searchParams: Promise.resolve({ q: 'NonExistentBike' }),
    });

    render(pageResult);

    expect(screen.getByText('Unit Tidak Ditemukan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Atur Ulang Filter' })).toHaveAttribute(
      'href',
      '/motor'
    );
  });
});
