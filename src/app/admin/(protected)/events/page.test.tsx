import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminEventsPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as eventQueries from '@/lib/events/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/events/queries', () => ({
  getAdminEvents: vi.fn(),
  getActiveDealerLocations: vi.fn(),
}));

describe('AdminEventsPage', () => {
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

    vi.mocked(eventQueries.getAdminEvents).mockResolvedValue([]);
    vi.mocked(eventQueries.getActiveDealerLocations).mockResolvedValue([]);
  });

  it('enforces requireAdmin and renders EventManagementView', async () => {
    const jsx = await AdminEventsPage();
    render(jsx);

    expect(authAdmin.requireAdmin).toHaveBeenCalled();
    expect(eventQueries.getAdminEvents).toHaveBeenCalled();
    expect(eventQueries.getActiveDealerLocations).toHaveBeenCalled();
    expect(screen.getByText('Manajemen Acara')).toBeInTheDocument();
  });
});
