import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminSettingsPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as settingsQueries from '@/lib/settings/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/settings/queries', () => ({
  getSiteSettings: vi.fn(),
  getDealerships: vi.fn(),
}));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authAdmin.requireAdmin).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@satrya.id' } as unknown as User,
      profile: {
        userId: 'admin-1',
        displayName: 'Budi Santoso',
        role: 'admin',
        isActive: true,
      },
    });

    vi.mocked(settingsQueries.getSiteSettings).mockResolvedValue({
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281234567890',
      publicEmail: 'info@satryagroup.co.id',
      openingHours: { consultation_hours: 'Senin - Sabtu: 08:00 - 17:00 WIB' },
      socialLinks: { instagram: 'https://instagram.com/hondasatryagroup' },
      privacyNotice: 'Kebijakan Privasi resmi grup dealer.',
      updatedBy: 'admin-1',
      updatedAt: '2026-11-04T08:00:00Z',
    });

    vi.mocked(settingsQueries.getDealerships).mockResolvedValue([
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
        createdAt: '2026-11-04T08:00:00Z',
        updatedAt: '2026-11-04T08:00:00Z',
      },
    ]);
  });

  it('protects route with requireAdmin and renders group settings and dealership list', async () => {
    const Component = await AdminSettingsPage();
    render(Component);

    expect(authAdmin.requireAdmin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: /Pengaturan Grup Dealer/i })).toBeDefined();

    // Verify group inputs
    expect(screen.getByLabelText(/Nama Grup Dealer/i)).toHaveValue('Honda Satrya Dealer Group');
    expect(screen.getByLabelText(/Nomor WhatsApp Sentral/i)).toHaveValue('6281234567890');

    // Verify dealership record table shows synthetic dealership
    expect(screen.getByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).toBeDefined();
    expect(screen.getByText('Demo Sintetis')).toBeDefined();
  });
});

