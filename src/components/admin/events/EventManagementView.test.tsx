import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventManagementView } from './EventManagementView';
import type { EventItem } from '@/types/events';
import type { DealershipItem } from '@/types/dealership';
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
  const mockDealerships: DealershipItem[] = [
    {
      id: 'd1111111-1111-4111-a111-111111111111',
      name: 'Showroom Sidoarjo Pusat',
      code: 'SDA-01',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 123',
      phone: '(031) 894-1234',
      whatsappNumber: '081234567890',
      openingHours: '08:00 - 17:00',
      isSynthetic: false,
      isActive: true,
      sortOrder: 1,
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
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      dealership: mockDealerships[0],
      locationId: 'd1111111-1111-4111-a111-111111111111',
      location: mockDealerships[0],
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
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      dealership: mockDealerships[0],
      locationId: 'd1111111-1111-4111-a111-111111111111',
      location: mockDealerships[0],
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
    render(<EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />);

    expect(screen.getByText('Manajemen Acara')).toBeInTheDocument();
    expect(screen.getByText('Honda Riding Experience Sidoarjo')).toBeInTheDocument();
    expect(screen.getByText('Draf Pameran Motor Matic')).toBeInTheDocument();
    expect(screen.getAllByText('Dipublikasikan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Draf').length).toBeGreaterThanOrEqual(1);
  });

  it('filters events by search query', () => {
    render(<EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />);

    const searchInput = screen.getByLabelText('Cari judul acara');
    fireEvent.change(searchInput, { target: { value: 'Riding' } });

    expect(screen.getByText('Honda Riding Experience Sidoarjo')).toBeInTheDocument();
    expect(screen.queryByText('Draf Pameran Motor Matic')).not.toBeInTheDocument();
  });

  it('filters events by publication status', () => {
    render(<EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />);

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
      dealershipId: 'd1111111-1111-4111-a111-111111111111',
      dealership: mockDealerships[0],
      locationId: 'd1111111-1111-4111-a111-111111111111',
      location: mockDealerships[0],
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

    render(<EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />);

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

    render(<EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />);

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

    render(<EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />);

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

  describe('URL Slug Generation and Synchronization', () => {
    it('automatically updates slug as user types multi-character title', () => {
      render(
        <EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tambah Acara Baru' }));

      const titleInput = screen.getByPlaceholderText(
        'contoh: Honda Riding Experience Sidoarjo 2026'
      ) as HTMLInputElement;
      const slugInput = screen.getByPlaceholderText(
        'contoh: honda-riding-experience-sidoarjo-2026'
      ) as HTMLInputElement;

      // Keystroke 1: 'T'
      fireEvent.change(titleInput, { target: { value: 'T' } });
      expect(slugInput.value).toBe('t');

      // Keystroke 2: 'Te'
      fireEvent.change(titleInput, { target: { value: 'Te' } });
      expect(slugInput.value).toBe('te');

      // Keystroke 3: 'Test'
      fireEvent.change(titleInput, { target: { value: 'Test' } });
      expect(slugInput.value).toBe('test');

      // Keystroke 4: 'Test Acara'
      fireEvent.change(titleInput, { target: { value: 'Test Acara' } });
      expect(slugInput.value).toBe('test-acara');
    });

    it('updates slug when title is modified after initial input', () => {
      render(
        <EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tambah Acara Baru' }));

      const titleInput = screen.getByPlaceholderText(
        'contoh: Honda Riding Experience Sidoarjo 2026'
      ) as HTMLInputElement;
      const slugInput = screen.getByPlaceholderText(
        'contoh: honda-riding-experience-sidoarjo-2026'
      ) as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: 'Pameran Motor' } });
      expect(slugInput.value).toBe('pameran-motor');

      // Modify existing title
      fireEvent.change(titleInput, { target: { value: 'Pameran Motor Honda 2026' } });
      expect(slugInput.value).toBe('pameran-motor-honda-2026');
    });

    it('clears slug when title input is cleared', () => {
      render(
        <EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tambah Acara Baru' }));

      const titleInput = screen.getByPlaceholderText(
        'contoh: Honda Riding Experience Sidoarjo 2026'
      ) as HTMLInputElement;
      const slugInput = screen.getByPlaceholderText(
        'contoh: honda-riding-experience-sidoarjo-2026'
      ) as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: 'Pameran Honda' } });
      expect(slugInput.value).toBe('pameran-honda');

      // Clear title
      fireEvent.change(titleInput, { target: { value: '' } });
      expect(slugInput.value).toBe('');
    });

    it('handles titles with spaces, punctuation, and Indonesian characters in slug', () => {
      render(
        <EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tambah Acara Baru' }));

      const titleInput = screen.getByPlaceholderText(
        'contoh: Honda Riding Experience Sidoarjo 2026'
      ) as HTMLInputElement;
      const slugInput = screen.getByPlaceholderText(
        'contoh: honda-riding-experience-sidoarjo-2026'
      ) as HTMLInputElement;

      fireEvent.change(titleInput, {
        target: { value: 'Pesta BeAT & Vario: Sidoarjo (Promo 100% Resmi)!' },
      });
      expect(slugInput.value).toBe('pesta-beat-vario-sidoarjo-promo-100-resmi');

      fireEvent.change(titleInput, {
        target: { value: 'Éksibisi Servis & Uji Kendara' },
      });
      expect(slugInput.value).toBe('eksibisi-servis-uji-kendara');
    });

    it('preserves manually edited slug without overwriting it on title change', () => {
      render(
        <EventManagementView initialEvents={mockEvents} activeDealerships={mockDealerships} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Tambah Acara Baru' }));

      const titleInput = screen.getByPlaceholderText(
        'contoh: Honda Riding Experience Sidoarjo 2026'
      ) as HTMLInputElement;
      const slugInput = screen.getByPlaceholderText(
        'contoh: honda-riding-experience-sidoarjo-2026'
      ) as HTMLInputElement;

      fireEvent.change(titleInput, { target: { value: 'Peluncuran BeAT' } });
      expect(slugInput.value).toBe('peluncuran-beat');

      // Manually edit the slug
      fireEvent.change(slugInput, { target: { value: 'custom-beat-launch-2026' } });
      expect(slugInput.value).toBe('custom-beat-launch-2026');

      // Subsequent title changes must NOT overwrite manually customized slug
      fireEvent.change(titleInput, { target: { value: 'Peluncuran BeAT Series 2026' } });
      expect(slugInput.value).toBe('custom-beat-launch-2026');
    });
  });
});
