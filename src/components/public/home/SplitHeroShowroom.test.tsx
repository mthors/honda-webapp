import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SplitHeroShowroom } from './SplitHeroShowroom';
import type { CatalogCategory, CatalogModelSummary } from '@/types/catalog';

// Mock next/navigation useRouter for FloatingHeroFilter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('SplitHeroShowroom Component (Catalog-Driven Showcase with Refined Timing)', () => {
  const mockCategories: CatalogCategory[] = [
    { id: 'cat-1', name: 'Matic', slug: 'matic', description: 'Skutik', sortOrder: 1 },
    { id: 'cat-2', name: 'Sport', slug: 'sport', description: 'Sport', sortOrder: 2 },
  ];

  const mockModels: CatalogModelSummary[] = [
    {
      id: 'model-1',
      name: 'Vario 160',
      slug: 'vario-160',
      shortDescription: 'Skutik premium 160cc.',
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
      shortDescription: 'Motor sport agresif.',
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

  const mockImageSizes = {
    'vario-160.webp': 150000, // > 100 KB
    'cbr150-r.webp': 180000, // > 100 KB
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders catalog-driven showroom slides with discrete navigation controls', () => {
    render(
      <SplitHeroShowroom
        categories={mockCategories}
        models={mockModels}
        imageSizes={mockImageSizes}
      />
    );

    // Initial slide model name
    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide berikutnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Slide sebelumnya' })).toBeInTheDocument();

    // Does NOT render promotional banner's progress bar (keeps carousels independent)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('advances automatically after the refined 5.5s autoplay interval', () => {
    render(
      <SplitHeroShowroom
        categories={mockCategories}
        models={mockModels}
        imageSizes={mockImageSizes}
      />
    );

    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();

    // Advance 5500ms (refined 5–6s range)
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    expect(screen.getByText('Honda CBR150 R')).toBeInTheDocument();
  });

  it('loops back to the first model smoothly', () => {
    render(
      <SplitHeroShowroom
        categories={mockCategories}
        models={mockModels}
        imageSizes={mockImageSizes}
      />
    );

    // Advance to second slide
    act(() => {
      vi.advanceTimersByTime(5500);
    });
    expect(screen.getByText('Honda CBR150 R')).toBeInTheDocument();

    // Advance again to hit clone boundary
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    // Advance safety transition end timeout (650ms)
    act(() => {
      vi.advanceTimersByTime(650);
    });

    // Loops back to first slide
    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();
  });

  it('pauses autoplay when hovering over the showroom hero and resumes on mouse leave', () => {
    render(
      <SplitHeroShowroom
        categories={mockCategories}
        models={mockModels}
        imageSizes={mockImageSizes}
      />
    );

    const section = screen.getByRole('region', { name: 'Hero Showroom Honda' });

    // Hover
    act(() => {
      fireEvent.mouseEnter(section);
    });

    // Advance 11s while hovered
    act(() => {
      vi.advanceTimersByTime(11000);
    });

    // Remains on first model
    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();

    // Mouse leave
    act(() => {
      fireEvent.mouseLeave(section);
    });

    // Advance 5.5s
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    // Advances to second model
    expect(screen.getByText('Honda CBR150 R')).toBeInTheDocument();
  });

  it('supports manual navigation and transitions smoothly', () => {
    render(
      <SplitHeroShowroom
        categories={mockCategories}
        models={mockModels}
        imageSizes={mockImageSizes}
      />
    );

    const nextBtn = screen.getByRole('button', { name: 'Slide berikutnya' });
    const prevBtn = screen.getByRole('button', { name: 'Slide sebelumnya' });

    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();

    // Manual Next
    act(() => {
      fireEvent.click(nextBtn);
      vi.advanceTimersByTime(650);
    });
    expect(screen.getByText('Honda CBR150 R')).toBeInTheDocument();

    // Manual Prev
    act(() => {
      fireEvent.click(prevBtn);
      vi.advanceTimersByTime(650);
    });
    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();
  });
});
