import { describe, it, expect } from 'vitest';
import { buildMonthCalendarGrid, groupEventsByDate } from './calendar';
import type { EventItem } from '@/types/events';

describe('Calendar Grid Generation', () => {
  const dummyEvent1: EventItem = {
    id: 'e1',
    title: 'Honda Riding Experience',
    slug: 'honda-riding-experience',
    description: 'Uji kendara motor Honda terbaru',
    locationId: 'loc-1',
    startAt: '2026-11-20T02:00:00.000Z', // 20 Nov 09:00 WIB
    endAt: '2026-11-20T08:00:00.000Z', // 20 Nov 15:00 WIB
    imageUrl: null,
    status: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  const dummyEventMultiDay: EventItem = {
    id: 'e2',
    title: 'Pameran Akhir Pekan',
    slug: 'pameran-akhir-pekan',
    description: 'Pameran promo akhir pekan Honda',
    locationId: 'loc-1',
    startAt: '2026-11-20T02:00:00.000Z', // 20 Nov
    endAt: '2026-11-22T10:00:00.000Z', // 22 Nov
    imageUrl: null,
    status: 'published',
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  it('groups events by date including multi-day events across all days', () => {
    const grouped = groupEventsByDate([dummyEvent1, dummyEventMultiDay]);
    expect(grouped['2026-11-20']).toHaveLength(2);
    expect(grouped['2026-11-21']).toHaveLength(1);
    expect(grouped['2026-11-22']).toHaveLength(1);
    expect(grouped['2026-11-23']).toBeUndefined();
  });

  it('builds month calendar grid with 7-column layout and correct dates', () => {
    // Reference now: 2026-11-17
    const referenceNow = new Date('2026-11-17T03:00:00.000Z');
    const cells = buildMonthCalendarGrid(2026, 11, [dummyEvent1, dummyEventMultiDay], referenceNow);

    expect(cells.length % 7).toBe(0);

    const nov20Cell = cells.find((c) => c.dateKey === '2026-11-20');
    expect(nov20Cell).toBeDefined();
    expect(nov20Cell?.isCurrentMonth).toBe(true);
    expect(nov20Cell?.events).toHaveLength(2);

    const todayCell = cells.find((c) => c.dateKey === '2026-11-17');
    expect(todayCell?.isToday).toBe(true);
  });
});
