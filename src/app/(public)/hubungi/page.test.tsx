import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HubungiPage, { generateMetadata } from './page';
import * as inquiryQueries from '@/lib/inquiries/queries';
import * as settingsQueries from '@/lib/settings/queries';
import type { SiteSettings } from '@/types/settings';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

vi.mock('@/lib/inquiries/queries', () => ({
  getInquiryModelOptions: vi.fn(),
}));

vi.mock('@/lib/settings/queries', () => ({
  getSiteSettings: vi.fn(),
}));

describe('HubungiPage', () => {
  const mockSettings: SiteSettings = {
    id: 'default',
    dealerName: 'Honda Satrya Dealer Group',
    logoPath: null,
    address: null,
    city: null,
    phone: null,
    whatsappNumber: '6281234567890',
    publicEmail: 'kontak@satryagroup.co.id',
    openingHours: { consultation_hours: 'Senin - Jumat: 08:30 - 16:30 WIB' },
    socialLinks: {},
    privacyNotice: 'Pemberitahuan privasi khusus grup dealer resmi.',
    updatedBy: null,
    updatedAt: '2026-11-04T00:00:00Z',
  };

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
    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValue(mockSettings);
  });

  it('renders page header, inquiry form, and configured dealer contact details', async () => {
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

    // Configured WhatsApp and Consultation Hours
    expect(screen.getByText('Layanan WhatsApp Sales')).toBeInTheDocument();
    expect(screen.getByText('+6281234567890')).toBeInTheDocument();
    expect(screen.getByText('Senin - Jumat: 08:30 - 16:30 WIB')).toBeInTheDocument();

    // Configured Email Link
    expect(screen.getByText('Layanan Email Resmi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'kontak@satryagroup.co.id' })).toHaveAttribute(
      'href',
      'mailto:kontak@satryagroup.co.id'
    );

    // Corporate disclaimer
    expect(
      screen.getByText(/bukan website resmi korporat PT Astra Honda Motor/i)
    ).toBeInTheDocument();
  });

  it('generates dynamic metadata using configured dealer name', async () => {
    const metadata = await generateMetadata();
    expect(metadata.title).toContain('Honda Satrya Dealer Group');
  });

  it('safely handles missing or empty email without rendering broken email links', async () => {
    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValueOnce({
      ...mockSettings,
      publicEmail: null,
    });

    const Component = await HubungiPage();
    render(Component);

    expect(screen.queryByText('Layanan Email Resmi')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /mailto:/i })).not.toBeInTheDocument();
  });

  it('safely handles missing WhatsApp number by disabling button and showing fallback', async () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
    delete process.env.NEXT_PUBLIC_DEALER_WHATSAPP;

    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValueOnce({
      ...mockSettings,
      whatsappNumber: '',
    });

    const Component = await HubungiPage();
    render(Component);

    expect(screen.getAllByText('Nomor Belum Dikonfigurasi').length).toBeGreaterThanOrEqual(1);

    process.env.NEXT_PUBLIC_DEALER_WHATSAPP = originalEnv;
  });
});
