import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminDealershipsPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as settingsQueries from '@/lib/settings/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/settings/queries', () => ({
  getDealerships: vi.fn(),
}));

describe('AdminDealershipsPage', () => {
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

  it('enforces requireAdmin guard server-side', async () => {
    const jsx = await AdminDealershipsPage();
    render(jsx);

    expect(authAdmin.requireAdmin).toHaveBeenCalledTimes(1);
    expect(settingsQueries.getDealerships).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Kelola Jaringan Dealer')).toBeInTheDocument();
    expect(screen.getByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).toBeInTheDocument();
  });
});
