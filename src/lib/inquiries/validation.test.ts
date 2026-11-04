import { describe, it, expect } from 'vitest';
import { inquirySubmissionSchema } from './validation';

describe('Inquiry Submission Schema Validation', () => {
  const validPayload = {
    fullName: 'Budi Santoso',
    whatsappNumber: '081234567890',
    email: 'budi@example.com',
    city: 'Sidoarjo',
    district: 'Gedangan',
    modelId: 'a1111111-1111-4111-8111-111111111111',
    variantId: 'b2222222-2222-4222-8222-222222222222',
    colorId: 'c3333333-3333-4333-8333-333333333333',
    modelNameSnapshot: 'All New Honda Vario 160',
    variantNameSnapshot: 'CBS',
    colorNameSnapshot: 'Grande Matte Black',
    priceSnapshotIdr: 27350000,
    message: 'Apakah unit warna ini ready stock di dealer?',
    consentPrivacy: true,
    sourcePage: '/motor/vario-160',
  };

  it('successfully validates complete and valid inquiry submission', () => {
    const result = inquirySubmissionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Budi Santoso');
      // WhatsApp number normalized to 628...
      expect(result.data.whatsappNumber).toBe('6281234567890');
      expect(result.data.email).toBe('budi@example.com');
      expect(result.data.city).toBe('Sidoarjo');
      expect(result.data.consentPrivacy).toBe(true);
    }
  });

  it('validates minimal submission with optional fields omitted or empty', () => {
    const minimalPayload = {
      fullName: 'Siti Rahma',
      whatsappNumber: '6285712345678',
      city: 'Surabaya',
      consentPrivacy: true,
    };

    const result = inquirySubmissionSchema.safeParse(minimalPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe('Siti Rahma');
      expect(result.data.whatsappNumber).toBe('6285712345678');
      expect(result.data.email).toBeNull();
      expect(result.data.district).toBeNull();
      expect(result.data.modelId).toBeNull();
      expect(result.data.message).toBeNull();
    }
  });

  it('rejects short or empty full name with clear Indonesian error', () => {
    const result = inquirySubmissionSchema.safeParse({
      ...validPayload,
      fullName: 'A',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('minimal 2 karakter');
    }
  });

  it('validates Indonesian phone number formats and normalizes them', () => {
    const testCases = [
      { input: '08123456789', expected: '628123456789' },
      { input: '0812-3456-7890', expected: '6281234567890' },
      { input: '(0812) 3456-7890', expected: '6281234567890' },
      { input: '0812.3456.7890', expected: '6281234567890' },
      { input: '+62 (812) 3456-7890', expected: '6281234567890' },
      { input: '+6281234567890', expected: '6281234567890' },
      { input: '6281234567890', expected: '6281234567890' },
    ];

    for (const tc of testCases) {
      const res = inquirySubmissionSchema.safeParse({
        ...validPayload,
        whatsappNumber: tc.input,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.whatsappNumber).toBe(tc.expected);
      }
    }
  });

  it('rejects invalid or non-Indonesian mobile phone numbers', () => {
    const invalidPhones = [
      '12345',
      '0218941234', // Landline prefix
      '0712345678', // Non-mobile prefix
      'abcdefghijk',
      '0812', // Too short
    ];

    for (const phone of invalidPhones) {
      const res = inquirySubmissionSchema.safeParse({
        ...validPayload,
        whatsappNumber: phone,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Format nomor WhatsApp tidak valid');
      }
    }
  });

  it('accepts valid email and rejects malformed email when provided', () => {
    const invalidEmailRes = inquirySubmissionSchema.safeParse({
      ...validPayload,
      email: 'not-an-email',
    });
    expect(invalidEmailRes.success).toBe(false);
    if (!invalidEmailRes.success) {
      expect(invalidEmailRes.error.issues[0].message).toContain('Format alamat email tidak valid');
    }

    const emptyEmailRes = inquirySubmissionSchema.safeParse({
      ...validPayload,
      email: '',
    });
    expect(emptyEmailRes.success).toBe(true);
    if (emptyEmailRes.success) {
      expect(emptyEmailRes.data.email).toBeNull();
    }
  });

  it('rejects empty city / regency', () => {
    const res = inquirySubmissionSchema.safeParse({
      ...validPayload,
      city: '  ',
    });
    expect(res.success).toBe(false);
  });

  it('rejects submission when privacy consent is false', () => {
    const res = inquirySubmissionSchema.safeParse({
      ...validPayload,
      consentPrivacy: false,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain(
        'Persetujuan kebijakan privasi wajib dicentang'
      );
    }
  });

  it('rejects invalid UUIDs for modelId, variantId, and colorId', () => {
    const res = inquirySubmissionSchema.safeParse({
      ...validPayload,
      modelId: 'not-a-uuid',
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('ID model tidak valid');
    }
  });

  it('regression: accepts PostgreSQL UUIDs from database seed data with variant hex digits (c, d)', () => {
    const seedPayload = {
      ...validPayload,
      modelId: '33333333-3333-4333-c333-333333333301',
      variantId: '44444444-4444-4444-d444-444444444401',
      colorId: '22222222-2222-4222-b222-222222222201',
    };
    const res = inquirySubmissionSchema.safeParse(seedPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.modelId).toBe('33333333-3333-4333-c333-333333333301');
      expect(res.data.variantId).toBe('44444444-4444-4444-d444-444444444401');
      expect(res.data.colorId).toBe('22222222-2222-4222-b222-222222222201');
    }
  });

  it('regression: handles optional fields as empty strings or whitespace cleanly', () => {
    const emptyOptionalPayload = {
      fullName: 'Budi Santoso',
      whatsappNumber: '081234567890',
      email: '   ',
      city: 'Sidoarjo',
      district: '',
      modelId: '  ',
      variantId: '',
      colorId: '',
      modelNameSnapshot: ' ',
      variantNameSnapshot: '',
      colorNameSnapshot: '',
      message: '   ',
      consentPrivacy: true,
      sourcePage: '',
      sourceCampaign: '',
    };
    const res = inquirySubmissionSchema.safeParse(emptyOptionalPayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBeNull();
      expect(res.data.district).toBeNull();
      expect(res.data.modelId).toBeNull();
      expect(res.data.variantId).toBeNull();
      expect(res.data.colorId).toBeNull();
      expect(res.data.modelNameSnapshot).toBeNull();
      expect(res.data.variantNameSnapshot).toBeNull();
      expect(res.data.colorNameSnapshot).toBeNull();
      expect(res.data.message).toBeNull();
      expect(res.data.sourcePage).toBeNull();
      expect(res.data.sourceCampaign).toBeNull();
    }
  });

  it('regression: supports snake_case input payload and privacy timestamp aliases', () => {
    const snakePayload = {
      full_name: 'Dewi Lestari',
      whatsapp_number: '081298765432',
      city: 'Surabaya',
      district: 'Rungkut',
      model_id: '33333333-3333-4333-c333-333333333302',
      consent_privacy_at: '2026-11-03T16:00:00.000Z',
    };
    const res = inquirySubmissionSchema.safeParse(snakePayload);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.fullName).toBe('Dewi Lestari');
      expect(res.data.whatsappNumber).toBe('6281298765432');
      expect(res.data.consentPrivacy).toBe(true);
      expect(res.data.district).toBe('Rungkut');
      expect(res.data.modelId).toBe('33333333-3333-4333-c333-333333333302');
    }
  });
});
