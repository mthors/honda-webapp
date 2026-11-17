import { describe, it, expect } from 'vitest';
import {
  getJakartaDateParts,
  jakartaToIsoString,
  formatJakartaDate,
  formatJakartaTime,
  formatJakartaDateRange,
  getEventDateKeys,
} from './timezone';

describe('Asia/Jakarta Timezone Utilities', () => {
  it('extracts correct date parts in Asia/Jakarta (UTC+7)', () => {
    // 2026-11-20T03:00:00Z is 2026-11-20T10:00:00 in Asia/Jakarta
    const utcIso = '2026-11-20T03:00:00.000Z';
    const parts = getJakartaDateParts(utcIso);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(11);
    expect(parts.day).toBe(20);
    expect(parts.hours).toBe(10);
    expect(parts.minutes).toBe(0);
    expect(parts.dateKey).toBe('2026-11-20');
  });

  it('correctly shifts calendar date across midnight boundary in Asia/Jakarta', () => {
    // 2026-11-19T23:30:00Z is 2026-11-20T06:30:00 in Asia/Jakarta
    const utcIso = '2026-11-19T23:30:00.000Z';
    const parts = getJakartaDateParts(utcIso);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(11);
    expect(parts.day).toBe(20);
    expect(parts.hours).toBe(6);
    expect(parts.minutes).toBe(30);
    expect(parts.dateKey).toBe('2026-11-20');
  });

  it('converts local Jakarta date and time to ISO UTC string', () => {
    const iso = jakartaToIsoString('2026-11-20', '10:00');
    expect(new Date(iso).toISOString()).toBe('2026-11-20T03:00:00.000Z');
  });

  it('formats dates in Indonesian locale in Asia/Jakarta', () => {
    const utcIso = '2026-11-20T03:00:00.000Z';
    const formatted = formatJakartaDate(utcIso);
    expect(formatted).toContain('20');
    expect(formatted).toContain('November');
    expect(formatted).toContain('2026');
  });

  it('formats time with WIB suffix', () => {
    const utcIso = '2026-11-20T03:30:00.000Z';
    const formatted = formatJakartaTime(utcIso);
    expect(formatted).toBe('10:30 WIB');
  });

  it('formats same-day event range compactly', () => {
    const startIso = '2026-11-20T02:00:00.000Z'; // 09:00 WIB
    const endIso = '2026-11-20T08:00:00.000Z'; // 15:00 WIB
    const formatted = formatJakartaDateRange(startIso, endIso);
    expect(formatted).toContain('09:00 WIB');
    expect(formatted).toContain('15:00 WIB');
    expect(formatted).toContain('20 November 2026');
  });

  it('formats multi-day event range across distinct dates', () => {
    const startIso = '2026-11-20T02:00:00.000Z'; // 20 Nov 09:00 WIB
    const endIso = '2026-11-22T10:00:00.000Z'; // 22 Nov 17:00 WIB
    const formatted = formatJakartaDateRange(startIso, endIso);
    expect(formatted).toContain('20 Nov 2026 (09:00 WIB)');
    expect(formatted).toContain('22 Nov 2026 (17:00 WIB)');
  });

  it('generates all date keys covered by multi-day event in Asia/Jakarta', () => {
    const startIso = '2026-11-20T02:00:00.000Z'; // 20 Nov
    const endIso = '2026-11-23T05:00:00.000Z'; // 23 Nov
    const keys = getEventDateKeys(startIso, endIso);
    expect(keys).toEqual(['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23']);
  });
});
