import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminDealerLocationsPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as eventQueries from '@/lib/events/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/events/queries', () => ({
  getAdminDealerLocations: vi.fn(),
}));

describe('AdminDealerLocationsPage', () => {
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

    vi.mocked(eventQueries.getAdminDealerLocations).mockResolvedValue([]);
  });

  it('enforces requireAdmin and renders DealerLocationManagementView', async () => {
    const jsx = await AdminDealerLocationsPage();
    render(jsx);

    expect(authAdmin.requireAdmin).toHaveBeenCalled();
    expect(eventQueries.getAdminDealerLocations).toHaveBeenCalled();
    expect(screen.getByText('Lokasi Dealer Acara')).toBeInTheDocument();
  });
});
