import type { EventItem } from '@/types/events';
import { getJakartaDateParts, getEventDateKeys } from './timezone';

export interface CalendarDayCell {
  dateKey: string; // YYYY-MM-DD
  dayNumber: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: EventItem[];
}

export const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Sen' },
  { key: 'tue', label: 'Sel' },
  { key: 'wed', label: 'Rab' },
  { key: 'thu', label: 'Kam' },
  { key: 'fri', label: 'Jum' },
  { key: 'sat', label: 'Sab' },
  { key: 'sun', label: 'Min' },
];

/**
 * Maps an array of events into a dictionary keyed by YYYY-MM-DD.
 * Multi-day events are indexed across every date key they cover.
 */
export function groupEventsByDate(events: EventItem[]): Record<string, EventItem[]> {
  const map: Record<string, EventItem[]> = {};

  for (const event of events) {
    const dateKeys = getEventDateKeys(event.startAt, event.endAt);
    for (const key of dateKeys) {
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(event);
    }
  }

  return map;
}

/**
 * Builds the calendar grid for a given year and month (1-12) in Asia/Jakarta timezone.
 */
export function buildMonthCalendarGrid(
  year: number,
  month: number, // 1-12
  events: EventItem[],
  referenceNow: Date = new Date()
): CalendarDayCell[] {
  const nowParts = getJakartaDateParts(referenceNow);
  const todayKey = nowParts.dateKey;
  const eventsByDate = groupEventsByDate(events);

  // Number of days in the specified month
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // First day of this month in UTC
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1));
  // getUTCDay: 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Convert to Monday = 0, ..., Sunday = 6
  const startDayOfWeek = (firstDayOfMonth.getUTCDay() + 6) % 7;

  // Number of days in previous month
  const prevMonthDate = new Date(Date.UTC(year, month - 1, 0));
  const daysInPrevMonth = prevMonthDate.getUTCDate();
  const prevMonthYear = prevMonthDate.getUTCFullYear();
  const prevMonthNumber = prevMonthDate.getUTCMonth() + 1;

  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonthYear = nextMonthDate.getUTCFullYear();
  const nextMonthNumber = nextMonthDate.getUTCMonth() + 1;

  const cells: CalendarDayCell[] = [];

  // 1. Previous month trailing days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateKey = `${prevMonthYear}-${String(prevMonthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      dateKey,
      dayNumber: day,
      month: prevMonthNumber,
      year: prevMonthYear,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      events: eventsByDate[dateKey] || [],
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      dateKey,
      dayNumber: day,
      month,
      year,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      events: eventsByDate[dateKey] || [],
    });
  }

  // 3. Next month leading days (to fill complete 7-day rows)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const dateKey = `${nextMonthYear}-${String(nextMonthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      dateKey,
      dayNumber: day,
      month: nextMonthNumber,
      year: nextMonthYear,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      events: eventsByDate[dateKey] || [],
    });
  }

  return cells;
}
