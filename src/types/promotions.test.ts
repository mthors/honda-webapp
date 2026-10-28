import { describe, it, expect } from 'vitest';
import {
  createPromotionSchema,
  updatePromotionSchema,
  createHeroBannerSchema,
  updateHeroBannerSchema,
} from './promotions';

describe('Promotions & Hero Banners Domain Schemas', () => {
  const modelIdA = '33333333-3333-4333-c333-333333333301';
  const modelIdB = '33333333-3333-4333-c333-333333333302';

  describe('createPromotionSchema', () => {
    it('accepts a valid promotion payload with linked models', () => {
      const payload = {
        title: 'Promo Spesial Akhir Tahun Honda 2026',
        slug: 'promo-akhir-tahun-2026',
        summary: 'Dapatkan potongan harga spesial dan cashback untuk pembelian motor matic.',
        details: 'Syarat dan ketentuan berlaku untuk pembelian tunai atau kredit.',
        imagePath: '/images/promos/promo-akhir-tahun.jpg',
        startsAt: '2026-11-01T00:00:00Z',
        endsAt: '2026-11-30T23:59:59Z',
        terms: 'Khusus KTP wilayah Sidoarjo dan sekitarnya.',
        status: 'draft' as const,
        ctaLabel: 'Klaim Promo',
        ctaUrl: '/hubungi?promo=akhir-tahun-2026',
        modelIds: [modelIdA, modelIdB],
      };

      const result = createPromotionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects promotion when endsAt precedes or equals startsAt', () => {
      const payload = {
        title: 'Promo Flash Sale Honda',
        slug: 'promo-flash-sale',
        summary: 'Penawaran terbatas motor Honda untuk pelanggan setia showroom.',
        startsAt: '2026-11-30T23:59:59Z',
        endsAt: '2026-11-01T00:00:00Z',
      };

      const result = createPromotionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('setelah waktu mulai');
      }
    });

    it('rejects invalid slugs (uppercase, spaces, special chars)', () => {
      const payload = {
        title: 'Promo Vario 160',
        slug: 'Promo Vario 160!',
        summary: 'Dapatkan promo cashback khusus pembelian All New Honda Vario 160.',
        startsAt: '2026-11-01T00:00:00Z',
        endsAt: '2026-11-30T23:59:59Z',
      };

      const result = createPromotionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('rejects summary shorter than 10 characters', () => {
      const payload = {
        title: 'Promo BeAT',
        slug: 'promo-beat',
        summary: 'Pendek',
        startsAt: '2026-11-01T00:00:00Z',
        endsAt: '2026-11-30T23:59:59Z',
      };

      const result = createPromotionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('updatePromotionSchema', () => {
    it('accepts partial updates', () => {
      const payload = {
        id: '99999999-9999-4999-a999-999999999901',
        title: 'Judul Promo Diperbarui',
        status: 'published' as const,
      };

      const result = updatePromotionSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects update if endsAt is before startsAt', () => {
      const payload = {
        id: '99999999-9999-4999-a999-999999999901',
        startsAt: '2026-12-01T00:00:00Z',
        endsAt: '2026-11-01T00:00:00Z',
      };

      const result = updatePromotionSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('createHeroBannerSchema', () => {
    it('validates a complete hero banner without schedule (always active)', () => {
      const payload = {
        title: 'All New Honda Vario 160',
        subtitle: 'Brand New Perfection dengan Mesin 160cc 4 Katup eSP+',
        desktopImagePath: '/images/banners/vario-160-desktop.webp',
        mobileImagePath: '/images/banners/vario-160-mobile.webp',
        altText: 'Spanduk promosi All New Honda Vario 160',
        ctaLabel: 'Lihat Spesifikasi',
        ctaUrl: '/motor/vario-160',
        sortOrder: 1,
        status: 'published' as const,
      };

      const result = createHeroBannerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('validates a scheduled hero banner', () => {
      const payload = {
        title: 'Pesta Diskon Showroom Sidoarjo',
        desktopImagePath: '/images/banners/event-sidoarjo.webp',
        altText: 'Event showroom Honda Sidoarjo',
        startsAt: '2026-11-01T00:00:00Z',
        endsAt: '2026-11-15T23:59:59Z',
        sortOrder: 2,
        status: 'published' as const,
      };

      const result = createHeroBannerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('rejects banner when endsAt precedes startsAt', () => {
      const payload = {
        title: 'Event Banner',
        desktopImagePath: '/images/banners/event.webp',
        altText: 'Event banner',
        startsAt: '2026-11-15T00:00:00Z',
        endsAt: '2026-11-01T00:00:00Z',
      };

      const result = createHeroBannerSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('updateHeroBannerSchema', () => {
    it('validates partial update of sort order and status', () => {
      const payload = {
        id: '88888888-8888-4888-b888-888888888801',
        sortOrder: 5,
        status: 'archived' as const,
      };

      const result = updateHeroBannerSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });
});
