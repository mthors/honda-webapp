import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { VariantColorSelector } from './VariantColorSelector';
import type { CatalogVariant } from '@/types/catalog';

describe('VariantColorSelector Component', () => {
  const mockVariants: CatalogVariant[] = [
    {
      id: 'var-1',
      modelId: 'model-1',
      name: 'CBS',
      code: 'CBS',
      description: 'Pengereman seimbang Combi Brake System',
      sortOrder: 1,
      priceIdr: 27500000,
      colors: [
        {
          id: 'vc-1',
          colorId: 'col-1',
          name: 'Grande Matte Black',
          slug: 'grande-matte-black',
          hexCode: '#1A1A1A',
          imagePath: '/images/black.png',
          isAvailable: true,
          sortOrder: 1,
        },
        {
          id: 'vc-2',
          colorId: 'col-2',
          name: 'Active Matte Red',
          slug: 'active-matte-red',
          hexCode: '#C8102E',
          imagePath: '/images/red.png',
          isAvailable: true,
          sortOrder: 2,
        },
      ],
    },
    {
      id: 'var-2',
      modelId: 'model-1',
      name: 'ABS',
      code: 'ABS',
      description: 'Pengereman presisi Anti-lock Braking System',
      sortOrder: 2,
      priceIdr: 30500000,
      colors: [
        {
          id: 'vc-3',
          colorId: 'col-1',
          name: 'Grande Matte Black',
          slug: 'grande-matte-black',
          hexCode: '#1A1A1A',
          imagePath: '/images/black-abs.png',
          isAvailable: true,
          sortOrder: 1,
        },
      ],
    },
  ];

  it('renders initial variant, color swatches, and price', () => {
    render(
      <VariantColorSelector modelName="Vario 160" modelSlug="vario-160" variants={mockVariants} />
    );

    // Initial price should be CBS price
    expect(screen.getByText('Rp 27.500.000')).toBeInTheDocument();
    expect(screen.getByText('(CBS)')).toBeInTheDocument();

    // Radio buttons for CBS and ABS
    expect(screen.getByRole('radio', { name: 'CBS' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'ABS' })).toBeInTheDocument();

    // Color options
    expect(screen.getByLabelText(/Grande Matte Black/i)).toBeInTheDocument();
  });

  it('switches variant and updates displayed price and available colors', () => {
    const onColorImageChange = vi.fn();

    render(
      <VariantColorSelector
        modelName="Vario 160"
        modelSlug="vario-160"
        variants={mockVariants}
        onColorImageChange={onColorImageChange}
      />
    );

    const absButton = screen.getByRole('radio', { name: 'ABS' });
    fireEvent.click(absButton);

    // Price updates to ABS price
    expect(screen.getByText('Rp 30.500.000')).toBeInTheDocument();
    expect(screen.getByText('(ABS)')).toBeInTheDocument();
    expect(onColorImageChange).toHaveBeenCalledWith('/images/black-abs.png');
  });

  it('renders mandatory pricing disclaimer and CTA actions', () => {
    render(
      <VariantColorSelector
        modelName="Vario 160"
        modelSlug="vario-160"
        variants={mockVariants}
        dealerWhatsApp="08123456789"
      />
    );

    // Price disclaimer
    expect(screen.getByText(/Catatan Harga & Wilayah/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Harga OTR \(On The Road\) yang tercantum tergantung pada wilayah domisili/i)
    ).toBeInTheDocument();

    // CTAs
    const waLink = screen.getByRole('link', { name: /Tanya via WhatsApp/i });
    expect(waLink).toHaveAttribute('href');
    expect(waLink.getAttribute('href')).toContain('https://wa.me/628123456789');

    const inquiryLink = screen.getByRole('link', { name: /Kontak Showroom/i });
    expect(inquiryLink).toHaveAttribute('href');
    expect(inquiryLink.getAttribute('href')).toContain('/hubungi?model=vario-160');
  });

  it('displays disclaimer when variant has no verified price', () => {
    const unpricedVariants: CatalogVariant[] = [
      {
        ...mockVariants[0],
        priceIdr: null,
      },
    ];

    render(
      <VariantColorSelector
        modelName="Vario 160"
        modelSlug="vario-160"
        variants={unpricedVariants}
      />
    );

    expect(screen.getByText('Hubungi dealer untuk konfirmasi harga terbaru.')).toBeInTheDocument();
  });
});
