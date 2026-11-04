import { z } from 'zod';
import type { DealershipItem } from '@/types/settings';

export type { DealershipItem };

export const createDealershipSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama dealer minimal 3 karakter')
    .max(100, 'Nama dealer maksimal 100 karakter'),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Kode dealer minimal 3 karakter')
    .max(50, 'Kode dealer maksimal 50 karakter')
    .regex(
      /^[a-z0-9-]+$/,
      'Kode dealer hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)'
    ),
  city: z
    .string()
    .trim()
    .min(2, 'Kota/wilayah minimal 2 karakter')
    .max(100, 'Kota/wilayah maksimal 100 karakter'),
  address: z
    .string()
    .trim()
    .max(300, 'Alamat maksimal 300 karakter')
    .nullable()
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Nomor telepon maksimal 30 karakter')
    .nullable()
    .optional()
    .or(z.literal('')),
  whatsappNumber: z
    .string()
    .trim()
    .max(30, 'Nomor WhatsApp maksimal 30 karakter')
    .nullable()
    .optional()
    .or(z.literal('')),
  openingHours: z
    .string()
    .trim()
    .max(200, 'Jam operasional maksimal 200 karakter')
    .nullable()
    .optional()
    .or(z.literal('')),
  isSynthetic: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0, 'Urutan tampil minimal 0').default(0),
});

export const updateDealershipSchema = createDealershipSchema.extend({
  id: z.string().uuid('ID dealer tidak valid'),
});

export type CreateDealershipInput = z.infer<typeof createDealershipSchema>;
export type UpdateDealershipInput = z.infer<typeof updateDealershipSchema>;
