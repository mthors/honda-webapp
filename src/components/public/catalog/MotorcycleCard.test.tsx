import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MotorcycleCard } from './MotorcycleCard';
import type { CatalogModelSummary } from '@/types/catalog';

describe('MotorcycleCard Component', () => {
  const baseModel: CatalogModelSummary = {
    id: 'test-model-1',
    name: 'Honda Vario 160',
    slug: 'vario-160',
    category: {
      id: 'cat-1',
      name: 'Matic',
      slug: 'matic',
    },
    shortDescription: 'Skutik premium 160cc eSP+',
    engineCc: 160,
    transmission: 'Otomatis',
    isFeatured: true,
    isNew: true,
    primaryImage: {
      storagePath: '/images/motorcycle-placeholder.svg',
      altText: 'Foto Honda Vario 160',
    },
    startingPriceIdr: 27500000,
  };

  it('renders model name, category badge, and status badges', () => {
    render(<MotorcycleCard model={baseModel} />);

    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();
    expect(screen.getByText('Matic')).toBeInTheDocument();
    expect(screen.getByText('Model Baru')).toBeInTheDocument();
    expect(screen.getByText('Unggulan')).toBeInTheDocument();
  });

  it('renders engine displacement and transmission specs', () => {
    render(<MotorcycleCard model={baseModel} />);

    expect(screen.getByText(/160 cc • Otomatis/i)).toBeInTheDocument();
  });

  it('renders formatted starting price when price is available', () => {
    render(<MotorcycleCard model={baseModel} />);

    expect(screen.getByText(/Mulai dari/i)).toBeInTheDocument();
    expect(screen.getByText('Rp 27.500.000')).toBeInTheDocument();
    expect(screen.getByText('OTR Wilayah Dealer')).toBeInTheDocument();
  });

  it('renders honest disclaimer when no verified price exists', () => {
    const unpricedModel: CatalogModelSummary = {
      ...baseModel,
      startingPriceIdr: null,
    };

    render(<MotorcycleCard model={unpricedModel} />);

    expect(screen.getByText('Hubungi dealer untuk konfirmasi harga terbaru.')).toBeInTheDocument();
  });

  it('renders detail page destination link', () => {
    render(<MotorcycleCard model={baseModel} />);

    const link = screen.getByRole('link', { name: /Lihat Detail/i });
    expect(link).toHaveAttribute('href', '/motor/vario-160');
  });
});
