import { z } from 'zod';
import type { DealershipItem } from './dealership';

/**
 * Geographical Province Entity
 */
export interface ProvinceItem {
  id: string; // stable slug, e.g. 'jawa-timur'
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Geographical Regency/City (Kabupaten / Kota) Entity
 */
export interface RegencyItem {
  id: string; // stable slug, e.g. 'kab-sidoarjo'
  provinceId: string;
  name: string;
  type: 'kabupaten' | 'kota';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Dealership Service Area Assignment Entity (Many-to-Many)
 */
export interface DealershipServiceAreaItem {
  id: string;
  dealershipId: string;
  regencyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  dealership?: DealershipItem | null;
  regency?: RegencyItem | null;
}

/**
 * Sales Representative Entity
 */
export interface SalesRepresentativeItem {
  id: string;
  dealershipId: string;
  name: string;
  whatsappNumber: string;
  photoUrl: string | null;
  position: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  dealership?: DealershipItem | null;
}

/**
 * Public Location Matching Result
 */
export interface PublicDealershipWithSales {
  dealership: DealershipItem;
  salesReps: SalesRepresentativeItem[];
}

/**
 * Standard Action Response Discriminated Union
 */
export type ActionResponse<T = unknown> =
  | { success: true; data: T; error?: never; fieldErrors?: never }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; data?: never };

/**
 * Aggregated Admin CMS Data Payload for /admin/sales
 */
export interface SalesManagementData {
  dealerships: DealershipItem[];
  provinces: ProvinceItem[];
  regencies: RegencyItem[];
  serviceAreas: DealershipServiceAreaItem[];
  salesReps: SalesRepresentativeItem[];
}

/**
 * Zod Schema for Sales Representative Creation / Updates
 */
export const salesRepresentativeFormSchema = z.object({
  dealershipId: z.string().uuid({ message: 'Pilih cabang dealer yang valid' }),
  name: z
    .string()
    .trim()
    .min(2, { message: 'Nama sales minimal 2 karakter' })
    .max(100, { message: 'Nama sales maksimal 100 karakter' }),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^(\+?62|08)[0-9\-\s]{8,15}$/, {
      message: 'Format nomor WhatsApp tidak valid (contoh: 08123456789 atau +628123456789)',
    }),
  photoUrl: z.string().trim().nullable().optional(),
  position: z
    .string()
    .trim()
    .max(100, { message: 'Jabatan maksimal 100 karakter' })
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0, { message: 'Urutan harus 0 atau lebih' }).default(0),
});

export type SalesRepresentativeFormValues = z.infer<typeof salesRepresentativeFormSchema>;

export const updateSalesRepresentativeSchema = salesRepresentativeFormSchema.extend({
  id: z.string().uuid({ message: 'ID sales representative tidak valid' }),
});

export type UpdateSalesRepresentativeInput = z.input<typeof updateSalesRepresentativeSchema>;
export type CreateSalesRepresentativeInput = z.input<typeof salesRepresentativeFormSchema>;

/**
 * Zod Schema for Dealership Service Area Assignment
 */
export const serviceAreaAssignmentSchema = z.object({
  dealershipId: z.string().uuid({ message: 'ID dealer tidak valid' }),
  regencyId: z.string().trim().min(2, { message: 'Pilih wilayah kota/kabupaten yang valid' }),
  isActive: z.boolean().default(true),
});

export type ServiceAreaAssignmentValues = z.infer<typeof serviceAreaAssignmentSchema>;
export type CreateServiceAreaInput = z.input<typeof serviceAreaAssignmentSchema>;

export const batchAssignServiceAreasSchema = z.object({
  dealershipId: z.string().uuid({ message: 'ID dealer tidak valid' }),
  regencyIds: z
    .array(z.string().trim().min(2))
    .min(1, { message: 'Pilih minimal satu wilayah kabupaten/kota' }),
});

export type BatchAssignServiceAreasInput = z.infer<typeof batchAssignServiceAreasSchema>;
