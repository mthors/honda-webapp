import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDealerLocationAction,
  updateDealerLocationAction,
  toggleDealerLocationActiveAction,
  deleteDealerLocationAction,
} from './dealer-locations-actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import * as auditLogger from '@/lib/audit/logger';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Dealer Location Actions', () => {
  const mockAdminSession = {
    user: { id: 'admin-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  const sampleRow = {
    id: 'c1111111-1111-4111-a111-111111111111',
    name: 'Demo Dealer – Sidoarjo',
    city: 'Sidoarjo',
    address: 'Jl. Raya Sidoarjo No. 123',
    phone: '(031) 894-1234',
    is_active: true,
    created_at: '2026-11-17T08:00:00.000Z',
    updated_at: '2026-11-17T08:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(
      mockAdminSession as adminAuth.AuthenticatedAdminSession
    );

    vi.spyOn(auditLogger, 'logAdminAction').mockResolvedValue({
      success: true,
      logId: 'audit-log-uuid-1',
    });
  });

  it('fails validation when required fields are missing in createDealerLocationAction', async () => {
    const res = await createDealerLocationAction({
      name: '',
      address: '',
      city: '',
      isActive: true,
    });

    expect(res.success).toBe(false);
    expect(res.fieldErrors).toBeDefined();
    expect(res.fieldErrors?.name).toBeDefined();
    expect(res.fieldErrors?.address).toBeDefined();
    expect(res.fieldErrors?.city).toBeDefined();
  });

  it('successfully creates dealer location and records audit log', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: sampleRow,
          error: null,
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await createDealerLocationAction({
      name: 'Demo Dealer – Sidoarjo',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 123',
      phone: '(031) 894-1234',
      isActive: true,
    });

    expect(res.success).toBe(true);
    expect(res.data?.id).toBe(sampleRow.id);
    expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_dealer_location',
        entityId: sampleRow.id,
      })
    );
  });

  it('updates an existing dealer location', async () => {
    const updatedRow = { ...sampleRow, name: 'Honda Satrya Sidoarjo Sentral' };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: updatedRow,
            error: null,
          }),
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await updateDealerLocationAction({
      id: sampleRow.id,
      name: 'Honda Satrya Sidoarjo Sentral',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 123',
      phone: '(031) 894-1234',
      isActive: true,
    });

    expect(res.success).toBe(true);
    expect(res.data?.name).toBe('Honda Satrya Sidoarjo Sentral');
  });

  it('toggles dealer location active status', async () => {
    const toggledRow = { ...sampleRow, is_active: false };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: toggledRow,
            error: null,
          }),
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await toggleDealerLocationActiveAction({
      id: sampleRow.id,
      isActive: false,
    });

    expect(res.success).toBe(true);
    expect(res.data?.isActive).toBe(false);
  });

  it('prevents destructive deletion when referenced by existing events', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 3,
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await deleteDealerLocationAction(sampleRow.id);

    expect(res.success).toBe(false);
    expect(res.error).toContain('masih digunakan oleh satu atau beberapa acara');
    expect(auditLogger.logAdminAction).not.toHaveBeenCalled();
  });

  it('allows deletion when location is not referenced by any events', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            }),
          };
        }
        if (table === 'dealer_locations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { name: sampleRow.name, city: sampleRow.city },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          };
        }
        return {};
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await deleteDealerLocationAction(sampleRow.id);

    expect(res.success).toBe(true);
    expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_dealer_location',
        entityId: sampleRow.id,
      })
    );
  });
});
