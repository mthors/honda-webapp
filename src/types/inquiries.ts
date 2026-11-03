import type { LeadStatus } from '@/types/database';

export interface InquiryModelOption {
  id: string;
  name: string;
  slug: string;
  variants: Array<{
    id: string;
    name: string;
    code: string | null;
    priceIdr: number | null;
    colors: Array<{
      id: string;
      name: string;
      hexCode: string | null;
    }>;
  }>;
}

export interface InquirySubmissionInput {
  fullName: string;
  whatsappNumber: string;
  email?: string | null;
  city: string;
  district?: string | null;
  modelId?: string | null;
  variantId?: string | null;
  colorId?: string | null;
  modelNameSnapshot?: string | null;
  variantNameSnapshot?: string | null;
  colorNameSnapshot?: string | null;
  priceSnapshotIdr?: number | null;
  message?: string | null;
  consentPrivacy: boolean;
  sourcePage?: string | null;
  sourceCampaign?: string | null;
}

export interface InquirySubmissionResult {
  success: boolean;
  leadReference?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface AdminLeadItem {
  id: string;
  leadReference: string;
  fullName: string;
  whatsappNumber: string;
  email: string | null;
  city: string;
  district: string | null;
  modelId: string | null;
  variantId: string | null;
  colorId: string | null;
  modelNameSnapshot: string | null;
  variantNameSnapshot: string | null;
  colorNameSnapshot: string | null;
  priceSnapshotIdr: number | null;
  message: string | null;
  sourcePage: string | null;
  sourceCampaign: string | null;
  consentPrivacyAt: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLeadsFilterOptions {
  search?: string;
  status?: string;
  city?: string;
  limit?: number;
  offset?: number;
}
