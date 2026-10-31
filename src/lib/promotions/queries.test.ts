import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getActivePromotions,
  getPromotionBySlug,
  getModelActivePromotions,
  getActiveHeroBanners,
} from './queries';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

describe('Promotions & Hero Banners Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActivePromotions', () => {
    it('retrieves active published promotions within schedule', async () => {
      const mockData = [
        {
          id: 'promo-1',
          title: 'Promo Spesial Vario',
          slug: 'promo-spesial-vario',
          summary: 'Cashback hingga Rp 1.500.000 untuk Vario 160',
          image_path: '/banners/promo1.jpg',
          starts_at: '2026-10-01T00:00:00Z',
          ends_at: '2026-11-30T23:59:59Z',
          status: 'published',
          cta_label: 'Lihat Promo',
          cta_url: '/promo/promo-spesial-vario',
          promotion_models: [{ model_id: 'm-1' }, { model_id: 'm-2' }],
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActivePromotions(mockSupabase);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Promo Spesial Vario');
      expect(result[0].eligibleModelCount).toBe(2);
      expect(result[0].status).toBe('published');
    });

    it('returns empty array gracefully on database error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  order: vi
                    .fn()
                    .mockResolvedValue({ data: null, error: { message: 'Database failure' } }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActivePromotions(mockSupabase);
      expect(result).toEqual([]);
    });
  });

  describe('getPromotionBySlug', () => {
    it('returns detailed promotion data with published eligible models and starting prices', async () => {
      const mockPromoData = {
        id: 'promo-1',
        title: 'Promo Cashback Matic',
        slug: 'promo-cashback-matic',
        summary: 'Potongan harga untuk lini skutik Honda.',
        details: 'Syarat dan ketentuan lengkap promosi.',
        image_path: '/promo-banner.jpg',
        starts_at: '2026-10-01T00:00:00Z',
        ends_at: '2026-11-30T23:59:59Z',
        terms: 'Berlaku khusus wilayah Sidoarjo.',
        status: 'published',
        cta_label: 'Klaim Sekarang',
        cta_url: '/hubungi',
        created_by: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        promotion_models: [
          {
            model: {
              id: 'm-1',
              name: 'All New Honda Vario 160',
              slug: 'vario-160',
              status: 'published',
              published_at: '2026-01-01T00:00:00Z',
              category: { name: 'Matic' },
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
                  id: 'v-1',
                  status: 'active',
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
            },
          },
        ],
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: mockPromoData, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getPromotionBySlug('promo-cashback-matic', mockSupabase);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Promo Cashback Matic');
      expect(result?.eligibleModels).toHaveLength(1);
      expect(result?.eligibleModels[0].name).toBe('All New Honda Vario 160');
      expect(result?.eligibleModels[0].startingPriceIdr).toBe(27500000);
      expect(result?.eligibleModels[0].categoryName).toBe('Matic');
    });

    it('returns null if slug is empty, non-existent, or database error occurs', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    maybeSingle: vi
                      .fn()
                      .mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      expect(await getPromotionBySlug('', mockSupabase)).toBeNull();
      expect(await getPromotionBySlug('non-existent', mockSupabase)).toBeNull();
    });
  });

  describe('getModelActivePromotions', () => {
    it('returns active promotions linked to the specified model', async () => {
      const mockData = [
        {
          id: 'promo-1',
          title: 'Cashback Vario',
          slug: 'cashback-vario',
          summary: 'Potongan harga Vario',
          image_path: null,
          starts_at: '2026-10-01T00:00:00Z',
          ends_at: '2026-11-30T23:59:59Z',
          status: 'published',
          cta_label: null,
          cta_url: null,
          promotion_models: [{ model_id: 'model-vario-id' }],
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getModelActivePromotions('model-vario-id', mockSupabase);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Cashback Vario');
    });

    it('returns empty array if modelId is empty string', async () => {
      const result = await getModelActivePromotions('');
      expect(result).toEqual([]);
    });
  });

  describe('getActiveHeroBanners', () => {
    it('retrieves active published hero banners ordered by sort_order', async () => {
      const mockData = [
        {
          id: 'banner-1',
          title: 'All New Honda Vario 160',
          subtitle: 'Performa Skutik Sporty',
          desktop_image_path: '/banners/vario-desktop.webp',
          mobile_image_path: '/banners/vario-mobile.webp',
          alt_text: 'Vario 160',
          cta_label: 'Lihat Motor',
          cta_url: '/motor/vario-160',
          starts_at: null,
          ends_at: null,
          sort_order: 1,
          status: 'published',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'banner-2',
          title: 'Promo Spesial Showroom',
          subtitle: 'Diskon Akhir Tahun',
          desktop_image_path: '/banners/promo-desktop.webp',
          mobile_image_path: null,
          alt_text: 'Promo Showroom',
          cta_label: 'Cek Promo',
          cta_url: '/promo',
          starts_at: '2026-10-01T00:00:00Z',
          ends_at: '2026-11-30T23:59:59Z',
          sort_order: 2,
          status: 'published',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActiveHeroBanners(mockSupabase);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('All New Honda Vario 160');
      expect(result[0].sortOrder).toBe(1);
      expect(result[1].title).toBe('Promo Spesial Showroom');
      expect(result[1].sortOrder).toBe(2);
    });

    it('returns empty array when zero banners are published or scheduled', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActiveHeroBanners(mockSupabase);
      expect(result).toEqual([]);
    });

    it('returns empty array gracefully on error', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                or: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'Database unavailable' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      const result = await getActiveHeroBanners(mockSupabase);
      expect(result).toEqual([]);
    });
  });
});
