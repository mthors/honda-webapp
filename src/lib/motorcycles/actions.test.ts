import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMotorcycleModelAction,
  updateMotorcycleModelAction,
  toggleMotorcycleModelStatusAction,
  deleteMotorcycleModelAction,
  getMotorcycleModelDetailAction,
} from './actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import * as auditLogger from '@/lib/audit/logger';
import * as motorcycleQueries from '@/lib/motorcycles/queries';
import { revalidatePath } from 'next/cache';
import type { CreateMotorcycleModelInput, UpdateMotorcycleModelInput } from '@/types/motorcycle';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Motorcycle Model Actions', () => {
  const mockAdminSession = {
    user: { id: 'admin-uuid-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-uuid-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  const sampleModelId = '11111111-2222-4333-8444-555555555555';
  const sampleCategoryId = 'c1111111-1111-4111-8111-111111111111';
  const sampleColorId = 'e1111111-1111-4111-8111-111111111111';

  const sampleModelRow = {
    id: sampleModelId,
    name: 'Honda Beat Street',
    slug: 'honda-beat-street',
    category_id: sampleCategoryId,
    short_description: 'Skutik compact lincah',
    description: 'Deskripsi lengkap Beat Street',
    engine_cc: 110,
    transmission: 'Otomatis, V-Matic',
    is_featured: true,
    is_new: false,
    status: 'published' as const,
    seo_title: 'Honda Beat Street 2026',
    seo_description: 'Harga dan promo Beat Street',
    published_at: '2026-11-01T00:00:00.000Z',
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
  };

  const validCreateInput: CreateMotorcycleModelInput = {
    name: 'Honda Beat Street',
    slug: 'honda-beat-street',
    categoryId: sampleCategoryId,
    shortDescription: 'Skutik compact lincah',
    description: 'Deskripsi lengkap Beat Street',
    engineCc: 110,
    transmission: 'Otomatis, V-Matic',
    isFeatured: true,
    isNew: false,
    status: 'published',
    seoTitle: 'Honda Beat Street 2026',
    seoDescription: 'Harga dan promo Beat Street',
    variants: [
      {
        name: 'CBS',
        code: 'BEAT-STR-CBS',
        status: 'active',
        sortOrder: 1,
        colorIds: [sampleColorId],
      },
    ],
    images: [
      {
        storagePath: 'motorcycles/beat-street/card.webp',
        altText: 'Honda Beat Street Tampak Samping',
        imageRole: 'card',
        sortOrder: 1,
      },
    ],
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

  describe('createMotorcycleModelAction', () => {
    it('rejects mutation when user is not an authorized administrator', async () => {
      vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
        new Error('NEXT_REDIRECT:/admin/login')
      );

      await expect(createMotorcycleModelAction(validCreateInput)).rejects.toThrow(
        'NEXT_REDIRECT:/admin/login'
      );
    });

    it('validates required fields and slug format with Zod server-side', async () => {
      const result = await createMotorcycleModelAction({
        name: '',
        slug: 'INVALID SLUG WITH SPACES',
        categoryId: 'not-a-uuid',
        isFeatured: false,
        isNew: false,
        status: 'draft',
        variants: [],
        images: [],
      } as never);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.name).toBeDefined();
      expect(result.fieldErrors?.slug).toBeDefined();
    });

    it('rejects creation when slug already exists in database', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'existing-id-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await createMotorcycleModelAction(validCreateInput);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Slug URL sudah digunakan');
      expect(res.fieldErrors?.slug).toBeDefined();
    });

    it('creates motorcycle model with variants and images, logs audit, and revalidates paths', async () => {
      const insertedVariantId = 'var-1111-2222-3333-444444444444';

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: sampleModelId,
                    name: validCreateInput.name,
                    slug: validCreateInput.slug,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: insertedVariantId },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'variant_colors') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'model_images') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await createMotorcycleModelAction(validCreateInput);

      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(sampleModelId);
      expect(res.data?.slug).toBe(validCreateInput.slug);

      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'motorcycle_models',
          entityId: sampleModelId,
        }),
        expect.anything()
      );

      expect(revalidatePath).toHaveBeenCalledWith('/admin/motor');
      expect(revalidatePath).toHaveBeenCalledWith('/motor');
      expect(revalidatePath).toHaveBeenCalledWith(`/motor/${validCreateInput.slug}`);
      expect(revalidatePath).toHaveBeenCalledWith('/harga');
    });
  });

  describe('updateMotorcycleModelAction', () => {
    const validUpdateInput: UpdateMotorcycleModelInput = {
      id: sampleModelId,
      name: 'Honda Beat Street 2026 Facelift',
      slug: 'honda-beat-street-2026',
      categoryId: sampleCategoryId,
      shortDescription: 'Skutik compact facelift',
      description: 'Deskripsi diperbarui',
      engineCc: 110,
      transmission: 'Otomatis',
      isFeatured: true,
      isNew: true,
      status: 'published',
      variants: [],
      images: [],
    };

    it('rejects update if model does not exist', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await updateMotorcycleModelAction(validUpdateInput);
      expect(res.success).toBe(false);
      expect(res.error).toContain('tidak ditemukan');
    });

    it('rejects slug collision if changed slug already taken by another model', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation((col: string) => {
                if (col === 'id') {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: sampleModelRow,
                      error: null,
                    }),
                  };
                }
                if (col === 'slug') {
                  return {
                    neq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: { id: 'other-model-id' },
                        error: null,
                      }),
                    }),
                  };
                }
                return {};
              }),
            })),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await updateMotorcycleModelAction(validUpdateInput);
      expect(res.success).toBe(false);
      expect(res.error).toContain('Slug URL sudah digunakan');
    });

    it('updates motorcycle model successfully and logs audit', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation((col: string) => {
                if (col === 'id') {
                  return {
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: sampleModelRow,
                      error: null,
                    }),
                  };
                }
                if (col === 'slug') {
                  return {
                    neq: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  };
                }
                return {};
              }),
            })),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === 'model_images') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await updateMotorcycleModelAction(validUpdateInput);
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(sampleModelId);
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          entityType: 'motorcycle_models',
          entityId: sampleModelId,
        }),
        expect.anything()
      );
    });
  });

  describe('toggleMotorcycleModelStatusAction', () => {
    it('updates status and revalidates paths', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: sampleModelId,
                    slug: 'honda-beat-street',
                    status: 'draft',
                    name: 'Honda Beat Street',
                    published_at: null,
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await toggleMotorcycleModelStatusAction(sampleModelId, 'published');
      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('published');
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          entityType: 'motorcycle_models',
          entityId: sampleModelId,
        }),
        expect.anything()
      );
      expect(revalidatePath).toHaveBeenCalledWith('/admin/motor');
      expect(revalidatePath).toHaveBeenCalledWith('/motor');
    });
  });

  describe('deleteMotorcycleModelAction', () => {
    it('blocks deletion when model is referenced by inquiries (leads)', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: sampleModelId,
                    name: 'Honda Beat Street',
                    slug: 'honda-beat-street',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 3,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteMotorcycleModelAction(sampleModelId);
      expect(res.success).toBe(false);
      expect(res.data?.blocked).toBe(true);
      expect(res.data?.reason).toBe('leads_exist');
      expect(res.error).toContain('tercatat dalam 3 inquiry');
    });

    it('blocks deletion when model variants have price entries', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: sampleModelId,
                    name: 'Honda Beat Street',
                    slug: 'honda-beat-street',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ id: 'var-1' }],
                error: null,
              }),
            }),
          };
        }
        if (table === 'price_entries') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                count: 5,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteMotorcycleModelAction(sampleModelId);
      expect(res.success).toBe(false);
      expect(res.data?.blocked).toBe(true);
      expect(res.data?.reason).toBe('prices_exist');
      expect(res.error).toContain('5 data harga OTR');
    });

    it('blocks deletion when model is attached to active promotions', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: sampleModelId,
                    name: 'Honda Beat Street',
                    slug: 'honda-beat-street',
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        if (table === 'promotion_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 1,
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteMotorcycleModelAction(sampleModelId);
      expect(res.success).toBe(false);
      expect(res.data?.blocked).toBe(true);
      expect(res.data?.reason).toBe('promotions_exist');
      expect(res.error).toContain('1 program promosi aktif');
    });

    it('safely deletes model when completely unlinked, logs audit, and revalidates', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: sampleModelId,
                    name: 'Honda Beat Street',
                    slug: 'honda-beat-street',
                  },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'leads') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        if (table === 'promotion_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          };
        }
        return {};
      });

      vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
        from: mockFrom,
      } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

      const res = await deleteMotorcycleModelAction(sampleModelId);
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe(sampleModelId);
      expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'delete',
          entityType: 'motorcycle_models',
          entityId: sampleModelId,
        }),
        expect.anything()
      );
      expect(revalidatePath).toHaveBeenCalledWith('/admin/motor');
    });
  });

  describe('getMotorcycleModelDetailAction', () => {
    it('returns detail when found', async () => {
      vi.spyOn(motorcycleQueries, 'getAdminMotorcycleModelById').mockResolvedValueOnce({
        id: sampleModelId,
        name: 'Honda Beat Street',
        slug: 'honda-beat-street',
        categoryId: sampleCategoryId,
        categoryName: 'Matic',
        categorySlug: 'matic',
        shortDescription: 'Skutik compact',
        description: 'Deskripsi',
        engineCc: 110,
        transmission: 'Otomatis',
        isFeatured: true,
        isNew: false,
        status: 'published',
        seoTitle: null,
        seoDescription: null,
        publishedAt: null,
        primaryImage: null,
        variantCount: 1,
        imageCount: 1,
        startingPriceIdr: 18000000,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
        variants: [],
        images: [],
      });

      const res = await getMotorcycleModelDetailAction(sampleModelId);
      expect(res.success).toBe(true);
      expect(res.data?.name).toBe('Honda Beat Street');
    });

    it('returns error when not found', async () => {
      vi.spyOn(motorcycleQueries, 'getAdminMotorcycleModelById').mockResolvedValueOnce(null);

      const res = await getMotorcycleModelDetailAction(sampleModelId);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Model motor tidak ditemukan.');
    });
  });
});