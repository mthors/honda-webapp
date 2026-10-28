import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPublishedPriceList } from './queries';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

describe('Pricing Queries - getPublishedPriceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const catMatic = { id: 'cat-1', name: 'Matic', slug: 'matic', is_active: true, sort_order: 1 };
  const catSport = { id: 'cat-2', name: 'Sport', slug: 'sport', is_active: true, sort_order: 2 };

  it('retrieves published models with valid OTR prices grouped by category for Sidoarjo', async () => {
    const mockData = [
      {
        id: 'model-1',
        name: 'All New Honda Vario 160',
        slug: 'vario-160',
        engine_cc: 160,
        transmission: 'Otomatis',
        status: 'published',
        published_at: '2026-01-01T00:00:00Z',
        category: catMatic,
        images: [
          {
            id: 'img-1',
            storage_path: 'vario.png',
            alt_text: 'Vario 160',
            image_role: 'card',
            sort_order: 1,
          },
        ],
        variants: [
          {
            id: 'var-1',
            name: 'CBS',
            status: 'active',
            sort_order: 1,
            price_entries: [
              {
                id: 'price-1',
                city: 'Sidoarjo',
                amount_idr: 27500000,
                price_type: 'otr',
                is_published: true,
                valid_from: '2026-01-01',
                valid_until: null,
              },
            ],
          },
        ],
      },
      {
        id: 'model-2',
        name: 'Honda CB150R Streetfire',
        slug: 'cb150r-streetfire',
        engine_cc: 150,
        transmission: 'Manual',
        status: 'published',
        published_at: '2026-01-01T00:00:00Z',
        category: catSport,
        images: [],
        variants: [
          {
            id: 'var-2',
            name: 'Special Edition',
            status: 'active',
            sort_order: 1,
            price_entries: [
              {
                id: 'price-2',
                city: 'sidoarjo',
                amount_idr: 31500000,
                price_type: 'otr',
                is_published: true,
                valid_from: '2026-01-01',
                valid_until: '2026-12-31',
              },
            ],
          },
        ],
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getPublishedPriceList({ city: 'Sidoarjo' }, mockSupabase);

    expect(result).toHaveLength(2);
    // Group 1: Matic
    expect(result[0].categorySlug).toBe('matic');
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].modelName).toBe('All New Honda Vario 160');
    expect(result[0].items[0].variantName).toBe('CBS');
    expect(result[0].items[0].activePrice).not.toBeNull();
    expect(result[0].items[0].activePrice?.amountIdr).toBe(27500000);
    expect(result[0].items[0].activePrice?.city).toBe('Sidoarjo');

    // Group 2: Sport
    expect(result[1].categorySlug).toBe('sport');
    expect(result[1].items).toHaveLength(1);
    expect(result[1].items[0].activePrice?.amountIdr).toBe(31500000);
  });

  it('keeps unpublished sample prices hidden (activePrice is null)', async () => {
    const mockData = [
      {
        id: 'model-1',
        name: 'All New Honda Vario 160',
        slug: 'vario-160',
        engine_cc: 160,
        transmission: 'Otomatis',
        status: 'published',
        published_at: '2026-01-01T00:00:00Z',
        category: catMatic,
        images: [],
        variants: [
          {
            id: 'var-1',
            name: 'CBS',
            status: 'active',
            sort_order: 1,
            price_entries: [
              {
                id: 'price-unverified-1',
                city: 'Sidoarjo',
                amount_idr: 27500000,
                price_type: 'otr',
                is_published: false, // Explicitly unpublished!
                valid_from: '2026-01-01',
                valid_until: null,
              },
            ],
          },
        ],
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getPublishedPriceList({ city: 'Sidoarjo' }, mockSupabase);

    expect(result).toHaveLength(1);
    expect(result[0].items[0].activePrice).toBeNull();
  });

  it('excludes future-dated and expired price entries', async () => {
    const mockData = [
      {
        id: 'model-1',
        name: 'Vario 160',
        slug: 'vario-160',
        engine_cc: 160,
        transmission: 'Otomatis',
        status: 'published',
        published_at: null,
        category: catMatic,
        images: [],
        variants: [
          {
            id: 'var-1',
            name: 'CBS',
            status: 'active',
            sort_order: 1,
            price_entries: [
              {
                id: 'price-expired',
                city: 'Sidoarjo',
                amount_idr: 25000000,
                price_type: 'otr',
                is_published: true,
                valid_from: '2020-01-01',
                valid_until: '2020-12-31', // Expired in the past
              },
              {
                id: 'price-future',
                city: 'Sidoarjo',
                amount_idr: 29000000,
                price_type: 'otr',
                is_published: true,
                valid_from: '2099-01-01', // Future schedule
                valid_until: null,
              },
            ],
          },
        ],
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getPublishedPriceList({ city: 'Sidoarjo' }, mockSupabase);

    expect(result).toHaveLength(1);
    expect(result[0].items[0].activePrice).toBeNull();
  });

  it('filters prices strictly by the requested city', async () => {
    const mockData = [
      {
        id: 'model-1',
        name: 'Vario 160',
        slug: 'vario-160',
        engine_cc: 160,
        transmission: 'Otomatis',
        status: 'published',
        published_at: null,
        category: catMatic,
        images: [],
        variants: [
          {
            id: 'var-1',
            name: 'CBS',
            status: 'active',
            sort_order: 1,
            price_entries: [
              {
                id: 'price-surabaya',
                city: 'Surabaya',
                amount_idr: 28000000,
                price_type: 'otr',
                is_published: true,
                valid_from: '2026-01-01',
                valid_until: null,
              },
            ],
          },
        ],
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    // Request Sidoarjo; entry is for Surabaya
    const resultSidoarjo = await getPublishedPriceList({ city: 'Sidoarjo' }, mockSupabase);
    expect(resultSidoarjo[0].items[0].activePrice).toBeNull();

    // Request Surabaya; entry matches Surabaya
    const resultSurabaya = await getPublishedPriceList({ city: 'Surabaya' }, mockSupabase);
    expect(resultSurabaya[0].items[0].activePrice).not.toBeNull();
    expect(resultSurabaya[0].items[0].activePrice?.amountIdr).toBe(28000000);
  });

  it('handles database errors gracefully without leaking raw database internals', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: { message: 'relation does not exist' } }),
              }),
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await getPublishedPriceList({}, mockSupabase);
    expect(result).toEqual([]);
  });
});
