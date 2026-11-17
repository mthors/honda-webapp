import { z } from 'zod';
import type { EventStatus } from './database';
import type { DealershipItem } from './dealership';

export type { EventStatus, DealershipItem };

/** Backward-compatible interface for branch/location references */
export interface DealerLocationItem {
  id: string;
  name: string;
  address: string | null;
  city: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  code?: string | null;
  whatsappNumber?: string | null;
  openingHours?: string | null;
  isSynthetic?: boolean;
  sortOrder?: number;
}

// ============================================================================
// EVENT TYPES & SCHEMAS (Consolidated with canonical public.dealerships)
// ============================================================================

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  dealershipId: string;
  dealership?: DealershipItem | null;
  /** @deprecated Backward-compatible alias for dealershipId */
  locationId?: string;
  /** @deprecated Backward-compatible alias for dealership */
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
    dealershipId: z.string().uuid('Pilih dealer resmi yang valid.').optional(),
    locationId: z.string().uuid('Pilih dealer resmi yang valid.').optional(),
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
  .refine((data) => Boolean(data.dealershipId || data.locationId), {
    message: 'Pilih dealer resmi yang valid.',
    path: ['dealershipId'],
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
    dealershipId: z.string().uuid('Pilih dealer resmi yang valid.').optional(),
    locationId: z.string().uuid('Pilih dealer resmi yang valid.').optional(),
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
  .refine((data) => Boolean(data.dealershipId || data.locationId), {
    message: 'Pilih dealer resmi yang valid.',
    path: ['dealershipId'],
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
