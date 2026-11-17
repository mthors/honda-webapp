import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpcomingEventsSection } from './UpcomingEventsSection';
import type { EventItem } from '@/types/events';

describe('UpcomingEventsSection', () => {
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

  it('renders upcoming events list with event title, date, location, and action', () => {
    render(<UpcomingEventsSection upcomingEvents={mockEvents} />);

    expect(screen.getByText('Acara Mendatang')).toBeInTheDocument();
    expect(screen.getByText('Honda Riding Experience Sidoarjo')).toBeInTheDocument();
    expect(screen.getByText('Demo Dealer – Sidoarjo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lihat Detail' })).toBeInTheDocument();
  });

  it('opens event detail modal when Lihat Detail is clicked', () => {
    render(<UpcomingEventsSection upcomingEvents={mockEvents} />);

    fireEvent.click(screen.getByRole('button', { name: 'Lihat Detail' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Detail Acara')).toBeInTheDocument();
    expect(screen.getByText('Jl. Raya Sidoarjo No. 123')).toBeInTheDocument();
  });

  it('renders clean empty state when no upcoming events exist', () => {
    render(<UpcomingEventsSection upcomingEvents={[]} />);

    expect(screen.getByText('Acara Mendatang')).toBeInTheDocument();
    expect(
      screen.getByText('Belum ada agenda acara mendatang yang dijadwalkan.')
    ).toBeInTheDocument();
  });
});
