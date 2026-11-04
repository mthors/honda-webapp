import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealershipManagementView } from './DealershipManagementView';
import type { DealershipItem } from '@/types/dealership';
import * as actions from '@/lib/dealerships/actions';

vi.mock('@/lib/dealerships/actions', () => ({
  createDealershipAction: vi.fn(),
  updateDealershipAction: vi.fn(),
  toggleDealershipActiveAction: vi.fn(),
  deleteDealershipAction: vi.fn(),
}));

describe('DealershipManagementView', () => {
  const mockDealerships: DealershipItem[] = [
    {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: '[DEMO] Honda Satrya — Sidoarjo Sentral',
      code: 'demo-satrya-sidoarjo',
      city: 'Sidoarjo',
      address: null,
      phone: null,
      whatsappNumber: null,
      openingHours: null,
      isSynthetic: true,
      isActive: true,
      sortOrder: 1,
      createdAt: '2026-11-04T08:00:00.000Z',
      updatedAt: '2026-11-04T08:00:00.000Z',
    },
    {
      id: 'd2222222-2222-4222-a222-222222222222',
      name: 'Honda Satrya Surabaya Resmi',
      code: 'satrya-surabaya-resmi',
      city: 'Surabaya',
      address: 'Jl. Basuki Rahmat No. 10',
      phone: '031-5551234',
      whatsappNumber: '6281122334455',
      openingHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
      isSynthetic: false,
      isActive: false,
      sortOrder: 2,
      createdAt: '2026-11-04T08:00:00.000Z',
      updatedAt: '2026-11-04T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dealership list, clearly distinguishing synthetic demo from verified records', () => {
    render(<DealershipManagementView initialDealerships={mockDealerships} />);

    // Header & subtitle
    expect(screen.getByText('Kelola Jaringan Dealer')).toBeInTheDocument();

    // Row 1: Synthetic demo
    expect(screen.getByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).toBeInTheDocument();
    expect(screen.getByText('demo-satrya-sidoarjo')).toBeInTheDocument();
    expect(screen.getByText('Data Demo / Sintetis')).toBeInTheDocument();
    expect(screen.getByText('Menunggu konfirmasi data resmi dealer')).toBeInTheDocument();

    // Row 2: Verified record
    expect(screen.getByText('Honda Satrya Surabaya Resmi')).toBeInTheDocument();
    expect(screen.getByText('Data Terverifikasi')).toBeInTheDocument();
    expect(screen.getByText('Tel: 031-5551234')).toBeInTheDocument();
  });

  it('renders empty state when no dealerships are available', () => {
    render(<DealershipManagementView initialDealerships={[]} />);
    expect(
      screen.getByText('Belum ada entitas dealer yang terdaftar dalam sistem.')
    ).toBeInTheDocument();
  });

  it('opens create form when "Tambah Dealer Baru" is clicked and can close it', () => {
    render(<DealershipManagementView initialDealerships={mockDealerships} />);

    const createButton = screen.getByRole('button', { name: /Tambah Dealer Baru/i });
    fireEvent.click(createButton);

    expect(screen.getByText('Tambah Entitas Dealer')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Dealer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kode Dealer/i)).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /Tutup ×/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Tambah Entitas Dealer')).not.toBeInTheDocument();
  });

  it('filters list by search query', () => {
    render(<DealershipManagementView initialDealerships={mockDealerships} />);

    const searchInput = screen.getByPlaceholderText(/Cari nama dealer, kode, atau kota/i);
    fireEvent.change(searchInput, { target: { value: 'Surabaya' } });

    expect(screen.getByText('Honda Satrya Surabaya Resmi')).toBeInTheDocument();
    expect(screen.queryByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).not.toBeInTheDocument();
  });

  it('filters list by status buttons', () => {
    render(<DealershipManagementView initialDealerships={mockDealerships} />);

    // Filter to active only
    const activeFilterBtn = screen.getByRole('button', { name: 'Aktif Saja' });
    fireEvent.click(activeFilterBtn);

    expect(screen.getByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).toBeInTheDocument();
    expect(screen.queryByText('Honda Satrya Surabaya Resmi')).not.toBeInTheDocument();

    // Filter to synthetic only
    const syntheticFilterBtn = screen.getByRole('button', { name: 'Demo / Sintetis Saja' });
    fireEvent.click(syntheticFilterBtn);

    expect(screen.getByText('[DEMO] Honda Satrya — Sidoarjo Sentral')).toBeInTheDocument();
    expect(screen.queryByText('Honda Satrya Surabaya Resmi')).not.toBeInTheDocument();
  });

  it('toggles operational active status when action button is clicked', async () => {
    vi.mocked(actions.toggleDealershipActiveAction).mockResolvedValueOnce({
      success: true,
      data: { ...mockDealerships[0], isActive: false },
    });

    render(<DealershipManagementView initialDealerships={mockDealerships} />);

    // First dealer is active, button says "Nonaktifkan"
    const deactivateBtn = screen.getAllByRole('button', { name: 'Nonaktifkan' })[0];
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(actions.toggleDealershipActiveAction).toHaveBeenCalledWith(
        mockDealerships[0].id,
        false
      );
    });
  });

  it('opens delete confirmation modal when "Hapus" is clicked and executes deletion upon confirmation', async () => {
    vi.mocked(actions.deleteDealershipAction).mockResolvedValueOnce({
      success: true,
      data: { id: mockDealerships[1].id },
    });

    render(<DealershipManagementView initialDealerships={mockDealerships} />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
    fireEvent.click(deleteButtons[1]); // Click delete on 2nd dealer

    expect(screen.getByText('Konfirmasi Penghapusan Dealer')).toBeInTheDocument();
    expect(screen.getAllByText('Honda Satrya Surabaya Resmi').length).toBeGreaterThanOrEqual(2);

    const confirmButton = screen.getByRole('button', { name: 'Hapus Dealer' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(actions.deleteDealershipAction).toHaveBeenCalledWith(mockDealerships[1].id);
    });
  });
});
