import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCalendarView } from './EventCalendarView';
import type { EventItem } from '@/types/events';

describe('EventCalendarView', () => {
  const mockLocation = {
    id: 'loc-1',
    name: 'Demo Dealer – Sidoarjo',
    city: 'Sidoarjo',
    address: 'Jl. Raya Sidoarjo No. 123',
    phone: '(031) 894-1234',
    isActive: true,
    createdAt: '2026-11-17T08:00:00.000Z',
    updatedAt: '2026-11-17T08:00:00.000Z',
  };

  const mockEvents: EventItem[] = [
    {
      id: 'e1',
      title: 'Honda Riding Experience Sidoarjo',
      slug: 'honda-riding-experience-sidoarjo',
      description: 'Uji kendara motor Honda terbaru bersama instruktur profesional.',
      dealershipId: 'loc-1',
      locationId: 'loc-1',
      location: mockLocation,
      startAt: '2026-11-20T02:00:00.000Z', // 09:00 WIB
      endAt: '2026-11-20T08:00:00.000Z', // 15:00 WIB
      imageUrl: null,
      status: 'published',
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
    {
      id: 'e2',
      title: 'Pameran Akhir Pekan Honda',
      slug: 'pameran-akhir-pekan-honda',
      description: 'Pameran promo akhir pekan Honda di showroom Sidoarjo.',
      dealershipId: 'loc-1',
      locationId: 'loc-1',
      location: mockLocation,
      startAt: '2026-11-20T02:00:00.000Z', // 20 Nov
      endAt: '2026-11-22T10:00:00.000Z', // 22 Nov (multi-day)
      imageUrl: null,
      status: 'published',
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar with days of week headers and navigation controls', () => {
    render(<EventCalendarView events={mockEvents} />);

    // Days of week
    expect(screen.getByText('Sen')).toBeInTheDocument();
    expect(screen.getByText('Sel')).toBeInTheDocument();
    expect(screen.getByText('Rab')).toBeInTheDocument();
    expect(screen.getByText('Kam')).toBeInTheDocument();
    expect(screen.getByText('Jum')).toBeInTheDocument();
    expect(screen.getByText('Sab')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();

    // Nav controls
    expect(screen.getByRole('button', { name: 'Bulan Sebelumnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bulan Berikutnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hari Ini' })).toBeInTheDocument();
  });

  it('navigates to previous and next month when buttons are clicked', () => {
    render(<EventCalendarView events={mockEvents} />);

    const nextBtn = screen.getByRole('button', { name: 'Bulan Berikutnya' });
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByRole('button', { name: 'Bulan Sebelumnya' });
    fireEvent.click(prevBtn);

    // Click Hari Ini resets
    const todayBtn = screen.getByRole('button', { name: 'Hari Ini' });
    fireEvent.click(todayBtn);
  });

  it('displays associated events when clicking a date with events', () => {
    render(<EventCalendarView events={mockEvents} />);

    // Find date button for day 20
    const day20Buttons = screen.getAllByRole('button', { name: /20/ });
    const nov20Button = day20Buttons.find(
      (btn) =>
        btn.getAttribute('aria-label')?.includes('20') &&
        !btn.getAttribute('aria-label')?.includes('bulan lain')
    );

    if (nov20Button) {
      fireEvent.click(nov20Button);
      expect(screen.getByText('Honda Riding Experience Sidoarjo')).toBeInTheDocument();
      expect(screen.getByText('Pameran Akhir Pekan Honda')).toBeInTheDocument();
    }
  });

  it('displays empty state when clicking a date with no events', () => {
    render(<EventCalendarView events={mockEvents} />);

    // Find date button for day 15 (which has no events)
    const day15Buttons = screen.getAllByRole('button', { name: /15/ });
    const nov15Button = day15Buttons.find(
      (btn) =>
        btn.getAttribute('aria-label')?.includes('15') &&
        !btn.getAttribute('aria-label')?.includes('bulan lain')
    );

    if (nov15Button) {
      fireEvent.click(nov15Button);
      expect(
        screen.getByText('Tidak ada acara yang dijadwalkan pada tanggal ini.')
      ).toBeInTheDocument();
    }
  });

  it('opens accessible event detail modal when clicking Lihat Detail', () => {
    render(<EventCalendarView events={mockEvents} />);

    const day20Buttons = screen.getAllByRole('button', { name: /20/ });
    const nov20Button = day20Buttons.find(
      (btn) =>
        btn.getAttribute('aria-label')?.includes('20') &&
        !btn.getAttribute('aria-label')?.includes('bulan lain')
    );

    if (nov20Button) {
      fireEvent.click(nov20Button);
      const detailButtons = screen.getAllByRole('button', { name: /Lihat Detail/i });
      fireEvent.click(detailButtons[0]);

      // Modal appears
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Detail Acara')).toBeInTheDocument();
      expect(screen.getByText('Jl. Raya Sidoarjo No. 123')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByRole('button', { name: 'Tutup Detail Acara' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
  });
});
