'use server';

import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { createServiceClient } from '@/lib/supabase/server';
import { inquirySubmissionSchema } from '@/lib/inquiries/validation';
import {
  checkRateLimit,
  recordRateLimitSubmission,
  isDuplicateSubmission,
  recordDuplicateSubmission,
} from '@/lib/inquiries/rate-limiter';
import type { InquirySubmissionResult } from '@/types/inquiries';

type ClientType = SupabaseClient<Database>;

/**
 * Generates a human-friendly unique lead reference.
 * Example: INQ-20261103-8F4A
 */
export async function generateLeadReference(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateSegment = `${year}${month}${day}`;

  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    rand += chars[idx];
  }

  return `INQ-${dateSegment}-${rand}`;
}

/**
 * Server action to process and save a customer motorcycle inquiry.
 */
export async function submitInquiryAction(
  rawInput: unknown,
  clientOverride?: ClientType
): Promise<InquirySubmissionResult> {
  try {
    // 1. Identify Client for Rate Limiting
    let clientIp = '127.0.0.1';
    try {
      const headerList = await headers();
      clientIp =
        headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
        headerList.get('x-real-ip') ||
        '127.0.0.1';
    } catch {
      // In non-HTTP or isolated testing context, fallback to localhost IP
      clientIp = '127.0.0.1';
    }

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Terlalu banyak permintaan pengiriman. Silakan tunggu ${rateLimit.retryAfterSeconds ?? 60} detik sebelum mencoba kembali.`,
      };
    }

    // 2. Validate input schema with Zod
    const parsed = inquirySubmissionSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const pathKey = issue.path[0] ? String(issue.path[0]) : 'form';
        if (!fieldErrors[pathKey]) {
          fieldErrors[pathKey] = [];
        }
        fieldErrors[pathKey].push(issue.message);
      }

      console.warn(
        '[Inquiry Validation Failed]',
        JSON.stringify(
          parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            code: i.code,
            message: i.message,
          }))
        )
      );

      return {
        success: false,
        error: 'Mohon periksa kembali formulir Anda. Beberapa data belum valid.',
        fieldErrors,
      };
    }

    const data = parsed.data;

    // 3. Duplicate Submission Guard (60s window)
    if (isDuplicateSubmission(data.whatsappNumber, data.city, data.modelNameSnapshot)) {
      return {
        success: false,
        error:
          'Pertanyaan yang sama baru saja dikirimkan. Silakan tunggu sejenak atau lanjutkan konsultasi melalui WhatsApp.',
      };
    }

    // 4. Database Validation for Model / Variant / Color Consistency (T09)
    const supabase = clientOverride ?? createServiceClient();

    let resolvedModelName = data.modelNameSnapshot;
    let resolvedVariantName = data.variantNameSnapshot;
    let resolvedColorName = data.colorNameSnapshot;
    let resolvedPriceIdr = data.priceSnapshotIdr;

    if (data.modelId) {
      const { data: rawModel, error: modelErr } = await supabase
        .from('motorcycle_models')
        .select('id, name, status')
        .eq('id', data.modelId)
        .maybeSingle();

      const modelRow = rawModel as { id: string; name: string; status: string } | null;

      if (modelErr || !modelRow || modelRow.status !== 'published') {
        return {
          success: false,
          error: 'Model sepeda motor yang dipilih tidak ditemukan atau belum dipublikasikan.',
          fieldErrors: {
            modelId: ['Pilihan model motor tidak valid.'],
          },
        };
      }
      resolvedModelName = modelRow.name;
    }

    if (data.variantId) {
      if (!data.modelId) {
        return {
          success: false,
          error: 'Varian tidak dapat dipilih tanpa menentukan model motor terlebih dahulu.',
          fieldErrors: {
            variantId: ['Model motor belum dipilih.'],
          },
        };
      }

      const { data: rawVariant, error: variantErr } = await supabase
        .from('motorcycle_variants')
        .select('id, name, model_id, status')
        .eq('id', data.variantId)
        .eq('model_id', data.modelId)
        .maybeSingle();

      const variantRow = rawVariant as {
        id: string;
        name: string;
        model_id: string;
        status: string;
      } | null;

      if (variantErr || !variantRow || variantRow.status !== 'active') {
        return {
          success: false,
          error: 'Varian tipe motor yang dipilih tidak sesuai dengan model.',
          fieldErrors: {
            variantId: ['Kombinasi model dan varian tidak valid.'],
          },
        };
      }
      resolvedVariantName = variantRow.name;

      // Check current price if price snapshot is not explicitly set
      if (!resolvedPriceIdr) {
        const today = new Date().toISOString().split('T')[0];
        const { data: rawPrice } = await supabase
          .from('price_entries')
          .select('amount_idr')
          .eq('variant_id', data.variantId)
          .eq('is_published', true)
          .lte('valid_from', today)
          .or(`valid_until.is.null,valid_until.gte.${today}`)
          .order('valid_from', { ascending: false })
          .limit(1)
          .maybeSingle();

        const priceRow = rawPrice as { amount_idr: number } | null;

        if (priceRow) {
          resolvedPriceIdr = priceRow.amount_idr;
        }
      }
    }

    if (data.colorId) {
      if (!data.variantId) {
        return {
          success: false,
          error: 'Pilihan warna tidak dapat ditentukan tanpa memilih varian terlebih dahulu.',
          fieldErrors: {
            colorId: ['Varian tipe motor belum dipilih.'],
          },
        };
      }

      const { data: colorRel, error: colorErr } = await supabase
        .from('variant_colors')
        .select('variant_id, color_id, is_available, color:colors(id, name)')
        .eq('variant_id', data.variantId)
        .eq('color_id', data.colorId)
        .eq('is_available', true)
        .maybeSingle();

      type ColorRelRow = {
        variant_id: string;
        color_id: string;
        is_available: boolean;
        color: { id: string; name: string } | null;
      };

      const rel = colorRel as unknown as ColorRelRow | null;

      if (colorErr || !rel || !rel.color) {
        return {
          success: false,
          error:
            'Pilihan warna tidak sesuai dengan varian yang dipilih atau sedang tidak tersedia.',
          fieldErrors: {
            colorId: ['Kombinasi varian dan warna tidak valid.'],
          },
        };
      }
      resolvedColorName = rel.color.name;
    }

    // 5. Generate Lead Reference
    const leadReference = await generateLeadReference();
    const consentPrivacyAt = new Date().toISOString();

    // 6. Insert Lead Record via Privileged Service Client
    const insertPayload: Database['public']['Tables']['leads']['Insert'] = {
      lead_reference: leadReference,
      full_name: data.fullName,
      whatsapp_number: data.whatsappNumber,
      email: data.email,
      city: data.city,
      district: data.district,
      model_id: data.modelId,
      variant_id: data.variantId,
      color_id: data.colorId,
      model_name_snapshot: resolvedModelName,
      variant_name_snapshot: resolvedVariantName,
      color_name_snapshot: resolvedColorName,
      price_snapshot_idr: resolvedPriceIdr,
      message: data.message,
      source_page: data.sourcePage || '/hubungi',
      source_campaign: data.sourceCampaign,
      consent_privacy_at: consentPrivacyAt,
      status: 'new',
    };

    const { error: insertErr } = await (
      supabase.from('leads') as unknown as {
        insert: (record: Database['public']['Tables']['leads']['Insert']) => Promise<{
          error: { message: string } | null;
        }>;
      }
    ).insert(insertPayload);

    if (insertErr) {
      console.error('Database error saving customer lead:', insertErr.message);
      return {
        success: false,
        error:
          'Terjadi kendala sistem saat menyimpan data pertanyaan Anda. Silakan coba kembali beberapa saat lagi.',
      };
    }

    // 7. Record successful submission for rate limiting and duplicate prevention
    recordRateLimitSubmission(clientIp);
    recordDuplicateSubmission(data.whatsappNumber, data.city, resolvedModelName);

    return {
      success: true,
      leadReference,
    };
  } catch (err) {
    console.error('Unexpected error in submitInquiryAction:', err);
    return {
      success: false,
      error:
        'Terjadi gangguan komunikasi dengan server. Silakan muat ulang halaman dan coba kembali.',
    };
  }
}
