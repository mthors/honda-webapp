import { describe, it, expect, vi, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';
import { submitInquiryAction } from './actions';
import { resetRateLimiter } from './rate-limiter';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('submitInquiryAction', () => {
  const modelId = 'a1111111-1111-4111-8111-111111111111';
  const variantId = 'b2222222-2222-4222-8222-222222222222';
  const colorId = 'c3333333-3333-4333-8333-333333333333';

  const validSubmission = {
    fullName: 'Ahmad Faiz',
    whatsappNumber: '081234567890',
    email: 'faiz@example.com',
    city: 'Sidoarjo',
    district: 'Waru',
    modelId,
    variantId,
    colorId,
    modelNameSnapshot: 'All New Honda Vario 160',
    variantNameSnapshot: 'CBS',
    colorNameSnapshot: 'Grande Matte Black',
    priceSnapshotIdr: 27350000,
    message: 'Mau tanya simulasi OTR Sidoarjo.',
    consentPrivacy: true,
    sourcePage: '/motor/vario-160',
  };

  let mockInsert: ReturnType<typeof vi.fn>;
  let mockClient: SupabaseClient<Database>;

  beforeEach(() => {
    resetRateLimiter();
    vi.clearAllMocks();

    mockInsert = vi.fn().mockResolvedValue({ error: null });

    // Mock Supabase client
    mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: modelId, name: 'All New Honda Vario 160', status: 'published' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: variantId, name: 'CBS', model_id: modelId, status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'variant_colors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        variant_id: variantId,
                        color_id: colorId,
                        is_available: true,
                        color: { id: colorId, name: 'Grande Matte Black' },
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'price_entries') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    or: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                          maybeSingle: vi.fn().mockResolvedValue({
                            data: { amount_idr: 27350000 },
                            error: null,
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'leads') {
          return {
            insert: mockInsert,
          } as unknown as ReturnType<SupabaseClient<Database>['from']>;
        }
        return {} as unknown as ReturnType<SupabaseClient<Database>['from']>;
      }),
    } as unknown as SupabaseClient<Database>;
  });

  it('successfully creates lead with human-friendly reference and normalized phone', async () => {
    const result = await submitInquiryAction(validSubmission, mockClient);

    expect(result.success).toBe(true);
    expect(result.leadReference).toMatch(/^INQ-\d{8}-[A-Z0-9]{4}$/);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    const insertedData = mockInsert.mock.calls[0][0];
    expect(insertedData.full_name).toBe('Ahmad Faiz');
    expect(insertedData.whatsapp_number).toBe('6281234567890');
    expect(insertedData.status).toBe('new');
    expect(insertedData.model_name_snapshot).toBe('All New Honda Vario 160');
    expect(insertedData.variant_name_snapshot).toBe('CBS');
    expect(insertedData.color_name_snapshot).toBe('Grande Matte Black');
    expect(insertedData.consent_privacy_at).toBeDefined();
  });

  it('rejects input with invalid phone or missing consent without calling database insert', async () => {
    const invalidSubmission = {
      ...validSubmission,
      whatsappNumber: 'not-a-phone',
      consentPrivacy: false,
    };

    const result = await submitInquiryAction(invalidSubmission, mockClient);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.whatsappNumber).toBeDefined();
    expect(result.fieldErrors?.consentPrivacy).toBeDefined();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('T09: rejects when motorcycle variant does not belong to selected model', async () => {
    // Override variant lookup to return null (mismatched model)
    const mismatchedClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: modelId, name: 'All New Honda Vario 160', status: 'published' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null, // No match for model_id + variant_id
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {} as unknown as ReturnType<SupabaseClient<Database>['from']>;
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await submitInquiryAction(validSubmission, mismatchedClient);

    expect(result.success).toBe(false);
    expect(result.error).toContain('tidak sesuai dengan model');
    expect(result.fieldErrors?.variantId).toBeDefined();
  });

  it('T09: rejects when color is not available for selected variant', async () => {
    // Override variant_colors to return null (unavailable or mismatched color)
    const mismatchedColorClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: modelId, name: 'All New Honda Vario 160', status: 'published' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: variantId, name: 'CBS', model_id: modelId, status: 'active' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'variant_colors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null, // Color not associated with variant
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {} as unknown as ReturnType<SupabaseClient<Database>['from']>;
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await submitInquiryAction(validSubmission, mismatchedColorClient);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Pilihan warna tidak sesuai dengan varian');
    expect(result.fieldErrors?.colorId).toBeDefined();
  });

  it('rejects duplicate submissions within 60 seconds with friendly message', async () => {
    // First submission
    const firstResult = await submitInquiryAction(validSubmission, mockClient);
    expect(firstResult.success).toBe(true);

    // Second immediate submission with same phone, city, model
    const secondResult = await submitInquiryAction(validSubmission, mockClient);
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toContain('Pertanyaan yang sama baru saja dikirimkan');
  });

  it('rejects duplicate submissions when submitted with modelId and without modelNameSnapshot', async () => {
    const submissionWithoutSnapshot = {
      ...validSubmission,
      modelNameSnapshot: null,
      variantNameSnapshot: null,
      colorNameSnapshot: null,
    };

    // First submission with modelId but without snapshot
    const firstResult = await submitInquiryAction(submissionWithoutSnapshot, mockClient);
    expect(firstResult.success).toBe(true);

    // Second immediate submission with modelId but without snapshot
    const secondResult = await submitInquiryAction(submissionWithoutSnapshot, mockClient);
    expect(secondResult.success).toBe(false);
    expect(secondResult.error).toContain('Pertanyaan yang sama baru saja dikirimkan');
  });

  it('revalidates admin paths (/admin/leads and /admin) upon successful inquiry submission', async () => {
    const result = await submitInquiryAction(validSubmission, mockClient);
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith('/admin/leads');
    expect(revalidatePath).toHaveBeenCalledWith('/admin');
  });

  it('counts invalid submission attempts toward the rate limit to prevent spam attacks', async () => {
    const invalidPayload = { fullName: '' };

    // Send 5 invalid requests
    for (let i = 0; i < 5; i++) {
      const res = await submitInquiryAction(invalidPayload, mockClient);
      expect(res.success).toBe(false);
      expect(res.fieldErrors).toBeDefined();
    }

    // 6th request should be blocked by rate limiter even though previous requests were invalid
    const blockedRes = await submitInquiryAction(validSubmission, mockClient);
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.error).toContain('Terlalu banyak permintaan pengiriman');
  });

  it('handles database errors safely without exposing internal database details', async () => {
    mockInsert.mockResolvedValueOnce({
      error: { message: 'relation public.leads does not exist' },
    });

    const result = await submitInquiryAction(validSubmission, mockClient);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Terjadi kendala sistem saat menyimpan data');
    expect(result.error).not.toContain('relation');
  });

  it('regression: successfully processes submission using database seed IDs and all fields filled', async () => {
    const seedModelId = '33333333-3333-4333-c333-333333333301';
    const seedVariantId = '44444444-4444-4444-d444-444444444401';
    const seedColorId = '22222222-2222-4222-b222-222222222201';

    const seedClient = {
      from: vi.fn((table: string) => {
        if (table === 'motorcycle_models') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: seedModelId, name: 'All New Honda Vario 160', status: 'published' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'motorcycle_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: seedVariantId,
                      name: 'CBS',
                      model_id: seedModelId,
                      status: 'active',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'variant_colors') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        variant_id: seedVariantId,
                        color_id: seedColorId,
                        is_available: true,
                        color: { id: seedColorId, name: 'Grande Matte Black' },
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'leads') {
          return {
            insert: mockInsert,
          };
        }
        return {} as unknown as ReturnType<SupabaseClient<Database>['from']>;
      }),
    } as unknown as SupabaseClient<Database>;

    const fullPayload = {
      fullName: 'Budi Santoso',
      whatsappNumber: '081234567890',
      email: 'budi.santoso@example.com',
      city: 'Sidoarjo',
      district: 'Waru',
      modelId: seedModelId,
      variantId: seedVariantId,
      colorId: seedColorId,
      modelNameSnapshot: 'All New Honda Vario 160',
      variantNameSnapshot: 'CBS',
      colorNameSnapshot: 'Grande Matte Black',
      priceSnapshotIdr: 27350000,
      message: 'Halo saya ingin menanyakan ketersediaan unit motor ini.',
      consentPrivacy: true,
      sourcePage: '/hubungi',
    };

    const result = await submitInquiryAction(fullPayload, seedClient);

    expect(result.success).toBe(true);
    expect(result.leadReference).toMatch(/^INQ-\d{8}-[A-Z0-9]{4}$/);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Budi Santoso',
        whatsapp_number: '6281234567890',
        email: 'budi.santoso@example.com',
        model_id: seedModelId,
        variant_id: seedVariantId,
        color_id: seedColorId,
        city: 'Sidoarjo',
        district: 'Waru',
        message: 'Halo saya ingin menanyakan ketersediaan unit motor ini.',
      })
    );
  });
});
