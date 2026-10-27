import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getActiveCategories, getPublishedModels, getPublishedModelBySlug } from './queries';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

describe('Catalog Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActiveCategories', () => {
    it('returns sorted active categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Matic', slug: 'matic', description: 'Skutik', sort_order: 1 },
        { id: 'cat-2', name: 'Sport', slug: 'sport', description: 'Motor sport', sort_order: 2 },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActiveCategories(mockSupabase);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Matic');
      expect(result[0].sortOrder).toBe(1);
      expect(result[1].name).toBe('Sport');
    });

    it('returns empty array gracefully on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValue({ data: null, error: { message: 'DB connection error' } }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActiveCategories(mockSupabase);
      expect(result).toEqual([]);
    });
  });

  describe('getPublishedModels', () => {
    it('retrieves published models and computes starting price from active variants', async () => {
      const mockData = [
        {
          id: 'model-1',
          name: 'Vario 160',
          slug: 'vario-160',
          short_description: 'Skutik 160cc',
          engine_cc: 160,
          transmission: 'Otomatis',
          is_featured: true,
          is_new: false,
          status: 'published',
          published_at: '2026-01-01T00:00:00Z',
          category: { id: 'cat-1', name: 'Matic', slug: 'matic', is_active: true },
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
                  amount_idr: 27500000,
                  price_type: 'otr',
                  is_published: true,
                  valid_from: '2026-01-01',
                  valid_until: null,
                },
              ],
            },
            {
              id: 'var-2',
              name: 'ABS',
              status: 'active',
              sort_order: 2,
              price_entries: [
                {
                  id: 'price-2',
                  amount_idr: 30500000,
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

      const orderMock = vi.fn();
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: orderMock,
      };

      // Mock chain of 3 order calls
      orderMock.mockReturnValueOnce(mockQueryBuilder);
      orderMock.mockReturnValueOnce(mockQueryBuilder);
      orderMock.mockResolvedValueOnce({ data: mockData, error: null });

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient<Database>;

      const models = await getPublishedModels({}, mockSupabase);

      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('Vario 160');
      expect(models[0].startingPriceIdr).toBe(27500000);
      expect(models[0].primaryImage?.storagePath).toBe('vario.png');
    });

    it('excludes expired or future-dated prices and inactive variants when calculating starting price', async () => {
      const mockData = [
        {
          id: 'model-2',
          name: 'Model Promo Expired',
          slug: 'model-expired',
          short_description: 'Unit test',
          engine_cc: 125,
          transmission: 'Otomatis',
          is_featured: false,
          is_new: false,
          status: 'published',
          published_at: '2026-01-01T00:00:00Z',
          category: { id: 'cat-1', name: 'Matic', slug: 'matic', is_active: true },
          images: [],
          variants: [
            {
              id: 'var-inactive',
              name: 'Old Variant',
              status: 'inactive', // inactive variant must be ignored
              sort_order: 1,
              price_entries: [
                {
                  id: 'p-1',
                  amount_idr: 10000000,
                  price_type: 'otr',
                  is_published: true,
                  valid_from: '2026-01-01',
                  valid_until: null,
                },
              ],
            },
            {
              id: 'var-active',
              name: 'Active Variant',
              status: 'active',
              sort_order: 2,
              price_entries: [
                {
                  id: 'p-expired',
                  amount_idr: 15000000,
                  price_type: 'otr',
                  is_published: true,
                  valid_from: '2025-01-01',
                  valid_until: '2025-12-31', // expired!
                },
                {
                  id: 'p-future',
                  amount_idr: 16000000,
                  price_type: 'otr',
                  is_published: true,
                  valid_from: '2099-01-01', // future!
                  valid_until: null,
                },
                {
                  id: 'p-unpublished',
                  amount_idr: 14000000,
                  price_type: 'otr',
                  is_published: false, // unpublished!
                  valid_from: '2026-01-01',
                  valid_until: null,
                },
              ],
            },
          ],
        },
      ];

      const orderMock = vi.fn();
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: orderMock,
      };

      orderMock.mockReturnValueOnce(mockQueryBuilder);
      orderMock.mockReturnValueOnce(mockQueryBuilder);
      orderMock.mockResolvedValueOnce({ data: mockData, error: null });

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient<Database>;

      const models = await getPublishedModels({}, mockSupabase);

      expect(models).toHaveLength(1);
      // Because all active prices are either expired, future, or unpublished, startingPriceIdr is null
      expect(models[0].startingPriceIdr).toBeNull();
    });
  });

  describe('getPublishedModelBySlug', () => {
    it('returns full model details with variants, available colors, and specs', async () => {
      const mockItem = {
        id: 'model-1',
        name: 'All New Honda Vario 160',
        slug: 'vario-160',
        short_description: 'Skutik bertenaga besar 160cc',
        description: 'Deskripsi lengkap Vario 160',
        engine_cc: 160,
        transmission: 'Otomatis',
        key_specs: {
          Mesin: {
            'Tipe Mesin': '4-Langkah, 4-Katup, eSP+',
          },
        },
        is_featured: true,
        is_new: false,
        status: 'published',
        seo_title: 'Vario 160 SEO Title',
        seo_description: 'Vario 160 SEO Description',
        published_at: '2026-01-01T00:00:00Z',
        category: { id: 'cat-1', name: 'Matic', slug: 'matic', is_active: true },
        images: [
          {
            id: 'img-1',
            storage_path: 'vario-front.png',
            alt_text: 'Tampak depan',
            image_role: 'card',
            sort_order: 1,
            variant_id: null,
            color_id: null,
          },
        ],
        variants: [
          {
            id: 'var-1',
            name: 'CBS',
            code: 'CBS',
            description: 'Combi Brake System',
            sort_order: 1,
            status: 'active',
            variant_colors: [
              {
                id: 'vc-1',
                color_id: 'col-1',
                image_path: 'vario-black.png',
                is_available: true,
                sort_order: 1,
                color: {
                  id: 'col-1',
                  name: 'Grande Matte Black',
                  slug: 'grande-matte-black',
                  hex_code: '#1A1A1A',
                },
              },
            ],
            price_entries: [
              {
                id: 'p-1',
                amount_idr: 27500000,
                price_type: 'otr',
                is_published: true,
                valid_from: '2026-01-01',
                valid_until: null,
              },
            ],
          },
        ],
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockItem, error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient<Database>;

      const model = await getPublishedModelBySlug('vario-160', mockSupabase);

      expect(model).not.toBeNull();
      expect(model?.name).toBe('All New Honda Vario 160');
      expect(model?.variants).toHaveLength(1);
      expect(model?.variants[0].name).toBe('CBS');
      expect(model?.variants[0].colors).toHaveLength(1);
      expect(model?.variants[0].colors[0].name).toBe('Grande Matte Black');
      expect(model?.variants[0].colors[0].hexCode).toBe('#1A1A1A');
      expect(model?.startingPriceIdr).toBe(27500000);
    });

    it('returns null for non-existent model or when Supabase returns error', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue(mockQueryBuilder),
      } as unknown as SupabaseClient<Database>;

      const model = await getPublishedModelBySlug('unknown-slug', mockSupabase);
      expect(model).toBeNull();
    });

    it('returns null immediately when slug is empty string', async () => {
      const model = await getPublishedModelBySlug('');
      expect(model).toBeNull();
    });
  });
});
