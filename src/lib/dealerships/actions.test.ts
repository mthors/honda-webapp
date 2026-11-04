import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDealershipAction,
  updateDealershipAction,
  toggleDealershipActiveAction,
  deleteDealershipAction,
} from './actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import * as auditLogger from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Dealership Management Actions', () => {
  const mockAdminSession = {
    user: { id: 'admin-uuid-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-uuid-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  const sampleDealershipRow = {
    id: 'd1111111-1111-4111-a111-111111111111',
    name: 'Honda Satrya Sidoarjo',
    code: 'satrya-sidoarjo',
    city: 'Sidoarjo',
    address: 'Jl. Raya Sidoarjo No. 12',
    phone: '031-1234567',
    whatsapp_number: '6281234567890',
    opening_hours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
    is_synthetic: false,
    is_active: true,
    sort_order: 1,
    created_at: '2026-11-04T08:00:00.000Z',
    updated_at: '2026-11-04T08:00:00.000Z',
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

  describe('createDealershipAction', () => {
    const validCreateInput = {
      name: 'Honda Satrya Sidoarjo',
      code: 'satrya-sidoarjo',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 12',
      phone: '031-1234567',
      whatsappNumber: '6281234567890',
      openingHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
      isSynthetic: false,
      isActive: true,
      sortOrder: 1,
    };

    it('rejects mutation when user is not an authorized administrator', async () => {
      vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
        new Error('NEXT_REDIRECT:/admin/login')
      );

      await expect(createDealershipAction(validCreateInput)).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login'
      );
    });

    it('validates required fields and code format with Zod server-side', async () => {
      const result = await createDealershipAction({
        name: 'AB', // too short
        code: 'INVALID CODE with spaces!',
        city: 'S', // too short
        sortOrder: -1, // invalid negative
      } as never);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.code).toBeDefined();
      expect(result.fieldErrors?.city).toBeDefined();
      expect(result.fieldErrors?.sortOrder).toBeDefined();
    });

    it('creates dealership record successfully and writes audit log', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: sampleDealershipRow,
        error: null,
      });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      const mockFrom = vi.fn(() => ({ insert: mockInsert }));

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await createDealershipAction(validCreateInput);

      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(sampleDealershipRow.id);
      expect(res.data?.name).toBe('Honda Satrya Sidoarjo');
      expect(res.data?.isSynthetic).toBe(false);

      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create_dealership',
          entityType: 'dealership',
          entityId: sampleDealershipRow.id,
        })
      );

      expect(revalidatePath).toHaveBeenCalledWith('/admin/dealerships');
      expect(revalidatePath).toHaveBeenCalledWith('/admin/settings');
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    });

    it('handles unique code conflict with clear user guidance', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      const mockFrom = vi.fn(() => ({ insert: mockInsert }));

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await createDealershipAction(validCreateInput);

      expect(res.success).toBe(false);
      expect(res.error).toContain('sudah digunakan');
      expect(res.fieldErrors?.code).toBeDefined();
    });
  });

  describe('updateDealershipAction', () => {
    const validUpdateInput = {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: 'Honda Satrya Sidoarjo Sentral',
      code: 'satrya-sidoarjo-sentral',
      city: 'Sidoarjo',
      address: 'Jl. Ahmad Yani No. 50',
      phone: null,
      whatsappNumber: null,
      openingHours: null,
      isSynthetic: false,
      isActive: true,
      sortOrder: 2,
    };

    it('updates dealership and writes audit log', async () => {
      const updatedRow = {
        ...sampleDealershipRow,
        name: 'Honda Satrya Sidoarjo Sentral',
        code: 'satrya-sidoarjo-sentral',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: updatedRow, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockEq = vi.fn(() => ({ select: mockSelect }));
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      const mockFrom = vi.fn(() => ({ update: mockUpdate }));

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await updateDealershipAction(validUpdateInput);

      expect(res.success).toBe(true);
      expect(res.data?.name).toBe('Honda Satrya Sidoarjo Sentral');
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update_dealership',
          entityType: 'dealership',
          entityId: validUpdateInput.id,
        })
      );
    });

    it('rejects invalid uuid in update', async () => {
      const res = await updateDealershipAction({
        ...validUpdateInput,
        id: 'not-a-uuid',
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('ID dealer tidak valid');
    });
  });

  describe('toggleDealershipActiveAction', () => {
    it('updates active status and audits action', async () => {
      const deactivatedRow = { ...sampleDealershipRow, is_active: false };

      const mockSingle = vi.fn().mockResolvedValue({ data: deactivatedRow, error: null });
      const mockSelect = vi.fn(() => ({ single: mockSingle }));
      const mockEq = vi.fn(() => ({ select: mockSelect }));
      const mockUpdate = vi.fn(() => ({ eq: mockEq }));
      const mockFrom = vi.fn(() => ({ update: mockUpdate }));

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await toggleDealershipActiveAction(sampleDealershipRow.id, false);

      expect(res.success).toBe(true);
      expect(res.data?.isActive).toBe(false);
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'toggle_dealership_active',
          entityType: 'dealership',
          entityId: sampleDealershipRow.id,
        })
      );
    });
  });

  describe('deleteDealershipAction', () => {
    it('safely deletes dealership and writes audit log', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: sampleDealershipRow.id,
          name: sampleDealershipRow.name,
          code: sampleDealershipRow.code,
          is_synthetic: sampleDealershipRow.is_synthetic,
        },
        error: null,
      });
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockSingle })),
      }));
      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));
      const mockFrom = vi.fn((table: string) => {
        if (table === 'dealerships') {
          return { select: mockSelect, delete: mockDelete };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteDealershipAction(sampleDealershipRow.id);

      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(sampleDealershipRow.id);
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete_dealership',
          entityType: 'dealership',
          entityId: sampleDealershipRow.id,
        })
      );
    });

    it('returns clear error if record is not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockSingle })),
      }));
      const mockFrom = vi.fn(() => ({ select: mockSelect }));

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteDealershipAction('d9999999-9999-4999-a999-999999999999');

      expect(res.success).toBe(false);
      expect(res.error).toContain('tidak ditemukan');
    });

    it('rejects deletion with deactivation advice on foreign key constraint error', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: sampleDealershipRow.id,
          name: sampleDealershipRow.name,
          code: sampleDealershipRow.code,
          is_synthetic: sampleDealershipRow.is_synthetic,
        },
        error: null,
      });
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({ single: mockSingle })),
      }));
      const mockDelete = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          error: { code: '23503', message: 'violates foreign key constraint' },
        }),
      }));
      const mockFrom = vi.fn(() => ({ select: mockSelect, delete: mockDelete }));

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteDealershipAction(sampleDealershipRow.id);

      expect(res.success).toBe(false);
      expect(res.error).toContain('nonaktifkan dealer sebagai gantinya');
    });
  });
});
