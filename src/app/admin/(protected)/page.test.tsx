import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminDashboardPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as catalogQueries from '@/lib/catalog/queries';
import * as adminQueries from '@/lib/admin/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/catalog/queries', () => ({
  getPublishedModels: vi.fn(),
}));

vi.mock('@/lib/admin/queries', () => ({
  getAdminPriceEntries: vi.fn(),
  getAdminPromotions: vi.fn(),
  getAdminHeroBanners: vi.fn(),
  getAdminNewInquiriesCount: vi.fn(),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authAdmin.requireAdmin).mockResolvedValue({
      user: { id: 'admin-user-1', email: 'admin@satrya.id' } as unknown as User,
      profile: {
        userId: 'admin-user-1',
        displayName: 'Budi Santoso',
        role: 'admin',
        isActive: true,
      },
    });

    vi.mocked(catalogQueries.getPublishedModels).mockResolvedValue([
      {
        id: 'm-1',
        name: 'All New Honda Vario 160',
        slug: 'vario-160',
        shortDescription: 'Skutik premium sporty',
        engineCc: 160,
        transmission: 'Otomatis',
        isFeatured: true,
        isNew: false,
        category: { id: 'c-1', name: 'Matic', slug: 'matic' },
        primaryImage: null,
        startingPriceIdr: 27350000,
      },
      {
        id: 'm-2',
        name: 'Honda Beat Street',
        slug: 'beat-street',
        shortDescription: 'Skutik lincah',
        engineCc: 110,
        transmission: 'Otomatis',
        isFeatured: false,
        isNew: true,
        category: { id: 'c-1', name: 'Matic', slug: 'matic' },
        primaryImage: null,
        startingPriceIdr: 19500000,
      },
    ]);

    vi.mocked(adminQueries.getAdminPriceEntries).mockResolvedValue([
      {
        id: 'p-1',
        variantId: 'v-1',
        variantName: 'CBS',
        variantCode: 'VARIO-CBS',
        modelId: 'm-1',
        modelName: 'All New Honda Vario 160',
        modelSlug: 'vario-160',
        city: 'Sidoarjo',
        priceType: 'otr',
        amountIdr: 27350000,
        validFrom: '2026-01-01',
        validUntil: null,
        isPublished: true,
        sourceNote: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 'p-2',
        variantId: 'v-2',
        variantName: 'Street',
        variantCode: 'BEAT-STREET',
        modelId: 'm-2',
        modelName: 'Honda Beat Street',
        modelSlug: 'beat-street',
        city: 'Surabaya',
        priceType: 'otr',
        amountIdr: 19500000,
        validFrom: '2026-01-01',
        validUntil: null,
        isPublished: false, // Draft price
        sourceNote: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-11-02T11:00:00Z',
      },
    ]);

    vi.mocked(adminQueries.getAdminPromotions).mockResolvedValue([
      {
        id: 'promo-1',
        title: 'Promo Spesial Vario Cashback',
        slug: 'promo-spesial-vario',
        summary: 'Cashback Rp 1.000.000',
        details: null,
        imagePath: null,
        startsAt: '2026-10-01T00:00:00Z',
        endsAt: '2026-12-31T23:59:59Z', // Active promo
        terms: null,
        status: 'published',
        ctaLabel: null,
        ctaUrl: null,
        linkedModels: [{ id: 'm-1', name: 'All New Honda Vario 160', slug: 'vario-160' }],
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-15T09:00:00Z',
      },
    ]);

    vi.mocked(adminQueries.getAdminHeroBanners).mockResolvedValue([
      {
        id: 'banner-1',
        title: 'Spanduk Promo Akhir Tahun',
        subtitle: 'Dapatkan diskon menarik',
        desktopImagePath: '/b1.webp',
        mobileImagePath: null,
        altText: 'Promo Akhir Tahun',
        ctaLabel: 'Lihat Promo',
        ctaUrl: '/promo',
        startsAt: null,
        endsAt: null,
        sortOrder: 1,
        status: 'published',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-20T08:00:00Z',
      },
    ]);

    vi.mocked(adminQueries.getAdminNewInquiriesCount).mockResolvedValue(8);
  });

  it('renders friendly Indonesian greeting with administrator display name', async () => {
    const Component = await AdminDashboardPage();
    render(Component);

    expect(screen.getByText(/Selamat datang, Budi Santoso/i)).toBeInTheDocument();
    expect(screen.getByText(/Ringkasan aktivitas showroom/i)).toBeInTheDocument();
  });

  it('displays the 4 responsive summary cards with accurate database counts', async () => {
    const Component = await AdminDashboardPage();
    render(Component);

    // Published models count = 2
    expect(screen.getByText('Model Motor')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Active prices count = 1, Active promos count = 1
    expect(screen.getByText('Harga Aktif')).toBeInTheDocument();
    expect(screen.getByText('Promo Aktif')).toBeInTheDocument();
    const countOnes = screen.getAllByText('1');
    expect(countOnes.length).toBeGreaterThanOrEqual(2);

    // New inquiries count = 8
    expect(screen.getByText('Inquiry Baru')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('provides quick action navigation shortcuts linking to existing valid admin routes', async () => {
    const Component = await AdminDashboardPage();
    render(Component);

    // Verify Quick Actions header
    expect(screen.getByRole('heading', { name: 'Aksi Cepat' })).toBeInTheDocument();

    // Check truthful admin workflow links
    const priceLink = screen.getByRole('link', { name: /Kelola Harga OTR/i });
    expect(priceLink).toHaveAttribute('href', '/admin/harga');

    const promoLink = screen.getByRole('link', { name: /Kelola Promosi/i });
    expect(promoLink).toHaveAttribute('href', '/admin/promo');

    const bannerLink = screen.getByRole('link', { name: /Kelola Spanduk Hero/i });
    expect(bannerLink).toHaveAttribute('href', '/admin/banner');

    // Check public showroom preview links
    expect(screen.getByRole('link', { name: 'Katalog' })).toHaveAttribute('href', '/motor');
    expect(screen.getByRole('link', { name: 'Daftar Harga' })).toHaveAttribute('href', '/harga');
    expect(screen.getByRole('link', { name: 'Promo' })).toHaveAttribute('href', '/promo');
  });

  it('displays actionable items in Needs Attention section for models without active prices and draft content', async () => {
    const Component = await AdminDashboardPage();
    render(Component);

    expect(screen.getByRole('heading', { name: 'Perlu Perhatian' })).toBeInTheDocument();

    // m-2 (Beat Street) has no active published price
    expect(screen.getByText('Model Motor Tanpa Harga')).toBeInTheDocument();
    const beatStreetElements = screen.getAllByText(/Honda Beat Street/i);
    expect(beatStreetElements.length).toBeGreaterThanOrEqual(1);

    // 1 draft price entry (p-2)
    expect(screen.getByText('Konten Draf Belum Terbit')).toBeInTheDocument();
    expect(screen.getByText(/1 entri harga belum dipublikasikan/i)).toBeInTheDocument();
  });

  it('renders recent activity table populated from real database updates', async () => {
    const Component = await AdminDashboardPage();
    render(Component);

    expect(screen.getByRole('heading', { name: 'Pembaruan Terkini' })).toBeInTheDocument();
    expect(screen.getByText(/All New Honda Vario 160 \(CBS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Promo Spesial Vario Cashback/i)).toBeInTheDocument();
  });

  it('does not contain developer-facing technical jargon', async () => {
    const Component = await AdminDashboardPage();
    render(Component);

    const content = document.body.textContent || '';
    expect(content).not.toMatch(/\bM4\b/);
    expect(content).not.toMatch(/Milestone 4/i);
    expect(content).not.toMatch(/\bRLS\b/);
    expect(content).not.toMatch(/Row Level Security/i);
    expect(content).not.toMatch(/staff_profiles/i);
    expect(content).not.toMatch(/audit transaksional atomic/i);
  });
});
