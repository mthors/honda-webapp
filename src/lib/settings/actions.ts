'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/audit/logger';
import {
  updateSiteSettingsSchema,
  type UpdateSiteSettingsInput,
  type SiteSettings,
} from '@/types/settings';
import type { ActionResponse } from '@/lib/admin/actions';
import type { Database, Json } from '@/types/database';

export async function updateSiteSettingsAction(
  input: UpdateSiteSettingsInput
): Promise<ActionResponse<SiteSettings>> {
  try {
    // 1. Enforce admin authentication server-side
    const session = await requireAdmin();

    // 2. Validate input schema
    const parsed = updateSiteSettingsSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstErrorMessage =
        parsed.error.issues[0]?.message || 'Validasi formulir pengaturan grup gagal.';
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = parsed.data;
    const supabase = await createClient();

    // 3. Prepare structured social links and opening hours
    const socialLinksRecord: Record<string, string> = {};
    if (data.instagramUrl && data.instagramUrl.trim() !== '') {
      socialLinksRecord.instagram = data.instagramUrl.trim();
    }
    if (data.facebookUrl && data.facebookUrl.trim() !== '') {
      socialLinksRecord.facebook = data.facebookUrl.trim();
    }

    const openingHoursRecord: Record<string, string> = {};
    if (data.consultationHours && data.consultationHours.trim() !== '') {
      openingHoursRecord.consultation_hours = data.consultationHours.trim();
    }

    const updatePayload: Database['public']['Tables']['site_settings']['Update'] = {
      dealer_name: data.dealerName.trim(),
      whatsapp_number: data.whatsappNumber.trim(),
      public_email:
        data.publicEmail && data.publicEmail.trim() !== '' ? data.publicEmail.trim() : null,
      privacy_notice: data.privacyNotice.trim(),
      opening_hours: openingHoursRecord as unknown as Record<string, Json>,
      social_links: socialLinksRecord as unknown as Record<string, Json>,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    };

    // 4. Update the singleton row in site_settings
    const { data: updatedRow, error: updateError } = await supabase
      .from('site_settings')
      .update(updatePayload as never)
      .eq('id', 'default')
      .select('*')
      .single();

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: updateError?.message || 'Gagal menyimpan pengaturan grup ke basis data.',
      };
    }

    type RowType = Database['public']['Tables']['site_settings']['Row'];
    const r = updatedRow as unknown as RowType;

    const resultSettings: SiteSettings = {
      id: r.id,
      dealerName: r.dealer_name,
      logoPath: r.logo_path,
      address: r.address,
      city: r.city,
      phone: r.phone,
      whatsappNumber: r.whatsapp_number,
      publicEmail: r.public_email,
      openingHours: (r.opening_hours || {}) as Record<string, string>,
      socialLinks: (r.social_links || {}) as Record<string, string>,
      privacyNotice: r.privacy_notice,
      updatedBy: r.updated_by,
      updatedAt: r.updated_at,
    };

    // 5. Record immutable audit log entry
    await logAdminAction(
      {
        action: 'update_site_settings',
        entityType: 'site_settings',
        entityId: null,
        summary: `Pembaruan pengaturan grup dealer "${data.dealerName}" oleh ${session.profile.displayName}`,
        metadata: {
          dealer_name: data.dealerName,
          whatsapp_number: data.whatsappNumber,
          public_email: data.publicEmail || null,
        },
      },
      supabase
    );

    // 6. Revalidate cache
    revalidatePath('/admin/settings');
    revalidatePath('/');
    revalidatePath('/hubungi');

    return {
      success: true,
      data: resultSettings,
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    const message =
      err instanceof Error ? err.message : 'Terjadi kendala saat memproses pengaturan.';
    return {
      success: false,
      error: message,
    };
  }
}
