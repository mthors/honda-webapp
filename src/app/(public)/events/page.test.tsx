import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicEventsPage from './page';
import * as eventQueries from '@/lib/events/queries';
import type { EventItem } from '@/types/events';

vi.mock('@/lib/events/queries', () => ({
  getPublicEvents: vi.fn(),
  getPublicUpcomingEvents: vi.fn(),
}));

describe('PublicEventsPage (/events)', () => {
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
      locationId: 'loc-1',
      location: mockLocation,
      startAt: '2026-11-20T02:00:00.000Z',
      endAt: '2026-11-20T08:00:00.000Z',
      imageUrl: null,
      status: 'published',
      createdAt: '2026-11-17T08:00:00.000Z',
      updatedAt: '2026-11-17T08:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page header, calendar section, and upcoming events', async () => {
    vi.mocked(eventQueries.getPublicEvents).mockResolvedValue(mockEvents);
    vi.mocked(eventQueries.getPublicUpcomingEvents).mockResolvedValue(mockEvents);

    const jsx = await PublicEventsPage();
    render(jsx);

    expect(
      screen.getByRole('heading', { level: 1, name: /Agenda Kegiatan & Acara Dealer/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Agenda Kegiatan')).toBeInTheDocument();
    expect(screen.getByText('Acara Mendatang')).toBeInTheDocument();
    expect(screen.getAllByText('Honda Riding Experience Sidoarjo').length).toBeGreaterThanOrEqual(
      1
    );
  });
});
