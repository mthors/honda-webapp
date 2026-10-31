import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAdminPriceEntries,
  getMotorcycleOptionsForAdmin,
  getAdminPromotions,
  getAdminHeroBanners,
} from './queries';
import * as serverSupabase from '@/lib/supabase/server';

describe('Admin Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdminPriceEntries', () => {
    it('returns formatted price entries with joined model and variant info', async () => {
      const mockData = [
        {
          id: '77777777-7777-4777-8777-777777777701',
          variant_id: '44444444-4444-4444-d444-444444444401',
          city: 'Sidoarjo',
          price_type: 'otr',
          amount_idr: 27350000,
          valid_from: '2026-01-01',
          valid_until: null,
          is_published: false,
          source_note: 'Contoh data OTR pengembangan lokal',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          motorcycle_variants: {
            id: '44444444-4444-4444-d444-444444444401',
            name: 'CBS',
            code: 'VARIO-CBS',
            motorcycle_models: {
              id: '33333333-3333-4333-c333-333333333301',
              name: 'All New Honda Vario 160',
              slug: 'vario-160',
            },
          },
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
      );

      const result = await getAdminPriceEntries();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '77777777-7777-4777-8777-777777777701',
        variantId: '44444444-4444-4444-d444-444444444401',
        variantName: 'CBS',
        variantCode: 'VARIO-CBS',
        modelId: '33333333-3333-4333-c333-333333333301',
        modelName: 'All New Honda Vario 160',
        modelSlug: 'vario-160',
        city: 'Sidoarjo',
        priceType: 'otr',
        amountIdr: 27350000,
        validFrom: '2026-01-01',
        validUntil: null,
        isPublished: false, // Illustrative seed prices remain unpublished
        sourceNote: 'Contoh data OTR pengembangan lokal',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });
    });

    it('returns empty array on database error without throwing', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database query failed' },
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
      );

      const result = await getAdminPriceEntries();
      expect(result).toEqual([]);
    });
  });

  describe('getMotorcycleOptionsForAdmin', () => {
    it('returns models with their nested variants for select inputs', async () => {
      const mockData = [
        {
          id: '33333333-3333-4333-c333-333333333301',
          name: 'All New Honda Vario 160',
          slug: 'vario-160',
          motorcycle_variants: [
            { id: '44444444-4444-4444-d444-444444444401', name: 'CBS', code: 'VARIO-CBS' },
            { id: '44444444-4444-4444-d444-444444444402', name: 'ABS', code: 'VARIO-ABS' },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
      );

      const result = await getMotorcycleOptionsForAdmin();
      expect(result).toHaveLength(1);
      expect(result[0].variants).toHaveLength(2);
      expect(result[0].variants[0].name).toBe('CBS');
    });
  });

  describe('getAdminPromotions', () => {
    it('returns promotions with linked model metadata', async () => {
      const mockData = [
        {
          id: 'p-1',
          title: 'Promo Spesial Vario',
          slug: 'promo-spesial-vario',
          summary: 'Cashback khusus',
          details: null,
          image_path: null,
          starts_at: '2026-11-01T00:00:00Z',
          ends_at: '2026-11-30T00:00:00Z',
          terms: null,
          status: 'draft',
          cta_label: null,
          cta_url: null,
          created_at: '2026-10-31T00:00:00Z',
          updated_at: '2026-10-31T00:00:00Z',
          promotion_models: [
            {
              model_id: 'm-1',
              motorcycle_models: {
                id: 'm-1',
                name: 'Vario 160',
                slug: 'vario-160',
              },
            },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
      );

      const result = await getAdminPromotions();
      expect(result).toHaveLength(1);
      expect(result[0].linkedModels).toHaveLength(1);
      expect(result[0].linkedModels[0].name).toBe('Vario 160');
    });
  });

  describe('getAdminHeroBanners', () => {
    it('returns hero banners sorted by sortOrder', async () => {
      const mockData = [
        {
          id: 'b-1',
          title: 'Banner 1',
          subtitle: 'Sub 1',
          desktop_image_path: '/b1.webp',
          mobile_image_path: null,
          alt_text: 'Banner 1 Alt',
          cta_label: null,
          cta_url: null,
          starts_at: null,
          ends_at: null,
          sort_order: 1,
          status: 'draft',
          created_at: '2026-10-31T00:00:00Z',
          updated_at: '2026-10-31T00:00:00Z',
        },
      ];

      const mockOrder2 = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const mockOrder1 = vi.fn().mockReturnValue({
        order: mockOrder2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        order: mockOrder1,
      });

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: mockSelect,
        }),
      };

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue(
        mockSupabase as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>
      );

      const result = await getAdminHeroBanners();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Banner 1');
      expect(result[0].sortOrder).toBe(1);
    });
  });
});
