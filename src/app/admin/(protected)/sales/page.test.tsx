import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import AdminSalesPage from './page';
import * as authAdmin from '@/lib/auth/admin';
import * as salesQueries from '@/lib/sales/queries';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/sales/queries', () => ({
  getSalesManagementData: vi.fn(),
}));

describe('AdminSalesPage', () => {
  const mockDealership = {
    id: 'd1111111-1111-4111-a111-111111111111',
    name: 'Honda Satrya Sidoarjo',
    code: 'satrya-sda',
    city: 'Sidoarjo',
    address: null,
    phone: null,
    whatsappNumber: '6281234567890',
    openingHours: null,
    isSynthetic: false,
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-11-19T00:00:00Z',
    updatedAt: '2026-11-19T00:00:00Z',
  };

  const mockProvince = {
    id: 'jawa-timur',
    name: 'Jawa Timur',
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-11-19T00:00:00Z',
    updatedAt: '2026-11-19T00:00:00Z',
  };

  const mockRegency = {
    id: 'kab-sidoarjo',
    provinceId: 'jawa-timur',
    name: 'Sidoarjo',
    type: 'kabupaten' as const,
    sortOrder: 1,
    isActive: true,
    createdAt: '2026-11-19T00:00:00Z',
    updatedAt: '2026-11-19T00:00:00Z',
  };

  const mockSalesRep = {
    id: 'sr111111-1111-4111-a111-111111111111',
    dealershipId: 'd1111111-1111-4111-a111-111111111111',
    name: 'Budi Santoso',
    whatsappNumber: '6281234567890',
    photoUrl: null,
    position: 'Senior Sales Consultant',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-11-19T00:00:00Z',
    updatedAt: '2026-11-19T00:00:00Z',
    dealership: mockDealership,
  };

  const mockServiceArea = {
    id: 'sa111111-1111-4111-a111-111111111111',
    dealershipId: 'd1111111-1111-4111-a111-111111111111',
    regencyId: 'kab-sidoarjo',
    isActive: true,
    createdAt: '2026-11-19T00:00:00Z',
    updatedAt: '2026-11-19T00:00:00Z',
    dealership: mockDealership,
    regency: mockRegency,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authAdmin.requireAdmin).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@satrya.id' } as unknown as User,
      profile: {
        userId: 'admin-1',
        displayName: 'Ahmad Admin',
        role: 'admin',
        isActive: true,
      },
    });

    vi.mocked(salesQueries.getSalesManagementData).mockResolvedValue({
      dealerships: [mockDealership],
      provinces: [mockProvince],
      regencies: [mockRegency],
      serviceAreas: [mockServiceArea],
      salesReps: [mockSalesRep],
    });
  });

  it('enforces requireAdmin guard server-side and renders sales management console', async () => {
    const jsx = await AdminSalesPage();
    render(jsx);

    expect(authAdmin.requireAdmin).toHaveBeenCalledTimes(1);
    expect(salesQueries.getSalesManagementData).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Manajemen Sales & Wilayah Layanan')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Senior Sales Consultant')).toBeInTheDocument();
  });
});
