import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventManagementView } from './EventManagementView';
import type { EventItem, DealerLocationItem } from '@/types/events';
import * as actions from '@/lib/events/actions';

vi.mock('@/lib/events/actions', () => ({
  createEventAction: vi.fn(),
  updateEventAction: vi.fn(),
  toggleEventPublishAction: vi.fn(),
  deleteEventAction: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'events/test-poster.webp' },
          error: null,
        }),
      }),
    },
  }),
}));

describe('EventManagementView', () => {
  const mockLocations: DealerLocationItem[] = [
    {
      id: 'loc-1',
      name: 'Demo Dealer – Sidoarjo',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 123',
      phone: '(031) 894-1234',
      isActive: true,
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
  ];

  const mockEvents: EventItem[] = [
    {
      id: 'e1',
      title: 'Honda Riding Experience Sidoarjo',
      slug: 'honda-riding-experience-sidoarjo',
      description:
        'Rasakan sensasi berkendara motor Honda terbaru bersama instruktur berpengalaman.',
      locationId: 'loc-1',
      location: mockLocations[0],
      startAt: '2026-11-20T02:00:00.000Z', // 09:00 WIB
      endAt: '2026-11-20T08:00:00.000Z', // 15:00 WIB
      imageUrl: 'events/poster-1.webp',
      status: 'published',
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
    {
      id: 'e2',
      title: 'Draf Pameran Motor Matic',
      slug: 'draf-pameran-motor-matic',
      description: 'Pameran jajaran motor matic Honda terbaru dengan promo potongan angsuran.',
      locationId: 'loc-1',
      location: mockLocations[0],
      startAt: '2026-12-01T02:00:00.000Z',
      endAt: '2026-12-03T10:00:00.000Z',
      imageUrl: null,
      status: 'draft',
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders event list with title, date, location, and status badges', () => {
    render(<EventManagementView initialEvents={mockEvents} activeLocations={mockLocations} />);

    expect(screen.getByText('Manajemen Acara')).toBeInTheDocument();
    expect(screen.getByText('Honda Riding Experience Sidoarjo')).toBeInTheDocument();
    expect(screen.getByText('Draf Pameran Motor Matic')).toBeInTheDocument();
    expect(screen.getAllByText('Dipublikasikan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Draf').length).toBeGreaterThanOrEqual(1);
  });

  it('filters events by search query', () => {
    render(<EventManagementView initialEvents={mockEvents} activeLocations={mockLocations} />);

    const searchInput = screen.getByLabelText('Cari judul acara');
    fireEvent.change(searchInput, { target: { value: 'Riding' } });

    expect(screen.getByText('Honda Riding Experience Sidoarjo')).toBeInTheDocument();
    expect(screen.queryByText('Draf Pameran Motor Matic')).not.toBeInTheDocument();
  });

  it('filters events by publication status', () => {
    render(<EventManagementView initialEvents={mockEvents} activeLocations={mockLocations} />);

    const filterSelect = screen.getByLabelText('Filter status publikasi');
    fireEvent.change(filterSelect, { target: { value: 'draft' } });

    expect(screen.queryByText('Honda Riding Experience Sidoarjo')).not.toBeInTheDocument();
    expect(screen.getByText('Draf Pameran Motor Matic')).toBeInTheDocument();
  });

  it('opens create modal and handles successful event creation', async () => {
    const createdEvent: EventItem = {
      id: 'e3',
      title: 'Peluncuran Motor Listrik',
      slug: 'peluncuran-motor-listrik',
      description: 'Acara pengenalan dan uji coba motor listrik Honda terbaru.',
      locationId: 'loc-1',
      location: mockLocations[0],
      startAt: '2026-11-25T02:00:00.000Z',
      endAt: '2026-11-25T08:00:00.000Z',
      imageUrl: null,
      status: 'draft',
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    };

    vi.mocked(actions.createEventAction).mockResolvedValueOnce({
      success: true,
      data: createdEvent,
    });

    render(<EventManagementView initialEvents={mockEvents} activeLocations={mockLocations} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tambah Acara Baru' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('contoh: Honda Riding Experience Sidoarjo 2026'), {
      target: { value: 'Peluncuran Motor Listrik' },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        'Jelaskan detail kegiatan, aktivitas pameran, penawaran, dan tata cara keikutsertaan...'
      ),
      {
        target: { value: 'Acara pengenalan dan uji coba motor listrik Honda terbaru.' },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: 'Simpan Acara' }));

    await waitFor(() => {
      expect(actions.createEventAction).toHaveBeenCalled();
      expect(screen.getByText('Peluncuran Motor Listrik')).toBeInTheDocument();
    });
  });

  it('toggles event publication status', async () => {
    vi.mocked(actions.toggleEventPublishAction).mockResolvedValueOnce({
      success: true,
      data: { ...mockEvents[1], status: 'published' },
    });

    render(<EventManagementView initialEvents={mockEvents} activeLocations={mockLocations} />);

    const publishButtons = screen.getAllByRole('button', { name: 'Publikasikan' });
    fireEvent.click(publishButtons[0]);

    await waitFor(() => {
      expect(actions.toggleEventPublishAction).toHaveBeenCalledWith({
        id: 'e2',
        status: 'published',
      });
      expect(screen.getByText(/Acara berhasil dipublikasikan/i)).toBeInTheDocument();
    });
  });

  it('handles event deletion with confirmation modal', async () => {
    vi.mocked(actions.deleteEventAction).mockResolvedValueOnce({
      success: true,
      data: { id: 'e1' },
    });

    render(<EventManagementView initialEvents={mockEvents} activeLocations={mockLocations} />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Hapus' });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('Konfirmasi Hapus Acara')).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: 'Hapus Acara' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(actions.deleteEventAction).toHaveBeenCalledWith('e1');
      expect(screen.queryByText('Honda Riding Experience Sidoarjo')).not.toBeInTheDocument();
    });
  });
});
