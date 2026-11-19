import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSalesRepresentativeAction,
  updateSalesRepresentativeAction,
  toggleSalesRepresentativeActiveAction,
  deleteSalesRepresentativeAction,
  createServiceAreaAction,
  batchAssignServiceAreasAction,
  toggleServiceAreaActiveAction,
  deleteServiceAreaAction,
} from './actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import * as auditLogger from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

type MockSupabaseClient = Awaited<ReturnType<typeof serverSupabase.createClient>>;

describe('Sales Management Actions', () => {
  const mockAdminSession = {
    user: { id: 'admin-uuid-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-uuid-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  const sampleSalesRepRow = {
    id: 'a1111111-1111-4111-a111-111111111111',
    dealership_id: 'd1111111-1111-4111-a111-111111111111',
    name: 'Andi Pratama',
    whatsapp_number: '6281234567890',
    photo_url: 'andi-photo.webp',
    position: 'Senior Sales Consultant',
    is_active: true,
    sort_order: 1,
    created_at: '2026-11-19T08:00:00.000Z',
    updated_at: '2026-11-19T08:00:00.000Z',
    dealerships: {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: 'Satrya Motor Sidoarjo',
      code: 'satrya-sda',
      city: 'Sidoarjo',
    },
  };

  const sampleServiceAreaRow = {
    id: 'b1111111-1111-4111-a111-111111111111',
    dealership_id: 'd1111111-1111-4111-a111-111111111111',
    regency_id: 'kab-sidoarjo',
    is_active: true,
    created_at: '2026-11-19T08:00:00.000Z',
    updated_at: '2026-11-19T08:00:00.000Z',
    dealerships: {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: 'Satrya Motor Sidoarjo',
      city: 'Sidoarjo',
    },
    regencies: {
      id: 'kab-sidoarjo',
      name: 'Sidoarjo',
      type: 'kabupaten',
      province_id: 'jawa-timur',
    },
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

  describe('createSalesRepresentativeAction', () => {
    it('creates a sales representative and normalizes phone number', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: sampleSalesRepRow, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      const mockClient = {
        from: vi.fn().mockReturnValue({ insert: mockInsert }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await createSalesRepresentativeAction({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        name: 'Andi Pratama',
        whatsappNumber: '081234567890',
        position: 'Senior Sales Consultant',
        photoUrl: 'andi-photo.webp',
        isActive: true,
        sortOrder: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Andi Pratama');
        expect(result.data.whatsappNumber).toBe('6281234567890');
      }
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          whatsapp_number: '6281234567890',
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/admin/sales');
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create_sales_rep',
        })
      );
    });

    it('rejects input with invalid WhatsApp number', async () => {
      const result = await createSalesRepresentativeAction({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        name: 'Andi Pratama',
        whatsappNumber: 'invalid-phone',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fieldErrors?.whatsappNumber).toBeDefined();
      }
    });

    it('handles foreign key error gracefully when dealership does not exist', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23503', message: 'violates foreign key constraint' },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      const mockClient = {
        from: vi.fn().mockReturnValue({ insert: mockInsert }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await createSalesRepresentativeAction({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        name: 'Andi Pratama',
        whatsappNumber: '081234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('tidak valid atau sudah tidak tersedia');
      }
    });
  });

  describe('updateSalesRepresentativeAction', () => {
    it('updates sales representative record and normalizes phone number', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...sampleSalesRepRow, name: 'Andi Pratama Updated' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      const mockClient = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await updateSalesRepresentativeAction({
        id: 'a1111111-1111-4111-a111-111111111111',
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        name: 'Andi Pratama Updated',
        whatsappNumber: '081234567890',
        isActive: true,
        sortOrder: 1,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Andi Pratama Updated');
      }
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Andi Pratama Updated',
          whatsapp_number: '6281234567890',
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith('/admin/sales');
    });
  });

  describe('toggleSalesRepresentativeActiveAction', () => {
    it('toggles sales representative status', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'sr-1', name: 'Andi', is_active: false },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      const mockClient = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await toggleSalesRepresentativeActiveAction('sr-1', false);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });
  });

  describe('deleteSalesRepresentativeAction', () => {
    it('deletes sales representative and removes storage photo', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'sr-1', name: 'Andi', photo_url: 'andi.webp' },
        error: null,
      });
      const mockEqSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSelect });

      const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockStorage = {
        from: vi.fn().mockReturnValue({ remove: mockRemove }),
      };

      const mockClient = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'sales_representatives') {
            return {
              select: mockSelect,
              delete: mockDelete,
            };
          }
          return {};
        }),
        storage: mockStorage,
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await deleteSalesRepresentativeAction('sr-1');
      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(['andi.webp']);
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'sr-1');
    });
  });

  describe('createServiceAreaAction', () => {
    it('creates service area mapping', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: sampleServiceAreaRow, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      const mockClient = {
        from: vi.fn().mockReturnValue({ insert: mockInsert }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await createServiceAreaAction({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        regencyId: 'kab-sidoarjo',
        isActive: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.regencyId).toBe('kab-sidoarjo');
      }
    });

    it('returns friendly Indonesian error when duplicate assignment occurs', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      const mockClient = {
        from: vi.fn().mockReturnValue({ insert: mockInsert }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await createServiceAreaAction({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        regencyId: 'kab-sidoarjo',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('sudah ditugaskan ke cabang dealer yang dipilih');
      }
    });
  });

  describe('batchAssignServiceAreasAction', () => {
    it('upserts multiple regencies for a dealership', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: [{ id: 'sa-1' }, { id: 'sa-2' }],
        error: null,
      });
      const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });

      const mockClient = {
        from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await batchAssignServiceAreasAction({
        dealershipId: 'd1111111-1111-4111-a111-111111111111',
        regencyIds: ['kab-sidoarjo', 'kota-surabaya'],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.addedCount).toBe(2);
      }
      expect(mockUpsert).toHaveBeenCalledWith(
        [
          {
            dealership_id: 'd1111111-1111-4111-a111-111111111111',
            regency_id: 'kab-sidoarjo',
            is_active: true,
          },
          {
            dealership_id: 'd1111111-1111-4111-a111-111111111111',
            regency_id: 'kota-surabaya',
            is_active: true,
          },
        ],
        { onConflict: 'dealership_id, regency_id' }
      );
    });
  });

  describe('toggleServiceAreaActiveAction', () => {
    it('toggles service area status', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'sa-1', is_active: false, dealership_id: 'd-1', regency_id: 'kab-sidoarjo' },
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      const mockClient = {
        from: vi.fn().mockReturnValue({ update: mockUpdate }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await toggleServiceAreaActiveAction('sa-1', false);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(false);
      }
    });
  });

  describe('deleteServiceAreaAction', () => {
    it('deletes service area mapping', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      const mockClient = {
        from: vi.fn().mockReturnValue({ delete: mockDelete }),
      } as unknown as MockSupabaseClient;
      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(mockClient);

      const result = await deleteServiceAreaAction('sa-1');
      expect(result.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('id', 'sa-1');
    });
  });
});
