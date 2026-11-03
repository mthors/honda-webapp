import { z } from 'zod';
import { normalizeIndonesianPhone } from '@/lib/formatters';

const indonesianPhoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const optionalUuidSchema = (errorMessage: string) =>
  z
    .union([
      z
        .string()
        .trim()
        .refine((val) => !val || uuidRegex.test(val), { message: errorMessage }),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null));

const baseSchema = z.object({
  fullName: z
    .string({
      message: 'Nama lengkap wajib diisi.',
    })
    .trim()
    .min(2, { message: 'Nama lengkap minimal 2 karakter.' })
    .max(100, { message: 'Nama lengkap maksimal 100 karakter.' }),

  whatsappNumber: z
    .string({
      message: 'Nomor WhatsApp wajib diisi.',
    })
    .trim()
    .refine((val) => indonesianPhoneRegex.test(val.replace(/\s|-/g, '')), {
      message:
        'Format nomor WhatsApp tidak valid. Gunakan nomor ponsel aktif (contoh: 081234567890).',
    })
    .transform((val) => normalizeIndonesianPhone(val)),

  email: z
    .union([
      z
        .string()
        .trim()
        .max(255, { message: 'Email maksimal 255 karakter.' })
        .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
          message: 'Format alamat email tidak valid.',
        }),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  city: z
    .string({
      message: 'Kota / Kabupaten domisili wajib diisi.',
    })
    .trim()
    .min(2, { message: 'Kota / Kabupaten minimal 2 karakter.' })
    .max(100, { message: 'Kota / Kabupaten maksimal 100 karakter.' }),

  district: z
    .union([
      z.string().trim().max(100, { message: 'Kecamatan maksimal 100 karakter.' }),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  modelId: optionalUuidSchema('ID model tidak valid.'),

  variantId: optionalUuidSchema('ID varian tidak valid.'),

  colorId: optionalUuidSchema('ID warna tidak valid.'),

  modelNameSnapshot: z
    .union([z.string().trim().max(150), z.null(), z.undefined()])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  variantNameSnapshot: z
    .union([z.string().trim().max(150), z.null(), z.undefined()])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  colorNameSnapshot: z
    .union([z.string().trim().max(150), z.null(), z.undefined()])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  priceSnapshotIdr: z
    .union([
      z.number().int().nonnegative(),
      z
        .string()
        .trim()
        .regex(/^\d+$/)
        .transform((v) => parseInt(v, 10)),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => (typeof val === 'number' && !isNaN(val) ? val : null)),

  message: z
    .union([
      z.string().trim().max(1000, { message: 'Pesan pertanyaan maksimal 1000 karakter.' }),
      z.null(),
      z.undefined(),
    ])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  consentPrivacy: z
    .union([
      z.boolean(),
      z.string().transform((val) => val === 'true' || val === 'on' || val === '1'),
    ])
    .refine((val) => val === true, {
      message: 'Persetujuan kebijakan privasi wajib dicentang untuk mengirim pertanyaan.',
    }),

  sourcePage: z
    .union([z.string().trim().max(255), z.null(), z.undefined()])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  sourceCampaign: z
    .union([z.string().trim().max(100), z.null(), z.undefined()])
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export const inquirySubmissionSchema = z.preprocess((raw: unknown) => {
  if (typeof raw !== 'object' || raw === null) return raw;
  const obj = raw as Record<string, unknown>;
  return {
    fullName: obj.fullName ?? obj.full_name,
    whatsappNumber: obj.whatsappNumber ?? obj.whatsapp_number,
    email: obj.email,
    city: obj.city,
    district: obj.district,
    modelId: obj.modelId ?? obj.model_id,
    variantId: obj.variantId ?? obj.variant_id,
    colorId: obj.colorId ?? obj.color_id,
    modelNameSnapshot: obj.modelNameSnapshot ?? obj.model_name_snapshot,
    variantNameSnapshot: obj.variantNameSnapshot ?? obj.variant_name_snapshot,
    colorNameSnapshot: obj.colorNameSnapshot ?? obj.color_name_snapshot,
    priceSnapshotIdr: obj.priceSnapshotIdr ?? obj.price_snapshot_idr,
    message: obj.message,
    consentPrivacy:
      obj.consentPrivacy ??
      obj.consent_privacy ??
      (obj.consentPrivacyAt || obj.consent_privacy_at ? true : undefined),
    sourcePage: obj.sourcePage ?? obj.source_page,
    sourceCampaign: obj.sourceCampaign ?? obj.source_campaign,
  };
}, baseSchema);

export type InquirySubmissionValidated = z.infer<typeof baseSchema>;
