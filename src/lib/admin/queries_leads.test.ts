import { describe, it, expect, vi } from 'vitest';
import { getAdminLeads, getAdminLeadById } from './queries';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

describe('Admin Leads Queries', () => {
  const sampleDbRows = [
    {
      id: 'lead-1',
      lead_reference: 'INQ-20261103-A1B2',
      full_name: 'Budi Santoso',
      whatsapp_number: '6281234567890',
      email: 'budi@example.com',
      city: 'Sidoarjo',
      district: 'Waru',
      model_id: 'm-1',
      variant_id: 'v-1',
      color_id: 'c-1',
      model_name_snapshot: 'All New Honda Vario 160',
      variant_name_snapshot: 'CBS',
      color_name_snapshot: 'Grande Matte Black',
      price_snapshot_idr: 27350000,
      credit_down_payment_idr: null,
      credit_tenor_months: null,
      credit_estimated_installment_idr: null,
      credit_config_snapshot: null,
      message: 'Tanya diskon.',
      source_page: '/motor/vario-160',
      source_campaign: null,
      consent_privacy_at: '2026-11-03T10:00:00Z',
      status: 'new' as const,
      assigned_to: null,
      created_at: '2026-11-03T10:00:00Z',
      updated_at: '2026-11-03T10:00:00Z',
      closed_at: null,
    },
  ];

  it('loads and maps leads correctly', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: sampleDbRows,
            error: null,
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const leads = await getAdminLeads({}, mockClient);

    expect(leads).toHaveLength(1);
    expect(leads[0].leadReference).toBe('INQ-20261103-A1B2');
    expect(leads[0].fullName).toBe('Budi Santoso');
    expect(leads[0].whatsappNumber).toBe('6281234567890');
    expect(leads[0].city).toBe('Sidoarjo');
    expect(leads[0].status).toBe('new');
    expect(leads[0].modelNameSnapshot).toBe('All New Honda Vario 160');
  });

  it('applies status and city filters when provided', async () => {
    const eqMock = vi.fn().mockReturnThis();
    const ilikeMock = vi.fn().mockReturnThis();

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: eqMock,
            ilike: ilikeMock,
            then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    await getAdminLeads({ status: 'new', city: 'Sidoarjo' }, mockClient);

    expect(eqMock).toHaveBeenCalledWith('status', 'new');
    expect(ilikeMock).toHaveBeenCalledWith('city', '%Sidoarjo%');
  });

  it('loads a single lead by UUID', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: sampleDbRows[0],
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const lead = await getAdminLeadById('lead-1', mockClient);

    expect(lead).not.toBeNull();
    expect(lead?.id).toBe('lead-1');
    expect(lead?.fullName).toBe('Budi Santoso');
  });

  it('handles database errors gracefully by returning empty array', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database query error' },
          }),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    const leads = await getAdminLeads({}, mockClient);
    expect(leads).toEqual([]);
  });

  describe('Search input hardening in getAdminLeads', () => {
    it('applies double-quoted PostgREST search filter for normal queries across name, phone, ref, city, and model', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: 'Budi' }, mockClient);
      expect(orMock).toHaveBeenCalledWith(
        'full_name.ilike."%Budi%",whatsapp_number.ilike."%Budi%",lead_reference.ilike."%Budi%",city.ilike."%Budi%",model_name_snapshot.ilike."%Budi%"'
      );
    });

    it('searches by motorcycle model name snapshot to align UI and export results', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: 'Vario 160' }, mockClient);
      expect(orMock).toHaveBeenCalledWith(
        'full_name.ilike."%Vario 160%",whatsapp_number.ilike."%Vario 160%",lead_reference.ilike."%Vario 160%",city.ilike."%Vario 160%",model_name_snapshot.ilike."%Vario 160%"'
      );
    });

    it('preserves commas and parentheses within double quotes without splitting logic tree', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: 'Sidoarjo, (Waru)' }, mockClient);
      expect(orMock).toHaveBeenCalledWith(
        'full_name.ilike."%Sidoarjo, (Waru)%",whatsapp_number.ilike."%Sidoarjo, (Waru)%",lead_reference.ilike."%Sidoarjo, (Waru)%",city.ilike."%Sidoarjo, (Waru)%",model_name_snapshot.ilike."%Sidoarjo, (Waru)%"'
      );
    });

    it('escapes SQL ILIKE wildcards (% and _) to treat them as literal characters', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: '100% Promo_Honda' }, mockClient);
      expect(orMock).toHaveBeenCalledWith(
        'full_name.ilike."%100\\\\% Promo\\\\_Honda%",whatsapp_number.ilike."%100\\\\% Promo\\\\_Honda%",lead_reference.ilike."%100\\\\% Promo\\\\_Honda%",city.ilike."%100\\\\% Promo\\\\_Honda%",model_name_snapshot.ilike."%100\\\\% Promo\\\\_Honda%"'
      );
    });

    it('escapes double quotes to prevent terminating the PostgREST string literal', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: 'Vario "Street"' }, mockClient);
      expect(orMock).toHaveBeenCalledWith(
        'full_name.ilike."%Vario \\"Street\\"%",whatsapp_number.ilike."%Vario \\"Street\\"%",lead_reference.ilike."%Vario \\"Street\\"%",city.ilike."%Vario \\"Street\\"%",model_name_snapshot.ilike."%Vario \\"Street\\"%"'
      );
    });

    it('preserves punctuation-only queries as literal filters and does not silently omit search', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: ',' }, mockClient);
      expect(orMock).toHaveBeenCalledWith(
        'full_name.ilike."%,%",whatsapp_number.ilike."%,%",lead_reference.ilike."%,%",city.ilike."%,%",model_name_snapshot.ilike."%,%"'
      );
    });

    it('omits .or() filter when search is empty or whitespace-only', async () => {
      const orMock = vi.fn().mockReturnThis();
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              or: orMock,
              then: vi.fn((resolve) => resolve({ data: sampleDbRows, error: null })),
            }),
          }),
        }),
      } as unknown as SupabaseClient<Database>;

      await getAdminLeads({ search: '   ' }, mockClient);
      expect(orMock).not.toHaveBeenCalled();
    });
  });
});
