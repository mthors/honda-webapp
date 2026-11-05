import { z } from 'zod';
import type { MotorcycleStatus, VariantStatus, ImageRole } from '@/types/database';

export type ModelStatus = MotorcycleStatus;
export type { VariantStatus, ImageRole };

export const variantInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Nama varian wajib diisi.').max(100, 'Nama varian maksimal 100 karakter.'),
  code: z.string().trim().max(50, 'Kode tipe maksimal 50 karakter.').nullish(),
  description: z.string().trim().nullish(),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  colorIds: z.array(z.string().uuid()).default([]),
});

export const imageInputSchema = z.object({
  id: z.string().uuid().optional(),
  storagePath: z.string().trim().min(1, 'Path file gambar wajib diisi.'),
  altText: z.string().trim().min(1, 'Teks deskripsi gambar (alt) wajib diisi.').max(200, 'Teks alt maksimal 200 karakter.'),
  imageRole: z.enum(['hero', 'card', 'gallery', 'color']).default('gallery'),
  sortOrder: z.coerce.number().int().default(0),
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createMotorcycleModelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama model motor minimal 2 karakter.')
    .max(120, 'Nama model motor maksimal 120 karakter.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug minimal 2 karakter.')
    .max(120, 'Slug maksimal 120 karakter.')
    .regex(slugRegex, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (kebab-case).'),
  categoryId: z.string().uuid('Kategori motor wajib dipilih.'),
  shortDescription: z.string().trim().max(300, 'Ringkasan singkat maksimal 300 karakter.').nullish(),
  description: z.string().trim().nullish(),
  engineCc: z
    .coerce
    .number()
    .int('Kapasitas mesin harus berupa bilangan bulat.')
    .positive('Kapasitas mesin harus lebih besar dari 0.')
    .nullish(),
  transmission: z.string().trim().max(60, 'Tipe transmisi maksimal 60 karakter.').nullish(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seoTitle: z.string().trim().max(160, 'Judul SEO maksimal 160 karakter.').nullish(),
  seoDescription: z.string().trim().max(250, 'Deskripsi SEO maksimal 250 karakter.').nullish(),
  variants: z.array(variantInputSchema).default([]),
  images: z.array(imageInputSchema).default([]),
});

export const updateMotorcycleModelSchema = createMotorcycleModelSchema.extend({
  id: z.string().uuid('ID model tidak valid.'),
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type ImageInput = z.infer<typeof imageInputSchema>;
export type CreateMotorcycleModelInput = z.infer<typeof createMotorcycleModelSchema>;
export type UpdateMotorcycleModelInput = z.infer<typeof updateMotorcycleModelSchema>;

export interface AdminMotorcycleItem {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  shortDescription: string | null;
  engineCc: number | null;
  transmission: string | null;
  isFeatured: boolean;
  isNew: boolean;
  status: ModelStatus;
  publishedAt: string | null;
  primaryImage: {
    storagePath: string;
    altText: string;
  } | null;
  variantCount: number;
  imageCount: number;
  startingPriceIdr: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryOption {
  id: string;
  name: string;
  slug: string;
}

export interface AdminColorOption {
  id: string;
  name: string;
  slug: string;
  hexCode: string | null;
}

export interface AdminMotorcycleDetail extends AdminMotorcycleItem {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: Array<{
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    sortOrder: number;
    status: VariantStatus;
    colorIds: string[];
  }>;
  images: Array<{
    id: string;
    storagePath: string;
    altText: string;
    imageRole: ImageRole;
    sortOrder: number;
  }>;
}
