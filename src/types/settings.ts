import { z } from 'zod';

export interface SiteSettings {
  id: string;
  dealerName: string;
  logoPath: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsappNumber: string;
  publicEmail: string | null;
  openingHours: Record<string, string>;
  socialLinks: Record<string, string>;
  privacyNotice: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface DealershipItem {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  openingHours: string | null;
  isSynthetic: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const updateSiteSettingsSchema = z.object({
  dealerName: z
    .string()
    .trim()
    .min(3, 'Nama grup dealer minimal 3 karakter')
    .max(100, 'Nama grup dealer maksimal 100 karakter'),
  whatsappNumber: z
    .string()
    .trim()
    .min(9, 'Nomor WhatsApp resmi minimal 9 digit')
    .max(20, 'Nomor WhatsApp resmi maksimal 20 digit')
    .regex(/^[0-9+\s\-()]+$/, 'Format nomor WhatsApp tidak valid'),
  publicEmail: z
    .string()
    .trim()
    .email('Format alamat email publik tidak valid')
    .nullable()
    .optional()
    .or(z.literal('')),
  consultationHours: z
    .string()
    .trim()
    .max(200, 'Jam layanan konsultasi maksimal 200 karakter')
    .nullable()
    .optional()
    .or(z.literal('')),
  instagramUrl: z
    .string()
    .trim()
    .url('Format tautan Instagram harus berupa URL valid')
    .nullable()
    .optional()
    .or(z.literal('')),
  facebookUrl: z
    .string()
    .trim()
    .url('Format tautan Facebook harus berupa URL valid')
    .nullable()
    .optional()
    .or(z.literal('')),
  privacyNotice: z
    .string()
    .trim()
    .min(20, 'Teks kebijakan privasi minimal 20 karakter')
    .max(10000, 'Teks kebijakan privasi maksimal 10.000 karakter'),
});

export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;
