import { z } from 'zod';

export type PromotionStatus = 'draft' | 'published' | 'archived';

export interface Promotion {
  id: string;
  title: string;
  slug: string;
  summary: string;
  details: string | null;
  imagePath: string | null;
  startsAt: string; // ISO 8601 timestamptz
  endsAt: string; // ISO 8601 timestamptz
  terms: string | null;
  status: PromotionStatus;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionEligibleModel {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  primaryImage: {
    storagePath: string;
    altText: string;
  } | null;
  startingPriceIdr: number | null;
}

export interface PromotionSummary {
  id: string;
  title: string;
  slug: string;
  summary: string;
  imagePath: string | null;
  startsAt: string;
  endsAt: string;
  status: PromotionStatus;
  ctaLabel: string | null;
  ctaUrl: string | null;
  eligibleModelCount: number;
}

export interface PromotionDetail extends Promotion {
  eligibleModels: PromotionEligibleModel[];
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  desktopImagePath: string;
  mobileImagePath: string | null;
  altText: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  startsAt: string | null; // ISO 8601 timestamptz or null
  endsAt: string | null; // ISO 8601 timestamptz or null
  sortOrder: number;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
}

export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Format UUID tidak valid'
  );

/**
 * Zod validation schema for creating a new promotion.
 */
export const createPromotionSchema = z
  .object({
    title: z.string().trim().min(3, 'Judul promo minimal 3 karakter').max(150),
    slug: z
      .string()
      .trim()
      .min(3, 'Slug minimal 3 karakter')
      .max(100)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug harus berupa huruf kecil, angka, dan tanda hubung (-)'
      ),
    summary: z.string().trim().min(10, 'Ringkasan promo minimal 10 karakter').max(300),
    details: z.string().trim().max(5000).nullable().optional(),
    imagePath: z.string().trim().max(500).nullable().optional(),
    startsAt: z
      .string()
      .datetime({ message: 'Waktu mulai harus dalam format ISO 8601 yang valid' }),
    endsAt: z
      .string()
      .datetime({ message: 'Waktu berakhir harus dalam format ISO 8601 yang valid' }),
    terms: z.string().trim().max(5000).nullable().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    ctaLabel: z.string().trim().max(50).nullable().optional(),
    ctaUrl: z.string().trim().max(500).nullable().optional(),
    modelIds: z.array(uuidSchema).default([]),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'Waktu berakhir promo harus setelah waktu mulai',
    path: ['endsAt'],
  });

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

/**
 * Zod validation schema for updating a promotion.
 */
export const updatePromotionSchema = z
  .object({
    id: uuidSchema,
    title: z.string().trim().min(3).max(150).optional(),
    slug: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    summary: z.string().trim().min(10).max(300).optional(),
    details: z.string().trim().max(5000).nullable().optional(),
    imagePath: z.string().trim().max(500).nullable().optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    terms: z.string().trim().max(5000).nullable().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    ctaLabel: z.string().trim().max(50).nullable().optional(),
    ctaUrl: z.string().trim().max(500).nullable().optional(),
    modelIds: z.array(uuidSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'Waktu berakhir promo harus setelah waktu mulai',
      path: ['endsAt'],
    }
  );

export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

/**
 * Zod validation schema for creating a hero banner.
 */
export const createHeroBannerSchema = z
  .object({
    title: z.string().trim().min(3, 'Judul spanduk minimal 3 karakter').max(150),
    subtitle: z.string().trim().max(250).nullable().optional(),
    desktopImagePath: z.string().trim().min(1, 'Gambar desktop wajib diisi').max(500),
    mobileImagePath: z.string().trim().max(500).nullable().optional(),
    altText: z.string().trim().min(3, 'Teks alternatif (alt) minimal 3 karakter').max(200),
    ctaLabel: z.string().trim().max(50).nullable().optional(),
    ctaUrl: z.string().trim().max(500).nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    sortOrder: z.number().int().default(0),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'Waktu berakhir spanduk harus setelah waktu mulai',
      path: ['endsAt'],
    }
  );

export type CreateHeroBannerInput = z.infer<typeof createHeroBannerSchema>;

export const updateHeroBannerSchema = z
  .object({
    id: z.string().uuid('ID spanduk tidak valid'),
    title: z.string().trim().min(3).max(150).optional(),
    subtitle: z.string().trim().max(250).nullable().optional(),
    desktopImagePath: z.string().trim().min(1).max(500).optional(),
    mobileImagePath: z.string().trim().max(500).nullable().optional(),
    altText: z.string().trim().min(3).max(200).optional(),
    ctaLabel: z.string().trim().max(50).nullable().optional(),
    ctaUrl: z.string().trim().max(500).nullable().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    sortOrder: z.number().int().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'Waktu berakhir spanduk harus setelah waktu mulai',
      path: ['endsAt'],
    }
  );

export type UpdateHeroBannerInput = z.infer<typeof updateHeroBannerSchema>;
