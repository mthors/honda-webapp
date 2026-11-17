import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminEvents,
  getPublicEvents,
  getPublicUpcomingEvents,
  getPublicEventBySlug,
} from './queries';
import * as serverSupabase from '@/lib/supabase/server';

describe('Event Queries (Consolidated with canonical dealerships)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPublicEvents queries published events only', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom };
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    await getPublicEvents();
    expect(mockFrom).toHaveBeenCalledWith('events');
    expect(mockEq).toHaveBeenCalledWith('status', 'published');
  });

  it('getAdminEvents queries all events ordered by start_at descending', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom };
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    await getAdminEvents();
    expect(mockFrom).toHaveBeenCalledWith('events');
    expect(mockOrder).toHaveBeenCalledWith('start_at', { ascending: false });
  });

  it('getPublicUpcomingEvents queries published events with end_at >= now', async () => {
    const mockLimit = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockGte = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom };
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    await getPublicUpcomingEvents(undefined, 5);
    expect(mockFrom).toHaveBeenCalledWith('events');
    expect(mockEq).toHaveBeenCalledWith('status', 'published');
    expect(mockLimit).toHaveBeenCalledWith(5);
  });

  it('getPublicEventBySlug queries event by slug and status = published', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'e1',
        title: 'Honda Riding Experience Sidoarjo',
        slug: 'honda-riding-experience-sidoarjo',
        description: 'Test ride',
        dealership_id: 'd-1',
        start_at: '2026-11-20T02:00:00Z',
        end_at: '2026-11-20T08:00:00Z',
        image_url: null,
        status: 'published',
        created_at: '2026-11-17T00:00:00Z',
        updated_at: '2026-11-17T00:00:00Z',
        dealerships: {
          id: 'd-1',
          name: 'Showroom Sidoarjo Pusat',
          address: 'Jl. Raya Sidoarjo No. 123',
          city: 'Sidoarjo',
          phone: '(031) 894-1234',
          is_active: true,
          created_at: '2026-11-17T00:00:00Z',
          updated_at: '2026-11-17T00:00:00Z',
        },
      },
      error: null,
    });
    const mockEqStatus = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockEqSlug = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqSlug });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabase = { from: mockFrom };
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
    );

    const event = await getPublicEventBySlug('honda-riding-experience-sidoarjo');
    expect(mockEqSlug).toHaveBeenCalledWith('slug', 'honda-riding-experience-sidoarjo');
    expect(mockEqStatus).toHaveBeenCalledWith('status', 'published');
    expect(event?.title).toBe('Honda Riding Experience Sidoarjo');
    expect(event?.dealershipId).toBe('d-1');
    expect(event?.dealership?.name).toBe('Showroom Sidoarjo Pusat');
  });
});
