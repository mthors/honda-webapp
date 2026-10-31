import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromotionCard } from './PromotionCard';
import type { PromotionSummary } from '@/types/promotions';

describe('PromotionCard Component', () => {
  const mockPromotion: PromotionSummary = {
    id: 'promo-1',
    title: 'Promo Spesial Akhir Tahun Honda',
    slug: 'promo-akhir-tahun',
    summary: 'Dapatkan cashback hingga Rp 1.500.000 untuk pembelian motor matic.',
    imagePath: '/images/promo.jpg',
    startsAt: '2026-11-01T00:00:00Z',
    endsAt: '2026-11-30T23:59:59Z',
    status: 'published',
    ctaLabel: 'Lihat Ketentuan',
    ctaUrl: '/promo/promo-akhir-tahun',
    eligibleModelCount: 3,
  };

  it('renders promotion title, summary, dates, model count badge, and detail CTA', () => {
    render(<PromotionCard promotion={mockPromotion} />);

    expect(screen.getByText('Promo Spesial Akhir Tahun Honda')).toBeInTheDocument();
    expect(screen.getByText(/cashback hingga Rp 1.500.000/i)).toBeInTheDocument();
    expect(screen.getByText('3 Model Berlaku')).toBeInTheDocument();
    expect(screen.getByText('Promo Berjalan')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lihat Ketentuan Promo/i })).toHaveAttribute(
      'href',
      '/promo/promo-akhir-tahun'
    );
  });
});
