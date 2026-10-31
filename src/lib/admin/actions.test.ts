import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertPriceAction, upsertPromotionAction, upsertHeroBannerAction } from './actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Admin Management Actions — Security & Atomicity', () => {
  const mockRpc = vi.fn();
  const mockAdminSession = {
    user: { id: 'admin-uuid-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-uuid-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: Authenticated Admin Session
    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(
      mockAdminSession as adminAuth.AuthenticatedAdminSession
    );

    // Default: Mock Supabase Server Client
    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  // ==========================================================================
  // 1. PRICE MANAGEMENT TESTS
  // ==========================================================================
  describe('upsertPriceAction', () => {
    const validPriceInput = {
      variantId: '44444444-4444-4444-d444-444444444401',
      city: 'Sidoarjo',
      priceType: 'otr' as const,
      amountIdr: 27500000,
      validFrom: '2026-11-01',
      validUntil: '2026-12-31',
      isPublished: false,
      sourceNote: 'Internal Rate Card Q4',
    };

    it('rejects mutation when user is unauthorized', async () => {
      vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
        new Error('NEXT_REDIRECT:/admin/login')
      );

      await expect(upsertPriceAction(validPriceInput)).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login'
      );
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('rejects invalid input server-side (negative amount, invalid date format, invalid variant UUID)', async () => {
      const invalidInput = {
        variantId: 'invalid-uuid',
        amountIdr: -5000,
        validFrom: '01-11-2026', // invalid date format
        priceType: 'otr' as const,
      };

      const result = await upsertPriceAction(invalidInput as never);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('rejects date range where validUntil is before validFrom', async () => {
      const invalidDateRangeInput = {
        ...validPriceInput,
        validFrom: '2026-11-15',
        validUntil: '2026-11-01', // End date is before start date
      };

      const result = await upsertPriceAction(invalidDateRangeInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak boleh mendahului');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('keeps new prices unpublished by default when isPublished is omitted', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: 'new-price-id' },
        error: null,
      });

      const inputWithoutPublished = { ...validPriceInput };
      delete (inputWithoutPublished as Partial<typeof validPriceInput>).isPublished;
      const result = await upsertPriceAction(inputWithoutPublished);

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith(
        'admin_upsert_price_entry',
        expect.objectContaining({
          p_is_published: false, // strictly unpublished by default
        })
      );
    });

    it('propagates concurrency conflict error from database RPC transaction', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            'Konflik periode harga: Rentang tanggal bertabrakan dengan harga OTR yang sudah ada (2026-11-01 s/d seterusnya)',
        },
      });

      const result = await upsertPriceAction(validPriceInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Konflik periode harga');
    });

    it('handles database/audit failure and ensures transaction rollback without committing', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Gagal mencatat audit log: Foreign key violation',
        },
      });

      const result = await upsertPriceAction(validPriceInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Gagal mencatat audit log');
      // Verify revalidatePath was not called on failure
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('successfully calls atomic upsert RPC with audit summary on valid input', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: 'created-price-id', amount_idr: 27500000 },
        error: null,
      });

      const result = await upsertPriceAction(validPriceInput);
      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('admin_upsert_price_entry', {
        p_id: null,
        p_variant_id: '44444444-4444-4444-d444-444444444401',
        p_city: 'Sidoarjo',
        p_price_type: 'otr',
        p_amount_idr: 27500000,
        p_valid_from: '2026-11-01',
        p_valid_until: '2026-12-31',
        p_is_published: false,
        p_source_note: 'Internal Rate Card Q4',
        p_summary: expect.stringContaining('Super Admin'),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin/harga');
      expect(revalidatePath).toHaveBeenCalledWith('/harga');
    });

    it('excludes current entry ID when updating an existing price entry', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: '77777777-7777-4777-8777-777777777701' },
        error: null,
      });

      const updateInput = {
        id: '77777777-7777-4777-8777-777777777701',
        ...validPriceInput,
      };

      const result = await upsertPriceAction(updateInput);
      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith(
        'admin_upsert_price_entry',
        expect.objectContaining({
          p_id: '77777777-7777-4777-8777-777777777701',
        })
      );
    });

    it('supports updating price entry when variantId is omitted (retaining existing variant)', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: '77777777-7777-4777-8777-777777777701' },
        error: null,
      });

      const partialUpdateInput = {
        id: '77777777-7777-4777-8777-777777777701',
        amountIdr: 28000000,
        validFrom: '2026-11-01',
      };

      const result = await upsertPriceAction(partialUpdateInput as never);
      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith(
        'admin_upsert_price_entry',
        expect.objectContaining({
          p_id: '77777777-7777-4777-8777-777777777701',
          p_variant_id: null,
          p_amount_idr: 28000000,
        })
      );
    });
  });

  // ==========================================================================
  // 2. PROMOTION MANAGEMENT TESTS
  // ==========================================================================
  describe('upsertPromotionAction', () => {
    const validPromoInput = {
      title: 'Promo Spesial Honda Vario',
      slug: 'promo-spesial-honda-vario',
      summary: 'Program penawaran khusus cashback untuk pembelian Honda Vario 160.',
      details: 'Rincian syarat dan ketentuan lengkap promo.',
      imagePath: '/images/promotions/promo-vario.webp',
      startsAt: '2026-11-01T00:00:00.000Z',
      endsAt: '2026-11-30T23:59:59.000Z',
      terms: 'Berlaku untuk domisili Sidoarjo.',
      status: 'draft' as const,
      ctaLabel: 'Tanya via WhatsApp',
      ctaUrl: 'https://wa.me/6281234567890',
      modelIds: ['33333333-3333-4333-c333-333333333301'],
    };

    it('rejects mutation when user is unauthorized', async () => {
      vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
        new Error('NEXT_REDIRECT:/admin/login')
      );

      await expect(upsertPromotionAction(validPromoInput)).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login'
      );
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('rejects invalid slug format (uppercase, spaces, special chars)', async () => {
      const invalidSlugInput = {
        ...validPromoInput,
        slug: 'Promo Vario 160!', // invalid slug
      };

      const result = await upsertPromotionAction(invalidSlugInput);
      expect(result.success).toBe(false);
      expect(result.fieldErrors?.slug).toBeDefined();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('rejects promotion schedule where endsAt is earlier than startsAt', async () => {
      const invalidScheduleInput = {
        ...validPromoInput,
        startsAt: '2026-11-30T00:00:00.000Z',
        endsAt: '2026-11-01T00:00:00.000Z',
      };

      const result = await upsertPromotionAction(invalidScheduleInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Waktu berakhir promo harus setelah waktu mulai');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('successfully calls atomic promotion upsert with model junction associations', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: 'promo-uuid-1', title: validPromoInput.title },
        error: null,
      });

      const result = await upsertPromotionAction(validPromoInput);
      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('admin_upsert_promotion', {
        p_id: null,
        p_title: 'Promo Spesial Honda Vario',
        p_slug: 'promo-spesial-honda-vario',
        p_summary: 'Program penawaran khusus cashback untuk pembelian Honda Vario 160.',
        p_details: 'Rincian syarat dan ketentuan lengkap promo.',
        p_image_path: '/images/promotions/promo-vario.webp',
        p_starts_at: '2026-11-01T00:00:00.000Z',
        p_ends_at: '2026-11-30T23:59:59.000Z',
        p_terms: 'Berlaku untuk domisili Sidoarjo.',
        p_status: 'draft',
        p_cta_label: 'Tanya via WhatsApp',
        p_cta_url: 'https://wa.me/6281234567890',
        p_model_ids: ['33333333-3333-4333-c333-333333333301'],
        p_audit_summary: expect.stringContaining('Super Admin'),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin/promo');
      expect(revalidatePath).toHaveBeenCalledWith('/promo');
    });
  });

  // ==========================================================================
  // 3. HERO BANNER MANAGEMENT TESTS
  // ==========================================================================
  describe('upsertHeroBannerAction', () => {
    const validBannerInput = {
      title: 'Digital Showroom Honda Satrya',
      subtitle: 'Dealer Resmi Sepeda Motor Honda Sidoarjo',
      desktopImagePath: '/images/banners/hero-main.webp',
      mobileImagePath: '/images/banners/hero-mobile.webp',
      altText: 'Digital Showroom Dealer Honda Satrya',
      ctaLabel: 'Lihat Katalog',
      ctaUrl: '/motor',
      startsAt: '2026-11-01T00:00:00.000Z',
      endsAt: '2026-12-31T23:59:59.000Z',
      sortOrder: 1,
      status: 'draft' as const,
    };

    it('rejects mutation when user is unauthorized', async () => {
      vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
        new Error('NEXT_REDIRECT:/admin/login')
      );

      await expect(upsertHeroBannerAction(validBannerInput)).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login'
      );
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('rejects empty desktopImagePath or altText shorter than 3 characters', async () => {
      const invalidBanner = {
        ...validBannerInput,
        desktopImagePath: '',
        altText: 'a',
      };

      const result = await upsertHeroBannerAction(invalidBanner);
      expect(result.success).toBe(false);
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('successfully calls atomic hero banner upsert RPC with audit log payload', async () => {
      mockRpc.mockResolvedValueOnce({
        data: { id: 'banner-uuid-1', title: validBannerInput.title },
        error: null,
      });

      const result = await upsertHeroBannerAction(validBannerInput);
      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('admin_upsert_hero_banner', {
        p_id: null,
        p_title: 'Digital Showroom Honda Satrya',
        p_subtitle: 'Dealer Resmi Sepeda Motor Honda Sidoarjo',
        p_desktop_image_path: '/images/banners/hero-main.webp',
        p_mobile_image_path: '/images/banners/hero-mobile.webp',
        p_alt_text: 'Digital Showroom Dealer Honda Satrya',
        p_cta_label: 'Lihat Katalog',
        p_cta_url: '/motor',
        p_starts_at: '2026-11-01T00:00:00.000Z',
        p_ends_at: '2026-12-31T23:59:59.000Z',
        p_sort_order: 1,
        p_status: 'draft',
        p_audit_summary: expect.stringContaining('Super Admin'),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/admin/banner');
    });
  });
});
