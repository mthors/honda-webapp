import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DealerLocationManagementView } from './DealerLocationManagementView';
import type { DealerLocationItem } from '@/types/events';
import * as actions from '@/lib/events/dealer-locations-actions';

vi.mock('@/lib/events/dealer-locations-actions', () => ({
  createDealerLocationAction: vi.fn(),
  updateDealerLocationAction: vi.fn(),
  toggleDealerLocationActiveAction: vi.fn(),
  deleteDealerLocationAction: vi.fn(),
}));

describe('DealerLocationManagementView', () => {
  const mockLocations: DealerLocationItem[] = [
    {
      id: 'c1111111-1111-4111-a111-111111111111',
      name: 'Demo Dealer – Sidoarjo',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 123',
      phone: '(031) 894-1234',
      isActive: true,
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
    {
      id: 'c2222222-2222-4222-a222-222222222222',
      name: 'Demo Dealer – Surabaya',
      city: 'Surabaya',
      address: 'Jl. Ahmad Yani No. 45',
      phone: '(031) 828-5678',
      isActive: false,
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dealer locations list with names, city, address, and status badges', () => {
    render(<DealerLocationManagementView initialLocations={mockLocations} />);

    expect(screen.getByText('Lokasi Dealer Acara')).toBeInTheDocument();
    expect(screen.getByText('Demo Dealer – Sidoarjo')).toBeInTheDocument();
    expect(screen.getByText('Demo Dealer – Surabaya')).toBeInTheDocument();
    expect(screen.getAllByText('Aktif').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Nonaktif').length).toBeGreaterThanOrEqual(1);
  });

  it('filters locations by search query', () => {
    render(<DealerLocationManagementView initialLocations={mockLocations} />);

    const searchInput = screen.getByLabelText('Cari lokasi dealer');
    fireEvent.change(searchInput, { target: { value: 'Surabaya' } });

    expect(screen.queryByText('Demo Dealer – Sidoarjo')).not.toBeInTheDocument();
    expect(screen.getByText('Demo Dealer – Surabaya')).toBeInTheDocument();
  });

  it('filters locations by active/inactive status', () => {
    render(<DealerLocationManagementView initialLocations={mockLocations} />);

    const filterSelect = screen.getByLabelText('Filter status lokasi');
    fireEvent.change(filterSelect, { target: { value: 'active' } });

    expect(screen.getByText('Demo Dealer – Sidoarjo')).toBeInTheDocument();
    expect(screen.queryByText('Demo Dealer – Surabaya')).not.toBeInTheDocument();
  });

  it('opens modal to create new location and handles successful submit', async () => {
    const newLoc: DealerLocationItem = {
      id: 'c3333333-3333-4333-a333-333333333333',
      name: 'Demo Dealer – Gresik',
      city: 'Gresik',
      address: 'Jl. Veteran No. 88',
      phone: '(031) 398-9012',
      isActive: true,
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    };

    vi.mocked(actions.createDealerLocationAction).mockResolvedValueOnce({
      success: true,
      data: newLoc,
    });

    render(<DealerLocationManagementView initialLocations={mockLocations} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tambah Lokasi Dealer' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('contoh: Demo Dealer – Sidoarjo'), {
      target: { value: 'Demo Dealer – Gresik' },
    });
    fireEvent.change(screen.getByPlaceholderText('contoh: Sidoarjo'), {
      target: { value: 'Gresik' },
    });
    fireEvent.change(screen.getByPlaceholderText('contoh: Jl. Raya Sidoarjo No. 123'), {
      target: { value: 'Jl. Veteran No. 88' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Lokasi' }));

    await waitFor(() => {
      expect(actions.createDealerLocationAction).toHaveBeenCalledWith({
        name: 'Demo Dealer – Gresik',
        city: 'Gresik',
        address: 'Jl. Veteran No. 88',
        phone: null,
        isActive: true,
      });
      expect(screen.getByText('Demo Dealer – Gresik')).toBeInTheDocument();
    });
  });

  it('prevents destructive deletion when referenced by existing events', async () => {
    vi.mocked(actions.deleteDealerLocationAction).mockResolvedValueOnce({
      success: false,
      error:
        'Lokasi dealer ini tidak dapat dihapus karena masih digunakan oleh satu atau beberapa acara. Anda dapat menonaktifkan statusnya agar tidak dipilih untuk acara baru.',
    });

    render(<DealerLocationManagementView initialLocations={mockLocations} />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
    fireEvent.click(deleteButtons[0]);

    // Deletion modal appears
    expect(screen.getByText('Konfirmasi Hapus Lokasi')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Hapus Lokasi' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(actions.deleteDealerLocationAction).toHaveBeenCalledWith(mockLocations[0].id);
      expect(
        screen.getByText(/masih digunakan oleh satu atau beberapa acara/i)
      ).toBeInTheDocument();
      // Record is still in table
      expect(screen.getByText('Demo Dealer – Sidoarjo')).toBeInTheDocument();
    });
  });
});
