/**
 * Core Domain and Shared TypeScript Interfaces
 *
 * Rules:
 * - Identifiers, types, and property names are strictly in English.
 * - String constants and display values adhere to Indonesian conventions.
 */

export type MotorcycleCategory = 'matic' | 'cub' | 'sport' | 'ev' | 'bigbike';

export type PublishingStatus = 'draft' | 'published' | 'archived';

export interface DealershipSettings {
  dealerName: string;
  tagline: string;
  address: string;
  city: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  operatingHours: Record<string, string>;
  privacyNotice: string;
}

export interface PriceDisplay {
  amountIdr: number;
  priceType: 'otr' | 'cash' | 'promo';
  city: string;
  formattedAmount: string;
  disclaimer: string;
}

export interface LeadSubmissionPayload {
  fullName: string;
  whatsappNumber: string;
  email?: string;
  city: string;
  district?: string;
  modelId?: string;
  variantId?: string;
  colorId?: string;
  message?: string;
  privacyConsent: boolean;
}
