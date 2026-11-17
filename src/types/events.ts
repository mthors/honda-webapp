import { z } from 'zod';
import type { EventStatus } from './database';

export type { EventStatus };

// ============================================================================
// 1. DEALER LOCATION TYPES & SCHEMAS
// ============================================================================

export interface DealerLocationItem {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createDealerLocationSchema = z.object({
  name: z.string().trim().min(3, 'Nama dealer minimal 3 karakter.'),
  address: z.string().trim().min(5, 'Alamat dealer minimal 5 karakter.'),
  city: z.string().trim().min(2, 'Kota dealer minimal 2 karakter.'),
  phone: z.string().trim().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type CreateDealerLocationInput = z.infer<typeof createDealerLocationSchema>;

export const updateDealerLocationSchema = createDealerLocationSchema.extend({
  id: z.string().uuid('ID dealer tidak valid.'),
});

export type UpdateDealerLocationInput = z.infer<typeof updateDealerLocationSchema>;

// ============================================================================
// 2. EVENT TYPES & SCHEMAS
// ============================================================================

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  locationId: string;
  location?: DealerLocationItem | null;
  startAt: string;
  endAt: string;
  imageUrl: string | null;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export const createEventSchema = z
  .object({
    title: z.string().trim().min(3, 'Judul acara minimal 3 karakter.'),
    slug: z
      .string()
      .trim()
      .min(3, 'Slug acara minimal 3 karakter.')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.'
      ),
    description: z.string().trim().min(10, 'Deskripsi acara minimal 10 karakter.'),
    locationId: z.string().uuid('Pilih lokasi dealer yang valid.'),
    startAt: z
      .string()
      .min(1, 'Waktu mulai acara wajib diisi.')
      .refine((val) => !isNaN(Date.parse(val)), 'Format waktu mulai tidak valid.'),
    endAt: z
      .string()
      .min(1, 'Waktu selesai acara wajib diisi.')
      .refine((val) => !isNaN(Date.parse(val)), 'Format waktu selesai tidak valid.'),
    imageUrl: z.string().trim().nullable().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startAt).getTime();
      const end = new Date(data.endAt).getTime();
      return end > start;
    },
    {
      message: 'Waktu selesai acara harus lebih lambat dari waktu mulai.',
      path: ['endAt'],
    }
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    id: z.string().uuid('ID acara tidak valid.'),
    title: z.string().trim().min(3, 'Judul acara minimal 3 karakter.'),
    slug: z
      .string()
      .trim()
      .min(3, 'Slug acara minimal 3 karakter.')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.'
      ),
    description: z.string().trim().min(10, 'Deskripsi acara minimal 10 karakter.'),
    locationId: z.string().uuid('Pilih lokasi dealer yang valid.'),
    startAt: z
      .string()
      .min(1, 'Waktu mulai acara wajib diisi.')
      .refine((val) => !isNaN(Date.parse(val)), 'Format waktu mulai tidak valid.'),
    endAt: z
      .string()
      .min(1, 'Waktu selesai acara wajib diisi.')
      .refine((val) => !isNaN(Date.parse(val)), 'Format waktu selesai tidak valid.'),
    imageUrl: z.string().trim().nullable().optional(),
    status: z.enum(['draft', 'published']).default('draft'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startAt).getTime();
      const end = new Date(data.endAt).getTime();
      return end > start;
    },
    {
      message: 'Waktu selesai acara harus lebih lambat dari waktu mulai.',
      path: ['endAt'],
    }
  );

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
