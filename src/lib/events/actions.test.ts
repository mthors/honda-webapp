import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEventAction,
  updateEventAction,
  toggleEventPublishAction,
  deleteEventAction,
} from './actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import * as auditLogger from '@/lib/audit/logger';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Event Management Actions', () => {
  const mockAdminSession = {
    user: { id: 'admin-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  const sampleLocation = {
    id: 'c1111111-1111-4111-a111-111111111111',
    name: 'Demo Dealer – Sidoarjo',
    city: 'Sidoarjo',
    address: 'Jl. Raya Sidoarjo No. 123',
    phone: '(031) 894-1234',
    is_active: true,
    created_at: '2026-11-17T08:00:00.000Z',
    updated_at: '2026-11-17T08:00:00.000Z',
  };

  const sampleEventRow = {
    id: 'e1111111-1111-4111-a111-111111111111',
    title: 'Honda Riding Experience Sidoarjo',
    slug: 'honda-riding-experience-sidoarjo',
    description: 'Uji kendara motor Honda terbaru bersama instruktur profesional.',
    location_id: 'c1111111-1111-4111-a111-111111111111',
    start_at: '2026-11-20T02:00:00.000Z',
    end_at: '2026-11-20T08:00:00.000Z',
    image_url: 'events/poster-1.webp',
    status: 'draft',
    created_at: '2026-11-17T08:00:00.000Z',
    updated_at: '2026-11-17T08:00:00.000Z',
    dealer_locations: sampleLocation,
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

  it('rejects event creation when end timestamp is earlier than or equal to start timestamp', async () => {
    const res = await createEventAction({
      title: 'Uji Coba Motor',
      slug: 'uji-coba-motor',
      description: 'Deskripsi pengujian motor Honda di sirkuit mini.',
      locationId: 'c1111111-1111-4111-a111-111111111111',
      startAt: '2026-11-20T10:00:00.000Z',
      endAt: '2026-11-20T08:00:00.000Z', // Invalid: end < start
      status: 'draft',
    });

    expect(res.success).toBe(false);
    expect(res.fieldErrors?.endAt).toBeDefined();
    expect(res.fieldErrors?.endAt?.[0]).toContain('harus lebih lambat');
  });

  it('rejects event creation when referenced dealership location is inactive', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'dealer_locations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { ...sampleLocation, is_active: false },
                  error: null,
                }),
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

    const res = await createEventAction({
      title: 'Uji Coba Motor',
      slug: 'uji-coba-motor',
      description: 'Deskripsi pengujian motor Honda di sirkuit mini.',
      locationId: 'c1111111-1111-4111-a111-111111111111',
      startAt: '2026-11-20T02:00:00.000Z',
      endAt: '2026-11-20T08:00:00.000Z',
      status: 'draft',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('sedang tidak aktif');
  });

  it('successfully creates an event and records audit log', async () => {
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'dealer_locations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: sampleLocation,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null, // No slug conflict
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: sampleEventRow,
                  error: null,
                }),
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

    const res = await createEventAction({
      title: 'Honda Riding Experience Sidoarjo',
      slug: 'honda-riding-experience-sidoarjo',
      description: 'Uji kendara motor Honda terbaru bersama instruktur profesional.',
      locationId: 'c1111111-1111-4111-a111-111111111111',
      startAt: '2026-11-20T02:00:00.000Z',
      endAt: '2026-11-20T08:00:00.000Z',
      status: 'draft',
    });

    expect(res.success).toBe(true);
    expect(res.data?.id).toBe(sampleEventRow.id);
    expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create_event',
        entityId: sampleEventRow.id,
      })
    );
  });

  it('cleans up orphaned poster in storage when updating with replacement image', async () => {
    const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'dealer_locations') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: sampleLocation,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: sampleEventRow.id, image_url: 'events/old-poster.webp' },
                  error: null,
                }),
                neq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // No slug conflict
                    error: null,
                  }),
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...sampleEventRow, image_url: 'events/new-poster.webp' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
        }),
      },
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await updateEventAction({
      id: sampleEventRow.id,
      title: 'Honda Riding Experience Sidoarjo Updated',
      slug: 'honda-riding-experience-sidoarjo',
      description: 'Uji kendara motor Honda terbaru bersama instruktur profesional.',
      locationId: 'c1111111-1111-4111-a111-111111111111',
      startAt: '2026-11-20T02:00:00.000Z',
      endAt: '2026-11-20T08:00:00.000Z',
      imageUrl: 'events/new-poster.webp',
      status: 'published',
    });

    expect(res.success).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith(['old-poster.webp']);
  });

  it('toggles event publication status', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...sampleEventRow, status: 'published' },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await toggleEventPublishAction({
      id: sampleEventRow.id,
      status: 'published',
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('published');
  });

  it('removes storage poster when deleting event', async () => {
    const mockRemove = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: sampleEventRow.id,
                title: sampleEventRow.title,
                image_url: 'events/poster-1.webp',
              },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      }),
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockRemove,
        }),
      },
    };

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const res = await deleteEventAction(sampleEventRow.id);

    expect(res.success).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith(['poster-1.webp']);
    expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delete_event',
        entityId: sampleEventRow.id,
      })
    );
  });

  it('rejects event operations when caller is unauthenticated or not an authorized admin', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
      new Error('NEXT_REDIRECT:/admin/login')
    );

    await expect(
      createEventAction({
        title: 'Unauthorized Event',
        slug: 'unauthorized-event',
        description: 'Unauthorized attempt to create event.',
        locationId: 'c1111111-1111-4111-a111-111111111111',
        startAt: '2026-11-20T02:00:00.000Z',
        endAt: '2026-11-20T08:00:00.000Z',
        status: 'draft',
      })
    ).rejects.toThrow('NEXT_REDIRECT:/admin/login');
  });
});
