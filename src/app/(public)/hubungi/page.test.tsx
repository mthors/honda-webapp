import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HubungiPage from './page';
import * as inquiryQueries from '@/lib/inquiries/queries';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

vi.mock('@/lib/inquiries/queries', () => ({
  getInquiryModelOptions: vi.fn(),
}));

describe('HubungiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inquiryQueries.getInquiryModelOptions).mockResolvedValue([
      {
        id: 'm-1',
        name: 'All New Honda Vario 160',
        slug: 'vario-160',
        variants: [
          {
            id: 'v-1',
            name: 'CBS',
            code: 'VARIO-CBS',
            priceIdr: 27350000,
            colors: [{ id: 'c-1', name: 'Grande Matte Black', hexCode: '#000000' }],
          },
        ],
      },
    ]);
  });

  it('renders page header, inquiry form, and dealer showroom details', async () => {
    const Component = await HubungiPage();
    render(Component);

    // Header & badge
    expect(screen.getByText('Layanan Pelanggan')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /Hubungi Dealer Kami/i })
    ).toBeInTheDocument();

    // Form Section
    expect(screen.getByText('Konsultasi Pembelian')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Lengkap/i)).toBeInTheDocument();

    // Direct WhatsApp and Showroom Info
    expect(screen.getByText('Layanan WhatsApp Sales')).toBeInTheDocument();
    expect(screen.getByText('Lokasi Dealer & Showroom')).toBeInTheDocument();
    expect(
      screen.getByText(/bukan website resmi korporat PT Astra Honda Motor/i)
    ).toBeInTheDocument();
  });
});
