import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HubungiPage, { generateMetadata } from './page';
import * as inquiryQueries from '@/lib/inquiries/queries';
import * as settingsQueries from '@/lib/settings/queries';
import type { SiteSettings, DealershipItem } from '@/types/settings';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
}));

vi.mock('@/lib/inquiries/queries', () => ({
  getInquiryModelOptions: vi.fn(),
}));

vi.mock('@/lib/settings/queries', () => ({
  getSiteSettings: vi.fn(),
  getActiveDealerships: vi.fn(),
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

  const mockActiveDealerships: DealershipItem[] = [
    {
      id: 'd-1',
      name: '[DEMO] Honda Satrya — Sidoarjo Sentral',
      code: 'demo-satrya-sidoarjo',
      city: 'Sidoarjo',
      address: null,
      phone: null,
      whatsappNumber: null,
      openingHours: null,
      isSynthetic: true,
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-11-04T00:00:00Z',
      updatedAt: '2026-11-04T00:00:00Z',
    },
    {
      id: 'd-2',
      name: 'Honda Satrya Surabaya Sentral',
      code: 'satrya-surabaya',
      city: 'Surabaya',
      address: 'Jl. Basuki Rahmat No. 45, Surabaya',
      phone: '031-5551234',
      whatsappNumber: '6281234567899',
      openingHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
      isSynthetic: false,
      isActive: true,
      sortOrder: 2,
      createdAt: '2026-11-04T00:00:00Z',
      updatedAt: '2026-11-04T00:00:00Z',
    },
  ];

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
    vi.mocked(settingsQueries.getActiveDealerships).mockResolvedValue(mockActiveDealerships);
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

    // CRITICAL: Ensure old hardcoded placeholder address is NOT rendered anywhere
    expect(
      screen.queryByText(/Jl\. Raya Sidoarjo No\. 123, Sidoarjo, Jawa Timur \(Konfirmasi Alamat\)/i)
    ).not.toBeInTheDocument();
  });

  it('renders multiple active dealerships in showroom locations section', async () => {
    const Component = await HubungiPage();
    render(Component);

    // Section title
    expect(
      screen.getByRole('heading', { level: 2, name: /Lokasi Dealer & Showroom/i })
    ).toBeInTheDocument();

    // Check active dealership names
    expect(screen.getByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).toBeInTheDocument();
    expect(screen.getByText('Honda Satrya Surabaya Sentral')).toBeInTheDocument();

    // Check verified branch details
    expect(screen.getByText('Jl. Basuki Rahmat No. 45, Surabaya')).toBeInTheDocument();
    expect(screen.getByText('Tel: 031-5551234')).toBeInTheDocument();
    expect(screen.getByText('Senin - Sabtu: 08:00 - 17:00 WIB')).toBeInTheDocument();

    // Check branch direct chat CTA
    const branchChatLink = screen.getByRole('link', { name: /Chat Cabang Surabaya/i });
    expect(branchChatLink).toHaveAttribute('href', expect.stringContaining('wa.me/6281234567899'));
  });

  it('clearly labels synthetic/demo dealerships with demo badges', async () => {
    const Component = await HubungiPage();
    render(Component);

    // First dealer is synthetic
    expect(screen.getByText('Data Demo / Sintetis')).toBeInTheDocument();
  });

  it('uses neutral fallback "Informasi belum tersedia" when showroom address or contact details are unset', async () => {
    const Component = await HubungiPage();
    render(Component);

    // First dealership has null address, openingHours, phone, whatsapp
    const unavailables = screen.getAllByText('Informasi belum tersedia');
    expect(unavailables.length).toBeGreaterThanOrEqual(3);
  });

  it('does not render inactive dealerships on public page', async () => {
    // Only active dealerships returned by getActiveDealerships
    vi.mocked(settingsQueries.getActiveDealerships).mockResolvedValueOnce([
      mockActiveDealerships[1], // only Surabaya is active
    ]);

    const Component = await HubungiPage();
    render(Component);

    expect(screen.getByText('Honda Satrya Surabaya Sentral')).toBeInTheDocument();
    expect(screen.queryByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).not.toBeInTheDocument();
  });

  it('renders neutral empty message when no active dealerships are registered', async () => {
    vi.mocked(settingsQueries.getActiveDealerships).mockResolvedValueOnce([]);

    const Component = await HubungiPage();
    render(Component);

    expect(
      screen.getByText('Belum ada informasi lokasi showroom yang tersedia saat ini.')
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

  it('normalizes Indonesian phone numbers (08... and +62...) to 628... in group and branch WhatsApp links', async () => {
    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValueOnce({
      ...mockSettings,
      whatsappNumber: '0812-3456-7890',
    });

    vi.mocked(settingsQueries.getActiveDealerships).mockResolvedValueOnce([
      {
        id: 'd-norm',
        name: 'Honda Satrya Malang',
        code: 'satrya-malang',
        city: 'Malang',
        address: 'Jl. Ijen No. 10',
        phone: '0341-123456',
        whatsappNumber: '+62 821-9988-7766',
        openingHours: '08:00 - 17:00',
        isSynthetic: false,
        isActive: true,
        sortOrder: 1,
        createdAt: '2026-11-04T00:00:00Z',
        updatedAt: '2026-11-04T00:00:00Z',
      },
    ]);

    const Component = await HubungiPage();
    render(Component);

    // Group WhatsApp link: 0812-3456-7890 -> wa.me/6281234567890
    const groupWaLink = screen.getByRole('link', { name: /Hubungi via WhatsApp/i });
    expect(groupWaLink).toHaveAttribute('href', expect.stringContaining('wa.me/6281234567890'));

    // Branch WhatsApp link: +62 821-9988-7766 -> wa.me/6282199887766
    const branchWaLink = screen.getByRole('link', { name: /Chat Cabang Malang/i });
    expect(branchWaLink).toHaveAttribute('href', expect.stringContaining('wa.me/6282199887766'));
  });
});
