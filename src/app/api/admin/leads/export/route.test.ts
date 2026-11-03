import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { GET } from './route';
import * as authAdmin from '@/lib/auth/admin';
import * as adminQueries from '@/lib/admin/queries';

vi.mock('@/lib/auth/admin', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

vi.mock('@/lib/admin/queries', () => ({
  getAdminLeads: vi.fn(),
}));

describe('GET /api/admin/leads/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated or non-admin requests with 401 Unauthorized', async () => {
    vi.mocked(authAdmin.getAuthenticatedAdmin).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/admin/leads/export');
    const response = await GET(req);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Akses tidak diizinkan');
  });

  it('allows authorized administrators and returns genuine .xlsx binary download', async () => {
    vi.mocked(authAdmin.getAuthenticatedAdmin).mockResolvedValue({
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
        leadReference: 'INQ-20261103-X1Y2',
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
        message: 'Info promo.',
        sourcePage: '/motor/vario-160',
        sourceCampaign: null,
        consentPrivacyAt: '2026-11-03T10:00:00Z',
        status: 'new',
        createdAt: '2026-11-03T10:00:00Z',
        updatedAt: '2026-11-03T10:00:00Z',
      },
    ]);

    const req = new NextRequest(
      'http://localhost:3000/api/admin/leads/export?status=new&city=Sidoarjo&search=Budi'
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(response.headers.get('content-disposition')).toContain(
      'attachment; filename="inquiry-honda-satrya-'
    );

    // Verify filters were forwarded
    expect(adminQueries.getAdminLeads).toHaveBeenCalledWith({
      search: 'Budi',
      status: 'new',
      city: 'Sidoarjo',
    });

    // Verify body is binary zip / xlsx buffer
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    expect(bytes.length).toBeGreaterThan(1000);
    // PK zip signature
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
