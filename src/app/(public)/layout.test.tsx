import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicLayout from './layout';
import * as settingsQueries from '@/lib/settings/queries';
import * as eventsQueries from '@/lib/events/queries';
import * as salesQueries from '@/lib/sales/queries';

vi.mock('@/lib/settings/queries');
vi.mock('@/lib/events/queries');
vi.mock('@/lib/sales/queries');
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('PublicLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValue({
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281234567890',
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-01-01T00:00:00Z',
    });
    vi.mocked(eventsQueries.getPublicEvents).mockResolvedValue([]);
    vi.mocked(salesQueries.getActiveProvinces).mockResolvedValue([
      {
        id: 'jawa-timur',
        name: 'Jawa Timur',
        sortOrder: 1,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);
    vi.mocked(salesQueries.getActiveRegencies).mockResolvedValue([
      {
        id: 'kab-sidoarjo',
        provinceId: 'jawa-timur',
        name: 'Sidoarjo',
        type: 'kabupaten',
        sortOrder: 1,
        isActive: true,
        createdAt: '',
        updatedAt: '',
      },
    ]);
  });

  it('renders PublicHeader, children content, PublicFooter, FloatingEventWidget, and FirstVisitLocationModal', async () => {
    const layoutJsx = await PublicLayout({
      children: <div data-testid="page-child">Konten Halaman</div>,
    });
    render(layoutJsx);

    expect(screen.getByTestId('page-child')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navigasi Utama' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buka Agenda Kegiatan/i })).toBeInTheDocument();
    // Modal opens on first visit
    expect(screen.getByText('Pilih Wilayah Domisili Anda')).toBeInTheDocument();
  });
});
