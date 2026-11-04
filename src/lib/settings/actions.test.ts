import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateSiteSettingsAction } from './actions';
import * as adminAuth from '@/lib/auth/admin';
import * as serverSupabase from '@/lib/supabase/server';
import * as auditLogger from '@/lib/audit/logger';
import { revalidatePath } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Settings Management Actions — updateSiteSettingsAction', () => {
  const mockAdminSession = {
    user: { id: 'admin-uuid-1', email: 'admin@satryagroup.co.id' },
    profile: {
      userId: 'admin-uuid-1',
      displayName: 'Super Admin',
      role: 'admin' as const,
      isActive: true,
    },
  };

  const validSettingsInput = {
    dealerName: 'Honda Satrya Dealer Group',
    whatsappNumber: '6281234567890',
    publicEmail: 'info@satryagroup.co.id',
    consultationHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
    instagramUrl: 'https://instagram.com/hondasatryagroup',
    facebookUrl: 'https://facebook.com/hondasatryagroup',
    privacyNotice:
      'Kebijakan Privasi Honda Satrya Dealer Group: Kami berkomitmen untuk melindungi data privasi pelanggan.',
  };

  const mockDbRow = {
    id: 'default',
    dealer_name: validSettingsInput.dealerName,
    logo_path: null,
    address: null,
    city: null,
    phone: null,
    whatsapp_number: validSettingsInput.whatsappNumber,
    public_email: validSettingsInput.publicEmail,
    opening_hours: { consultation_hours: validSettingsInput.consultationHours },
    social_links: {
      instagram: validSettingsInput.instagramUrl,
      facebook: validSettingsInput.facebookUrl,
    },
    privacy_notice: validSettingsInput.privacyNotice,
    updated_by: 'admin-uuid-1',
    updated_at: '2026-11-04T08:00:00.000Z',
  };

  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockEq = vi.fn(() => ({ select: mockSelect }));
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ update: mockUpdate }));

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(
      mockAdminSession as adminAuth.AuthenticatedAdminSession
    );

    mockSingle.mockResolvedValue({
      data: mockDbRow,
      error: null,
    });

    vi.spyOn(serverSupabase, 'createClient').mockResolvedValue({
      from: mockFrom,
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);

    vi.spyOn(auditLogger, 'logAdminAction').mockResolvedValue({
      success: true,
      logId: 'audit-log-uuid-1',
    });
  });

  it('rejects mutation when user is unauthorized', async () => {
    vi.spyOn(adminAuth, 'requireAdmin').mockRejectedValueOnce(
      new Error('NEXT_REDIRECT:/admin/login')
    );

    await expect(updateSiteSettingsAction(validSettingsInput)).rejects.toThrow(
      'NEXT_REDIRECT:/admin/login'
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rejects invalid inputs server-side with structured field errors', async () => {
    const invalidInput = {
      dealerName: 'AB', // too short
      whatsappNumber: 'invalid-wa', // invalid characters
      publicEmail: 'not-an-email', // invalid email
      consultationHours: '',
      instagramUrl: 'not-a-url', // invalid url
      facebookUrl: '',
      privacyNotice: 'Too short', // < 20 chars
    };

    const result = await updateSiteSettingsAction(invalidInput);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.dealerName).toBeDefined();
    expect(result.fieldErrors?.whatsappNumber).toBeDefined();
    expect(result.fieldErrors?.publicEmail).toBeDefined();
    expect(result.fieldErrors?.instagramUrl).toBeDefined();
    expect(result.fieldErrors?.privacyNotice).toBeDefined();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('successfully updates site_settings and records an audit log entry', async () => {
    const result = await updateSiteSettingsAction(validSettingsInput);

    expect(result.success).toBe(true);
    expect(result.data?.dealerName).toBe(validSettingsInput.dealerName);
    expect(result.data?.whatsappNumber).toBe(validSettingsInput.whatsappNumber);

    // Verify DB update targeted singleton 'default' row
    expect(mockFrom).toHaveBeenCalledWith('site_settings');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        dealer_name: validSettingsInput.dealerName,
        whatsapp_number: validSettingsInput.whatsappNumber,
        public_email: validSettingsInput.publicEmail,
        privacy_notice: validSettingsInput.privacyNotice,
        updated_by: 'admin-uuid-1',
      })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'default');

    // Verify audit log call
    expect(auditLogger.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update_site_settings',
        entityType: 'site_settings',
        summary: expect.stringContaining('Honda Satrya Dealer Group'),
      }),
      expect.anything()
    );

    // Verify cache revalidation
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/settings');
    expect(revalidatePath).toHaveBeenCalledWith('/hubungi');
  });

  it('handles database update errors gracefully', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
    });

    const result = await updateSiteSettingsAction(validSettingsInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Database connection failed');
  });
});
