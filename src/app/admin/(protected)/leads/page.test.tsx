import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminLeadsPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as adminQueries from '@/lib/admin/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/admin/queries', () => ({
  getAdminLeads: vi.fn(),
}));

describe('AdminLeadsPage', () => {
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

    vi.mocked(adminQueries.getAdminLeads).mockResolvedValue([
      {
        id: 'lead-1',
        leadReference: 'INQ-20261103-TEST',
        fullName: 'Budi Santoso',
        whatsappNumber: '6281234567890',
        email: 'budi@satrya.id',
        city: 'Sidoarjo',
        district: 'Waru',
        modelId: 'm-1',
        variantId: 'v-1',
        colorId: 'c-1',
        modelNameSnapshot: 'All New Honda Vario 160',
        variantNameSnapshot: 'CBS',
        colorNameSnapshot: 'Grande Matte Black',
        priceSnapshotIdr: 27350000,
        message: 'Tanya stok.',
        sourcePage: '/motor/vario-160',
        sourceCampaign: null,
        consentPrivacyAt: '2026-11-03T10:00:00Z',
        status: 'new',
        createdAt: '2026-11-03T10:00:00Z',
        updatedAt: '2026-11-03T10:00:00Z',
      },
    ]);
  });

  it('protects route with requireAdmin and renders inquiry management view with real records', async () => {
    const Component = await AdminLeadsPage();
    render(Component);

    expect(authAdmin.requireAdmin).toHaveBeenCalledTimes(1);
    expect(adminQueries.getAdminLeads).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Pengelolaan Inquiry Prospek')).toBeInTheDocument();
    expect(screen.getByText('INQ-20261103-TEST')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
  });
});
