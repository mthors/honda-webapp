import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProvinces,
  getRegencies,
  getDealershipServiceAreas,
  getSalesRepresentatives,
  getSalesManagementData,
  getActiveProvinces,
  getActiveRegencies,
  getDealershipsByRegency,
  mapProvinceRow,
  mapRegencyRow,
  mapServiceAreaRow,
  mapSalesRepresentativeRow,
} from './queries';
import * as settingsQueries from '@/lib/settings/queries';

vi.mock('@/lib/settings/queries', () => ({
  getDealerships: vi.fn(),
}));

describe('Sales Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Row Mappers', () => {
    it('correctly maps province row to ProvinceItem', () => {
      const row = {
        id: 'jawa-timur',
        name: 'Jawa Timur',
        sort_order: 1,
        is_active: true,
        created_at: '2026-11-19T00:00:00Z',
        updated_at: '2026-11-19T00:00:00Z',
      };
      const item = mapProvinceRow(row);
      expect(item.id).toBe('jawa-timur');
      expect(item.name).toBe('Jawa Timur');
      expect(item.sortOrder).toBe(1);
      expect(item.isActive).toBe(true);
    });

    it('correctly maps regency row to RegencyItem', () => {
      const row = {
        id: 'kab-sidoarjo',
        province_id: 'jawa-timur',
        name: 'Sidoarjo',
        type: 'kabupaten' as const,
        sort_order: 1,
        is_active: true,
        created_at: '2026-11-19T00:00:00Z',
        updated_at: '2026-11-19T00:00:00Z',
      };
      const item = mapRegencyRow(row);
      expect(item.id).toBe('kab-sidoarjo');
      expect(item.provinceId).toBe('jawa-timur');
      expect(item.type).toBe('kabupaten');
    });

    it('correctly maps service area row with joined dealership and regency', () => {
      const row = {
        id: 'sa-1',
        dealership_id: 'd-1',
        regency_id: 'kab-sidoarjo',
        is_active: true,
        created_at: '2026-11-19T00:00:00Z',
        updated_at: '2026-11-19T00:00:00Z',
        dealerships: {
          id: 'd-1',
          name: 'Satrya Motor Sidoarjo',
          code: 'satrya-sda',
          city: 'Sidoarjo',
          address: 'Jl. Raya No. 1',
          phone: '031-123',
          whatsapp_number: '6281234567890',
          opening_hours: '08:00 - 17:00',
          is_synthetic: false,
          is_active: true,
          sort_order: 1,
          created_at: '2026-11-19T00:00:00Z',
          updated_at: '2026-11-19T00:00:00Z',
        },
        regencies: {
          id: 'kab-sidoarjo',
          province_id: 'jawa-timur',
          name: 'Sidoarjo',
          type: 'kabupaten' as const,
          sort_order: 1,
          is_active: true,
          created_at: '2026-11-19T00:00:00Z',
          updated_at: '2026-11-19T00:00:00Z',
        },
      };

      const item = mapServiceAreaRow(row);
      expect(item.id).toBe('sa-1');
      expect(item.dealership?.name).toBe('Satrya Motor Sidoarjo');
      expect(item.regency?.name).toBe('Sidoarjo');
    });

    it('correctly maps sales representative row with joined dealership', () => {
      const row = {
        id: 'sr-1',
        dealership_id: 'd-1',
        name: 'Andi Pratama',
        whatsapp_number: '6281234567890',
        photo_url: 'andi.webp',
        position: 'Sales Consultant',
        is_active: true,
        sort_order: 1,
        created_at: '2026-11-19T00:00:00Z',
        updated_at: '2026-11-19T00:00:00Z',
        dealerships: {
          id: 'd-1',
          name: 'Satrya Motor Sidoarjo',
          code: 'satrya-sda',
          city: 'Sidoarjo',
          address: 'Jl. Raya No. 1',
          phone: '031-123',
          whatsapp_number: '6281234567890',
          opening_hours: '08:00 - 17:00',
          is_synthetic: false,
          is_active: true,
          sort_order: 1,
          created_at: '2026-11-19T00:00:00Z',
          updated_at: '2026-11-19T00:00:00Z',
        },
      };

      const item = mapSalesRepresentativeRow(row);
      expect(item.id).toBe('sr-1');
      expect(item.name).toBe('Andi Pratama');
      expect(item.dealership?.city).toBe('Sidoarjo');
    });
  });

  describe('getProvinces', () => {
    it('fetches provinces ordered by sort_order and name', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'jawa-timur',
            name: 'Jawa Timur',
            sort_order: 1,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        error: null,
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getProvinces>[0];

      const provinces = await getProvinces(mockClient);
      expect(provinces).toHaveLength(1);
      expect(provinces[0].name).toBe('Jawa Timur');
    });

    it('returns empty array on database error', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getProvinces>[0];

      const provinces = await getProvinces(mockClient);
      expect(provinces).toEqual([]);
    });
  });

  describe('getRegencies', () => {
    it('fetches regencies and applies provinceId filter when provided', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'kab-sidoarjo',
            province_id: 'jawa-timur',
            name: 'Sidoarjo',
            type: 'kabupaten',
            sort_order: 1,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        error: null,
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getRegencies>[1];

      const regencies = await getRegencies('jawa-timur', mockClient);
      expect(mockEq).toHaveBeenCalledWith('province_id', 'jawa-timur');
      expect(regencies).toHaveLength(1);
      expect(regencies[0].name).toBe('Sidoarjo');
    });
  });

  describe('getDealershipServiceAreas', () => {
    it('fetches service areas with joined dealerships and regencies', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'sa-1',
            dealership_id: 'd-1',
            regency_id: 'kab-sidoarjo',
            is_active: true,
            created_at: '',
            updated_at: '',
            dealerships: { id: 'd-1', name: 'Satrya Sidoarjo', city: 'Sidoarjo' },
            regencies: { id: 'kab-sidoarjo', name: 'Sidoarjo', type: 'kabupaten' },
          },
        ],
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getDealershipServiceAreas>[1];

      const areas = await getDealershipServiceAreas('d-1', mockClient);
      expect(mockEq).toHaveBeenCalledWith('dealership_id', 'd-1');
      expect(areas).toHaveLength(1);
      expect(areas[0].regency?.name).toBe('Sidoarjo');
    });
  });

  describe('getSalesRepresentatives', () => {
    it('fetches sales representatives with joined dealerships', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'sr-1',
            dealership_id: 'd-1',
            name: 'Andi Pratama',
            whatsapp_number: '6281234567890',
            photo_url: null,
            position: 'Sales',
            is_active: true,
            sort_order: 1,
            created_at: '',
            updated_at: '',
            dealerships: { id: 'd-1', name: 'Satrya Sidoarjo', city: 'Sidoarjo' },
          },
        ],
        error: null,
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getSalesRepresentatives>[1];

      const reps = await getSalesRepresentatives(undefined, mockClient);
      expect(reps).toHaveLength(1);
      expect(reps[0].name).toBe('Andi Pratama');
      expect(reps[0].dealership?.name).toBe('Satrya Sidoarjo');
    });
  });

  describe('getSalesManagementData', () => {
    it('aggregates dealerships, provinces, regencies, service areas, and sales reps', async () => {
      vi.mocked(settingsQueries.getDealerships).mockResolvedValue([
        {
          id: 'd-1',
          name: 'Satrya Sidoarjo',
          code: 'satrya-sda',
          city: 'Sidoarjo',
          address: null,
          phone: null,
          whatsappNumber: null,
          openingHours: null,
          isSynthetic: false,
          isActive: true,
          sortOrder: 1,
          createdAt: '',
          updatedAt: '',
        },
      ]);

      const mockOrderChain = {
        data: [],
        error: null,
        order: vi.fn().mockImplementation(() => mockOrderChain),
      };
      const mockOrder = vi.fn().mockReturnValue(mockOrderChain);
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getSalesManagementData>[0];

      const data = await getSalesManagementData(mockClient);
      expect(data.dealerships).toHaveLength(1);
      expect(Array.isArray(data.provinces)).toBe(true);
      expect(Array.isArray(data.regencies)).toBe(true);
      expect(Array.isArray(data.serviceAreas)).toBe(true);
      expect(Array.isArray(data.salesReps)).toBe(true);
    });
  });

  describe('getActiveProvinces', () => {
    it('fetches active provinces sorted by sort_order and name', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'jawa-timur',
            name: 'Jawa Timur',
            sort_order: 1,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        error: null,
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getActiveProvinces>[0];

      const provinces = await getActiveProvinces(mockClient);
      expect(provinces).toHaveLength(1);
      expect(provinces[0].id).toBe('jawa-timur');
      expect(provinces[0].name).toBe('Jawa Timur');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('returns empty array on database error', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database failure' },
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getActiveProvinces>[0];

      const provinces = await getActiveProvinces(mockClient);
      expect(provinces).toEqual([]);
    });
  });

  describe('getActiveRegencies', () => {
    it('fetches active regencies with optional provinceId filter', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'kab-sidoarjo',
            province_id: 'jawa-timur',
            name: 'Sidoarjo',
            type: 'kabupaten',
            sort_order: 1,
            is_active: true,
            created_at: '',
            updated_at: '',
          },
        ],
        error: null,
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2, order: mockOrder1 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getActiveRegencies>[1];

      const regencies = await getActiveRegencies('jawa-timur', mockClient);
      expect(regencies).toHaveLength(1);
      expect(regencies[0].name).toBe('Sidoarjo');
      expect(mockEq1).toHaveBeenCalledWith('is_active', true);
      expect(mockEq2).toHaveBeenCalledWith('province_id', 'jawa-timur');
    });

    it('returns empty array on database error', async () => {
      const mockOrder2 = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query error' },
      });
      const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getActiveRegencies>[1];

      const regencies = await getActiveRegencies(undefined, mockClient);
      expect(regencies).toEqual([]);
    });
  });

  describe('getDealershipsByRegency', () => {
    it('returns empty array if regencyId is empty', async () => {
      const dealerships = await getDealershipsByRegency('');
      expect(dealerships).toEqual([]);
    });

    it('discovers and deduplicates active dealerships serving the regency', async () => {
      const mockRows = [
        {
          dealership_id: 'd-1',
          is_active: true,
          dealerships: {
            id: 'd-1',
            name: 'Satrya Sidoarjo',
            code: 'satrya-sda',
            city: 'Sidoarjo',
            address: 'Jl. Raya Sidoarjo No. 1',
            phone: '031-8941234',
            whatsapp_number: '6281234567890',
            opening_hours: '08:00 - 16:30',
            is_synthetic: false,
            is_active: true,
            sort_order: 2,
            created_at: '',
            updated_at: '',
          },
        },
        {
          dealership_id: 'd-2',
          is_active: true,
          dealerships: {
            id: 'd-2',
            name: 'Satrya Surabaya Utama',
            code: 'satrya-sby',
            city: 'Surabaya',
            address: 'Jl. Basuki Rahmat',
            phone: null,
            whatsapp_number: '6281234567891',
            opening_hours: null,
            is_synthetic: false,
            is_active: true,
            sort_order: 1,
            created_at: '',
            updated_at: '',
          },
        },
        // Duplicate junction row test
        {
          dealership_id: 'd-1',
          is_active: true,
          dealerships: {
            id: 'd-1',
            name: 'Satrya Sidoarjo',
            code: 'satrya-sda',
            city: 'Sidoarjo',
            address: 'Jl. Raya Sidoarjo No. 1',
            phone: '031-8941234',
            whatsapp_number: '6281234567890',
            opening_hours: '08:00 - 16:30',
            is_synthetic: false,
            is_active: true,
            sort_order: 2,
            created_at: '',
            updated_at: '',
          },
        },
        // Inactive dealership should be filtered out
        {
          dealership_id: 'd-3',
          is_active: true,
          dealerships: {
            id: 'd-3',
            name: 'Satrya Malang Inactive',
            code: 'satrya-mlg',
            city: 'Malang',
            address: null,
            phone: null,
            whatsapp_number: null,
            opening_hours: null,
            is_synthetic: false,
            is_active: false,
            sort_order: 3,
            created_at: '',
            updated_at: '',
          },
        },
      ];

      const mockEq2 = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getDealershipsByRegency>[1];

      const dealerships = await getDealershipsByRegency('kab-sidoarjo', mockClient);
      expect(dealerships).toHaveLength(2);
      // Checked sort order: d-2 (sort_order 1) comes before d-1 (sort_order 2)
      expect(dealerships[0].id).toBe('d-2');
      expect(dealerships[1].id).toBe('d-1');
      expect(mockEq1).toHaveBeenCalledWith('regency_id', 'kab-sidoarjo');
      expect(mockEq2).toHaveBeenCalledWith('is_active', true);
    });

    it('correctly handles PostgREST returning joined dealerships as an array', async () => {
      const mockRows = [
        {
          dealership_id: 'd-1',
          is_active: true,
          dealerships: [
            {
              id: 'd-1',
              name: 'Satrya Sidoarjo',
              code: 'satrya-sda',
              city: 'Sidoarjo',
              address: 'Jl. Raya Sidoarjo No. 1',
              phone: '031-8941234',
              whatsapp_number: '6281234567890',
              opening_hours: '08:00 - 16:30',
              is_synthetic: false,
              is_active: true,
              sort_order: 1,
              created_at: '',
              updated_at: '',
            },
          ],
        },
      ];

      const mockEq2 = vi.fn().mockResolvedValue({ data: mockRows, error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getDealershipsByRegency>[1];

      const dealerships = await getDealershipsByRegency('kab-sidoarjo', mockClient);
      expect(dealerships).toHaveLength(1);
      expect(dealerships[0].name).toBe('Satrya Sidoarjo');
    });

    it('throws error when database error occurs during service areas query', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ data: null, error: { message: 'Connection terminated' } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockClient = {
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      } as unknown as Parameters<typeof getDealershipsByRegency>[1];

      await expect(getDealershipsByRegency('kab-sidoarjo', mockClient)).rejects.toThrow(
        /Database error discovering dealerships: Connection terminated/i
      );
    });

    it('falls back to matching canonical active dealerships by city when no service area mapping exists', async () => {
      // Step 1: dealership_service_areas returns []
      const mockSaEq2 = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSaEq1 = vi.fn().mockReturnValue({ eq: mockSaEq2 });
      const mockSaSelect = vi.fn().mockReturnValue({ eq: mockSaEq1 });

      // Step 2: regencies returns Sidoarjo
      const mockRegMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'kab-sidoarjo', name: 'Kabupaten Sidoarjo', type: 'kabupaten' },
        error: null,
      });
      const mockRegEq = vi.fn().mockReturnValue({ maybeSingle: mockRegMaybeSingle });
      const mockRegSelect = vi.fn().mockReturnValue({ eq: mockRegEq });

      // Step 3: dealerships returns active dealerships
      const mockDealOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'd-1',
            name: 'Honda Satrya — Sidoarjo Sentral',
            code: 'demo-satrya-sidoarjo',
            city: 'Sidoarjo',
            address: 'Jl. Raya Sidoarjo No. 1',
            phone: '031-8941234',
            whatsapp_number: '6281234567890',
            opening_hours: '08:00 - 16:30',
            is_synthetic: false,
            is_active: true,
            sort_order: 1,
            created_at: '',
            updated_at: '',
          },
          {
            id: 'd-2',
            name: 'Honda Satrya — Surabaya Selatan',
            code: 'demo-satrya-surabaya',
            city: 'Surabaya',
            address: null,
            phone: null,
            whatsapp_number: null,
            opening_hours: null,
            is_synthetic: false,
            is_active: true,
            sort_order: 2,
            created_at: '',
            updated_at: '',
          },
        ],
        error: null,
      });
      const mockDealOrder1 = vi.fn().mockReturnValue({ order: mockDealOrder2 });
      const mockDealEq = vi.fn().mockReturnValue({ order: mockDealOrder1 });
      const mockDealSelect = vi.fn().mockReturnValue({ eq: mockDealEq });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'dealership_service_areas') return { select: mockSaSelect };
          if (table === 'regencies') return { select: mockRegSelect };
          if (table === 'dealerships') return { select: mockDealSelect };
          throw new Error(`Unexpected table ${table}`);
        }),
      } as unknown as Parameters<typeof getDealershipsByRegency>[1];

      const dealerships = await getDealershipsByRegency('kab-sidoarjo', mockClient);
      expect(dealerships).toHaveLength(1);
      expect(dealerships[0].id).toBe('d-1');
      expect(dealerships[0].name).toBe('Honda Satrya — Sidoarjo Sentral');
      expect(dealerships[0].city).toBe('Sidoarjo');
    });

    it('returns empty array when no service areas exist and no dealership city matches regency', async () => {
      // Step 1: dealership_service_areas returns []
      const mockSaEq2 = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSaEq1 = vi.fn().mockReturnValue({ eq: mockSaEq2 });
      const mockSaSelect = vi.fn().mockReturnValue({ eq: mockSaEq1 });

      // Step 2: regencies returns Pacitan
      const mockRegMaybeSingle = vi.fn().mockResolvedValue({
        data: { id: 'kab-pacitan', name: 'Kabupaten Pacitan', type: 'kabupaten' },
        error: null,
      });
      const mockRegEq = vi.fn().mockReturnValue({ maybeSingle: mockRegMaybeSingle });
      const mockRegSelect = vi.fn().mockReturnValue({ eq: mockRegEq });

      // Step 3: dealerships returns only Sidoarjo and Surabaya
      const mockDealOrder2 = vi.fn().mockResolvedValue({
        data: [
          {
            id: 'd-1',
            name: 'Honda Satrya — Sidoarjo Sentral',
            city: 'Sidoarjo',
            is_active: true,
            sort_order: 1,
          },
        ],
        error: null,
      });
      const mockDealOrder1 = vi.fn().mockReturnValue({ order: mockDealOrder2 });
      const mockDealEq = vi.fn().mockReturnValue({ order: mockDealOrder1 });
      const mockDealSelect = vi.fn().mockReturnValue({ eq: mockDealEq });

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'dealership_service_areas') return { select: mockSaSelect };
          if (table === 'regencies') return { select: mockRegSelect };
          if (table === 'dealerships') return { select: mockDealSelect };
          throw new Error(`Unexpected table ${table}`);
        }),
      } as unknown as Parameters<typeof getDealershipsByRegency>[1];

      const dealerships = await getDealershipsByRegency('kab-pacitan', mockClient);
      expect(dealerships).toEqual([]);
    });
  });
});
