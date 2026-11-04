import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSiteSettings, getDealerships } from './queries';
import * as serverSupabase from '@/lib/supabase/server';

describe('Settings Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSiteSettings', () => {
    it('returns formatted SiteSettings when singleton row exists', async () => {
      const mockRow = {
        id: 'default',
        dealer_name: 'Honda Satrya Dealer Group',
        logo_path: null,
        address: null,
        city: null,
        phone: null,
        whatsapp_number: '6281234567890',
        public_email: 'info@satryagroup.co.id',
        opening_hours: { consultation_hours: '08:00 - 17:00' },
        social_links: { instagram: 'https://instagram.com/demo' },
        privacy_notice: 'Kebijakan privasi resmi.',
        updated_by: 'admin-uuid-1',
        updated_at: '2026-11-04T08:00:00.000Z',
      };

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockRow,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const result = await getSiteSettings();

      expect(mockFrom).toHaveBeenCalledWith('site_settings');
      expect(mockEq).toHaveBeenCalledWith('id', 'default');
      expect(result).not.toBeNull();
      expect(result?.dealerName).toBe('Honda Satrya Dealer Group');
      expect(result?.whatsappNumber).toBe('6281234567890');
      expect(result?.openingHours.consultation_hours).toBe('08:00 - 17:00');
    });

    it('returns null when singleton row is not found', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const result = await getSiteSettings();
      expect(result).toBeNull();
    });

    it('handles query error by returning null', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB connection error' },
      });
      const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const result = await getSiteSettings();
      expect(result).toBeNull();
    });
  });

  describe('getDealerships', () => {
    it('returns mapped DealershipItem list', async () => {
      const mockRows = [
        {
          id: 'dealership-1',
          name: '[DEMO] Honda Satrya — Sidoarjo Sentral',
          code: 'demo-satrya-sidoarjo',
          city: 'Sidoarjo',
          address: null,
          phone: null,
          whatsapp_number: null,
          opening_hours: null,
          is_synthetic: true,
          is_active: true,
          sort_order: 1,
          created_at: '2026-11-04T08:00:00.000Z',
          updated_at: '2026-11-04T08:00:00.000Z',
        },
      ];

      const mockOrder2 = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const result = await getDealerships();

      expect(mockFrom).toHaveBeenCalledWith('dealerships');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('[DEMO] Honda Satrya — Sidoarjo Sentral');
      expect(result[0].isSynthetic).toBe(true);
    });

    it('returns empty array on database error', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const result = await getDealerships();
      expect(result).toEqual([]);
    });
  });
});
