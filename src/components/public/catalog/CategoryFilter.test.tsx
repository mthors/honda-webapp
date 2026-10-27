import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CategoryFilter } from './CategoryFilter';
import type { CatalogCategory } from '@/types/catalog';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/motor',
  useSearchParams: () => new URLSearchParams(),
}));

describe('CategoryFilter Component', () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  const mockCategories: CatalogCategory[] = [
    { id: '1', name: 'Matic', slug: 'matic', description: 'Skutik', sortOrder: 1 },
    { id: '2', name: 'Sport', slug: 'sport', description: 'Motor sport', sortOrder: 2 },
  ];

  it('renders all categories and category tabs', () => {
    render(<CategoryFilter categories={mockCategories} currentCategory="all" />);

    expect(screen.getByRole('tab', { name: 'Semua Kategori' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Matic' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sport' })).toBeInTheDocument();
  });

  it('calls router.push when category tab is selected', () => {
    render(<CategoryFilter categories={mockCategories} currentCategory="all" />);

    const maticTab = screen.getByRole('tab', { name: 'Matic' });
    fireEvent.click(maticTab);

    expect(pushMock).toHaveBeenCalledWith('/motor?kategori=matic', { scroll: false });
  });

  it('handles search input and submission', () => {
    render(<CategoryFilter categories={mockCategories} currentCategory="all" />);

    const searchInput = screen.getByPlaceholderText('Cari tipe atau nama motor...');
    fireEvent.change(searchInput, { target: { value: 'Vario' } });

    const searchButton = screen.getByRole('button', { name: 'Cari' });
    fireEvent.click(searchButton);

    expect(pushMock).toHaveBeenCalledWith('/motor?q=Vario', { scroll: false });
  });
});
