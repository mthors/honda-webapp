import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAdminAction } from './logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

vi.mock('@/lib/auth/admin', () => ({
  getAuthenticatedAdmin: vi.fn(),
}));

import { getAuthenticatedAdmin } from '@/lib/auth/admin';

describe('Audit Logger - logAdminAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    action: 'create_price_entry',
    entityType: 'price_entries',
    entityId: '77777777-7777-4777-8777-777777777701',
    summary: 'Menambahkan harga OTR baru untuk Vario 160 CBS Sidoarjo',
    metadata: { amountIdr: 27500000, city: 'Sidoarjo' },
  };

  it('successfully logs an action using the authenticated admin identity', async () => {
    const mockAdminSession = {
      user: { id: 'admin-user-uuid-1', email: 'admin@satryagroup.co.id' },
      profile: {
        userId: 'admin-user-uuid-1',
        displayName: 'Super Admin',
        role: 'admin',
        isActive: true,
      },
    };

    (getAuthenticatedAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminSession
    );

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'audit-log-uuid-123' },
          error: null,
        }),
      }),
    });

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await logAdminAction(validPayload, mockSupabase);

    expect(result.success).toBe(true);
    expect(result.logId).toBe('audit-log-uuid-123');

    // Verify actor_id strictly originates from authenticated admin session
    expect(mockInsert).toHaveBeenCalledWith({
      actor_id: 'admin-user-uuid-1',
      action: 'create_price_entry',
      entity_type: 'price_entries',
      entity_id: '77777777-7777-4777-8777-777777777701',
      summary: 'Menambahkan harga OTR baru untuk Vario 160 CBS Sidoarjo',
      metadata: { amountIdr: 27500000, city: 'Sidoarjo' },
    });
  });

  it('rejects execution and throws error when session is not an active admin', async () => {
    (getAuthenticatedAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const mockSupabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient<Database>;

    await expect(logAdminAction(validPayload, mockSupabase)).rejects.toThrow(
      'tidak terautentikasi sebagai administrator aktif'
    );
  });

  it('validates payload and rejects malformed inputs', async () => {
    const invalidPayload = {
      action: 'c', // Too short (min 2)
      entityType: 'p', // Too short (min 2)
      summary: 'pend', // Too short (min 5)
    };

    const mockSupabase = {} as SupabaseClient<Database>;

    await expect(
      logAdminAction(invalidPayload as unknown as typeof validPayload, mockSupabase)
    ).rejects.toThrow('Validasi payload audit gagal');
  });

  it('explicitly propagates database insertion errors', async () => {
    const mockAdminSession = {
      user: { id: 'admin-user-uuid-1' },
      profile: { role: 'admin', isActive: true },
    };

    (getAuthenticatedAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockAdminSession
    );

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database RLS policy violation or disk full' },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(logAdminAction(validPayload, mockSupabase)).rejects.toThrow(
      'Gagal menyimpan audit log ke basis data: Database RLS policy violation or disk full'
    );
  });
});
