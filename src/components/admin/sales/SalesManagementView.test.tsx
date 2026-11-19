import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesManagementView } from './SalesManagementView';
import * as salesActions from '@/lib/sales/actions';

vi.mock('@/lib/sales/actions', () => ({
  createSalesRepresentativeAction: vi.fn(),
  updateSalesRepresentativeAction: vi.fn(),
  toggleSalesRepresentativeActiveAction: vi.fn(),
  deleteSalesRepresentativeAction: vi.fn(),
  createServiceAreaAction: vi.fn(),
  batchAssignServiceAreasAction: vi.fn(),
  toggleServiceAreaActiveAction: vi.fn(),
  deleteServiceAreaAction: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'uploaded-photo.webp' }, error: null }),
      }),
    },
  }),
}));

describe('SalesManagementView Component', () => {
  const mockDealerships = [
    {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: 'Satrya Motor Sidoarjo',
      code: 'satrya-sda',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 10',
      phone: '031-123',
      whatsappNumber: '6281234567890',
      openingHours: '08:00 - 17:00',
      isSynthetic: false,
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
    },
    {
      id: 'd2222222-2222-4222-a222-222222222222',
      name: 'Satrya Motor Surabaya',
      code: 'satrya-sby',
      city: 'Surabaya',
      address: 'Jl. Panglima Sudirman No. 20',
      phone: '031-456',
      whatsappNumber: '6281234567899',
      openingHours: '08:00 - 17:00',
      isSynthetic: false,
      isActive: true,
      sortOrder: 2,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
    },
  ];

  const mockProvinces = [
    {
      id: 'jawa-timur',
      name: 'Jawa Timur',
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
    },
  ];

  const mockRegencies = [
    {
      id: 'kab-sidoarjo',
      provinceId: 'jawa-timur',
      name: 'Sidoarjo',
      type: 'kabupaten' as const,
      sortOrder: 1,
      isActive: true,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
    },
    {
      id: 'kota-surabaya',
      provinceId: 'jawa-timur',
      name: 'Surabaya',
      type: 'kota' as const,
      sortOrder: 2,
      isActive: true,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
    },
  ];

  const mockServiceAreas = [
    {
      id: 'sa111111-1111-4111-a111-111111111111',
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      regencyId: 'kab-sidoarjo',
      isActive: true,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
      dealership: mockDealerships[0],
      regency: mockRegencies[0],
    },
  ];

  const mockSalesReps = [
    {
      id: 'sr111111-1111-4111-a111-111111111111',
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      name: 'Budi Santoso',
      whatsappNumber: '6281234567890',
      photoUrl: null,
      position: 'Senior Sales Consultant',
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
      dealership: mockDealerships[0],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title, summary cards, and initial sales representatives', () => {
    render(
      <SalesManagementView
        initialDealerships={mockDealerships}
        initialProvinces={mockProvinces}
        initialRegencies={mockRegencies}
        initialServiceAreas={mockServiceAreas}
        initialSalesReps={mockSalesReps}
      />
    );

    expect(screen.getByText('Manajemen Sales & Wilayah Layanan')).toBeInTheDocument();
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByText('Senior Sales Consultant')).toBeInTheDocument();
    expect(screen.getByText('Satrya Motor Sidoarjo')).toBeInTheDocument();
  });

  it('filters sales representatives by text search and dealership filter', () => {
    render(
      <SalesManagementView
        initialDealerships={mockDealerships}
        initialProvinces={mockProvinces}
        initialRegencies={mockRegencies}
        initialServiceAreas={mockServiceAreas}
        initialSalesReps={mockSalesReps}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Cari nama sales/i);
    fireEvent.change(searchInput, { target: { value: 'Tidak Ada' } });
    expect(screen.queryByText('Budi Santoso')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Budi' } });
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
  });

  it('opens create modal and handles successful sales representative creation', async () => {
    const newRep = {
      id: 'sr222222-2222-4222-a222-222222222222',
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      name: 'Rina Wahyuni',
      whatsappNumber: '6285711223344',
      photoUrl: null,
      position: 'Counter Sales',
      isActive: true,
      sortOrder: 2,
      createdAt: '2026-11-19T00:00:00Z',
      updatedAt: '2026-11-19T00:00:00Z',
      dealership: mockDealerships[0],
    };

    vi.mocked(salesActions.createSalesRepresentativeAction).mockResolvedValue({
      success: true,
      data: newRep,
    });

    render(
      <SalesManagementView
        initialDealerships={mockDealerships}
        initialProvinces={mockProvinces}
        initialRegencies={mockRegencies}
        initialServiceAreas={mockServiceAreas}
        initialSalesReps={mockSalesReps}
      />
    );

    const createButton = screen.getByRole('button', { name: /Tambah Tenaga Penjual/i });
    fireEvent.click(createButton);

    expect(screen.getByRole('heading', { name: 'Tambah Tenaga Penjual' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nama Lengkap Sales/i), {
      target: { value: 'Rina Wahyuni' },
    });
    fireEvent.change(screen.getByLabelText(/Jabatan \/ Peran/i), {
      target: { value: 'Counter Sales' },
    });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp Aktif/i), {
      target: { value: '085711223344' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Sales' }));

    await waitFor(() => {
      expect(salesActions.createSalesRepresentativeAction).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Rina Wahyuni',
          whatsappNumber: '085711223344',
          position: 'Counter Sales',
        })
      );
      expect(screen.getByText('Rina Wahyuni')).toBeInTheDocument();
    });
  });

  it('toggles sales representative active status', async () => {
    vi.mocked(salesActions.toggleSalesRepresentativeActiveAction).mockResolvedValue({
      success: true,
      data: { id: mockSalesReps[0].id, isActive: false },
    });

    render(
      <SalesManagementView
        initialDealerships={mockDealerships}
        initialProvinces={mockProvinces}
        initialRegencies={mockRegencies}
        initialServiceAreas={mockServiceAreas}
        initialSalesReps={mockSalesReps}
      />
    );

    const deactivateBtn = screen.getByRole('button', { name: 'Nonaktifkan' });
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(salesActions.toggleSalesRepresentativeActiveAction).toHaveBeenCalledWith(
        mockSalesReps[0].id,
        false
      );
    });
  });

  it('deletes sales representative with confirmation modal', async () => {
    vi.mocked(salesActions.deleteSalesRepresentativeAction).mockResolvedValue({
      success: true,
      data: { id: mockSalesReps[0].id },
    });

    render(
      <SalesManagementView
        initialDealerships={mockDealerships}
        initialProvinces={mockProvinces}
        initialRegencies={mockRegencies}
        initialServiceAreas={mockServiceAreas}
        initialSalesReps={mockSalesReps}
      />
    );

    const deleteBtn = screen.getByRole('button', { name: 'Hapus' });
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Konfirmasi Hapus Tenaga Penjual')).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: 'Ya, Hapus Sales' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(salesActions.deleteSalesRepresentativeAction).toHaveBeenCalledWith(
        mockSalesReps[0].id
      );
      expect(screen.queryByText('Budi Santoso')).not.toBeInTheDocument();
    });
  });

  it('switches to service areas tab, renders service area records, and adds new area', async () => {
    vi.mocked(salesActions.createServiceAreaAction).mockResolvedValue({
      success: true,
      data: {
        id: 'sa222222-2222-4222-a222-222222222222',
        dealershipId: mockDealerships[0].id,
        regencyId: 'kota-surabaya',
        isActive: true,
        createdAt: '2026-11-19T00:00:00Z',
        updatedAt: '2026-11-19T00:00:00Z',
        dealership: mockDealerships[0],
        regency: mockRegencies[1],
      },
    });

    render(
      <SalesManagementView
        initialDealerships={mockDealerships}
        initialProvinces={mockProvinces}
        initialRegencies={mockRegencies}
        initialServiceAreas={mockServiceAreas}
        initialSalesReps={mockSalesReps}
      />
    );

    // Switch Tab
    const areaTabButton = screen.getByRole('button', { name: /Cakupan Wilayah Layanan/i });
    fireEvent.click(areaTabButton);

    // Should display service areas
    expect(screen.getByText('Total Pemetaan Wilayah')).toBeInTheDocument();
    expect(screen.getByText('Sidoarjo')).toBeInTheDocument();

    // Open Add Area modal
    const addAreaBtn = screen.getByRole('button', { name: /Tambah Cakupan Wilayah/i });
    fireEvent.click(addAreaBtn);

    expect(
      screen.getByRole('heading', { name: 'Tambah Cakupan Wilayah Dealer' })
    ).toBeInTheDocument();

    // Select Surabaya checkbox
    const surabayaCheckbox = screen.getByLabelText(/Surabaya \(Kota\)/i);
    fireEvent.click(surabayaCheckbox);

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Wilayah Layanan' }));

    await waitFor(() => {
      expect(salesActions.createServiceAreaAction).toHaveBeenCalledWith({
        dealershipId: mockDealerships[0].id,
        regencyId: 'kota-surabaya',
        isActive: true,
      });
      expect(screen.getByText('Surabaya')).toBeInTheDocument();
    });
  });
});
