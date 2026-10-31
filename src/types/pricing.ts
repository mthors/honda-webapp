import { z } from 'zod';

export type PriceType = 'otr' | 'cash' | 'promo';

export interface PriceEntry {
  id: string;
  variantId: string;
  city: string | null;
  branchId: string | null;
  priceType: PriceType;
  amountIdr: number;
  validFrom: string; // ISO date format: YYYY-MM-DD
  validUntil: string | null; // ISO date format: YYYY-MM-DD or null (open-ended)
  isPublished: boolean;
  sourceNote: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PriceDateRange {
  validFrom: string;
  validUntil: string | null;
}

export interface PriceConflictCandidate extends PriceDateRange {
  id?: string;
  variantId: string;
  city?: string | null;
  priceType: PriceType;
  isPublished?: boolean;
}

export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Format UUID tidak valid'
  );

/**
 * Zod schema for validating ISO 8601 YYYY-MM-DD date strings.
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus berupa YYYY-MM-DD')
  .refine((val) => {
    const [year, month, day] = val.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Tanggal tidak valid menurut kalender');

/**
 * Zod validation schema for creating a new price entry.
 */
export const createPriceEntrySchema = z
  .object({
    variantId: uuidSchema,
    city: z.string().trim().max(100).nullable().optional(),
    branchId: uuidSchema.nullable().optional(),
    priceType: z.enum(['otr', 'cash', 'promo'], {
      message: 'Tipe harga harus salah satu dari: otr, cash, promo',
    }),
    amountIdr: z
      .number({ message: 'Nominal harga harus berupa angka' })
      .int('Nominal harga harus berupa bilangan bulat')
      .positive('Nominal harga harus lebih besar dari 0'),
    validFrom: dateStringSchema,
    validUntil: dateStringSchema.nullable().optional(),
    isPublished: z.boolean().default(false),
    sourceNote: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.validUntil) return true;
      return data.validUntil >= data.validFrom;
    },
    {
      message:
        'Tanggal akhir berlaku (valid_until) tidak boleh mendahului tanggal mulai (valid_from)',
      path: ['validUntil'],
    }
  );

export type CreatePriceEntryInput = z.infer<typeof createPriceEntrySchema>;

/**
 * Zod validation schema for updating an existing price entry.
 */
export const updatePriceEntrySchema = z
  .object({
    id: uuidSchema,
    variantId: uuidSchema.optional(),
    city: z.string().trim().max(100).nullable().optional(),
    branchId: uuidSchema.nullable().optional(),
    priceType: z.enum(['otr', 'cash', 'promo']).optional(),
    amountIdr: z
      .number()
      .int('Nominal harga harus berupa bilangan bulat')
      .positive('Nominal harga harus lebih besar dari 0')
      .optional(),
    validFrom: dateStringSchema.optional(),
    validUntil: dateStringSchema.nullable().optional(),
    isPublished: z.boolean().optional(),
    sourceNote: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.validFrom && data.validUntil) {
        return data.validUntil >= data.validFrom;
      }
      return true;
    },
    {
      message: 'Tanggal akhir berlaku tidak boleh mendahului tanggal mulai',
      path: ['validUntil'],
    }
  );

export type UpdatePriceEntryInput = z.infer<typeof updatePriceEntrySchema>;

/**
 * Filter options for public price list browsing.
 */
export interface PriceListFilterOptions {
  categorySlug?: string;
  city?: string;
  search?: string;
}

/**
 * Presentation item for public price table/grid.
 */
export interface CatalogPriceListItem {
  modelId: string;
  modelName: string;
  modelSlug: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  variantId: string;
  variantName: string;
  engineCc: number | null;
  transmission: string | null;
  primaryImage: {
    storagePath: string;
    altText: string;
  } | null;
  activePrice: {
    id: string;
    amountIdr: number;
    priceType: PriceType;
    city: string;
    validFrom: string;
    validUntil: string | null;
  } | null;
}

/**
 * Grouped category section for the public price list page.
 */
export interface CategoryPriceGroup {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categorySortOrder: number;
  items: CatalogPriceListItem[];
}
