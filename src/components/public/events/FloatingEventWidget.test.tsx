import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FloatingEventWidget } from './FloatingEventWidget';
import type { EventItem } from '@/types/events';

describe('FloatingEventWidget component', () => {
  const mockEvents: EventItem[] = [
    {
      id: 'event-1',
      title: 'Honda Riding Experience Sidoarjo 2026',
      slug: 'honda-riding-experience-sidoarjo-2026',
      description: 'Nikmati sensasi berkendara motor Honda terbaru.',
      dealershipId: 'dealer-1',
      dealership: {
        id: 'dealer-1',
        name: 'Honda Satrya Sidoarjo',
        code: 'HSS-01',
        city: 'Sidoarjo',
        address: 'Jl. Raya Waru No. 10',
        phone: '031-8901234',
        whatsappNumber: '6281234567890',
        openingHours: 'Senin - Sabtu: 08:00 - 17:00 WIB',
        isSynthetic: false,
        isActive: true,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      locationId: 'dealer-1',
      location: null,
      startAt: '2026-11-20T02:00:00.000Z', // 09:00 WIB
      endAt: '2026-11-22T10:00:00.000Z', // 17:00 WIB (Multi-day: Nov 20 - Nov 22)
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc',
      status: 'published',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
    {
      id: 'event-2-draft',
      title: 'Draft Unreleased Event',
      slug: 'draft-unreleased-event',
      description: 'Draf acara internal.',
      dealershipId: 'dealer-1',
      dealership: null,
      locationId: 'dealer-1',
      location: null,
      startAt: '2026-11-25T02:00:00.000Z',
      endAt: '2026-11-25T10:00:00.000Z',
      imageUrl: null,
      status: 'draft',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the floating trigger button with calendar icon and label', () => {
    render(<FloatingEventWidget events={mockEvents} />);
    const triggerBtn = screen.getByRole('button', { name: /Buka Agenda Kegiatan/i });
    expect(triggerBtn).toBeInTheDocument();
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(triggerBtn).toHaveAttribute('aria-haspopup', 'dialog');
    expect(within(triggerBtn).getByText('Agenda Kegiatan')).toBeInTheDocument();
  });

  it('opens and closes the calendar panel on trigger click', () => {
    render(<FloatingEventWidget events={mockEvents} />);
    const triggerBtn = screen.getByRole('button', { name: /Buka Agenda Kegiatan/i });

    // Open
    fireEvent.click(triggerBtn);
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('dialog', { name: 'Agenda Kegiatan' });
    expect(panel).toBeInTheDocument();
    expect(panel.className).toContain('opacity-100');

    // Close
    fireEvent.click(triggerBtn);
    expect(triggerBtn).toHaveAttribute('aria-expanded', 'false');
    expect(panel.className).toContain('opacity-0');
  });

  it('closes calendar panel when close button inside panel is clicked', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);
    const panel = screen.getByRole('dialog', { name: 'Agenda Kegiatan' });
    const closeBtn = within(panel).getByRole('button', { name: /Tutup Agenda Kegiatan/i });

    fireEvent.click(closeBtn);
    expect(panel.className).toContain('opacity-0');
  });

  it('closes calendar panel on Escape key press', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);
    const panel = screen.getByRole('dialog', { name: 'Agenda Kegiatan' });
    expect(panel.className).toContain('opacity-100');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(panel.className).toContain('opacity-0');
  });

  it('closes calendar panel on outside click and prevents inside clicks from closing', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);
    const panel = screen.getByRole('dialog', { name: 'Agenda Kegiatan' });
    expect(panel.className).toContain('opacity-100');

    // Clicking inside the panel should NOT close it
    fireEvent.mouseDown(panel);
    expect(panel.className).toContain('opacity-100');

    // Clicking outside on document.body should close it
    fireEvent.mouseDown(document.body);
    expect(panel.className).toContain('opacity-0');
  });

  it('navigates between previous and next months', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);
    const prevBtn = screen.getByRole('button', { name: /Bulan Sebelumnya/i });
    const nextBtn = screen.getByRole('button', { name: /Bulan Berikutnya/i });
    const todayBtn = screen.getByRole('button', { name: /Hari Ini/i });

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();
    expect(todayBtn).toBeInTheDocument();

    // Click previous month
    fireEvent.click(prevBtn);
    // Click next month
    fireEvent.click(nextBtn);
    // Click today reset
    fireEvent.click(todayBtn);
  });

  it('marks dates covering multi-day published events with event indicators and ignores drafts', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);

    // Multi-day event covers Nov 20, Nov 21, Nov 22 in 2026
    const cell20 = screen.getByRole('button', { name: /20.*1 acara/i });
    const cell21 = screen.getByRole('button', { name: /21.*1 acara/i });
    const cell22 = screen.getByRole('button', { name: /22.*1 acara/i });

    expect(cell20).toBeInTheDocument();
    expect(cell21).toBeInTheDocument();
    expect(cell22).toBeInTheDocument();

    // Draft event on Nov 25 must NOT have an event indicator
    const cell25 = screen.getByRole('button', { name: /25.*0 acara/i });
    expect(cell25).toBeInTheDocument();
  });

  it('displays matching event details when selecting a date with events', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);

    // Click on Nov 20 cell
    const cell20 = screen.getByRole('button', { name: /20.*1 acara/i });
    fireEvent.click(cell20);

    // Event title, date, dealership location, and detail link
    expect(screen.getByText('Honda Riding Experience Sidoarjo 2026')).toBeInTheDocument();
    expect(screen.getByText(/Honda Satrya Sidoarjo, Sidoarjo/i)).toBeInTheDocument();

    const detailLink = screen.getByRole('link', { name: /Lihat Detail/i });
    expect(detailLink).toHaveAttribute('href', '/events/honda-riding-experience-sidoarjo-2026');
  });

  it('shows friendly Indonesian empty state when selecting a date with no events', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);

    // Click on Nov 15 cell (has 0 events)
    const cell15 = screen.getByRole('button', { name: /15.*0 acara/i });
    fireEvent.click(cell15);

    expect(
      screen.getByText('Tidak ada acara yang dijadwalkan pada tanggal ini.')
    ).toBeInTheDocument();
  });

  it('includes a link to view all events (/events)', () => {
    render(<FloatingEventWidget events={mockEvents} defaultOpen={true} />);
    const viewAllLink = screen.getByRole('link', { name: /Lihat Semua Agenda/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute('href', '/events');
  });
});
