import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventDetailPage from './page';
import * as eventQueries from '@/lib/events/queries';
import * as navigation from 'next/navigation';
import type { EventItem } from '@/types/events';

vi.mock('@/lib/events/queries', () => ({
  getPublicEventBySlug: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

describe('EventDetailPage (/events/[slug])', () => {
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

  const mockEvent: EventItem = {
    id: 'e1',
    title: 'Honda Riding Experience Sidoarjo',
    slug: 'honda-riding-experience-sidoarjo',
    description: 'Uji kendara motor Honda terbaru bersama instruktur profesional.',
    dealershipId: 'loc-1',
    locationId: 'loc-1',
    location: mockLocation,
    startAt: '2026-11-20T02:00:00.000Z',
    endAt: '2026-11-20T08:00:00.000Z',
    imageUrl: null,
    status: 'published',
    createdAt: '2026-11-17T08:00:00.000Z',
    updatedAt: '2026-11-17T08:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders event details with title, date, location, and description', async () => {
    vi.mocked(eventQueries.getPublicEventBySlug).mockResolvedValue(mockEvent);

    const jsx = await EventDetailPage({
      params: Promise.resolve({ slug: 'honda-riding-experience-sidoarjo' }),
    });
    render(jsx);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Honda Riding Experience Sidoarjo' })
    ).toBeInTheDocument();
    expect(screen.getByText('Demo Dealer – Sidoarjo')).toBeInTheDocument();
    expect(screen.getByText('Jl. Raya Sidoarjo No. 123')).toBeInTheDocument();
    expect(screen.getByText(/Uji kendara motor Honda terbaru/)).toBeInTheDocument();
  });

  it('calls notFound() when event is not found or unpublished', async () => {
    vi.mocked(eventQueries.getPublicEventBySlug).mockResolvedValue(null);

    await EventDetailPage({ params: Promise.resolve({ slug: 'non-existent' }) });

    expect(navigation.notFound).toHaveBeenCalled();
  });
});
