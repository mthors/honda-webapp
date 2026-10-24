import { describe, it, expect } from 'vitest';
import { formatRupiah, normalizeIndonesianPhone } from './formatters';

describe('formatRupiah', () => {
  it('formats positive integers into standard Indonesian Rupiah', () => {
    const formatted = formatRupiah(19500000);
    expect(formatted).toMatch(/Rp\s?19\.500\.000/);
  });

  it('formats large motorcycle prices accurately without decimal points', () => {
    const formatted = formatRupiah(85000000);
    expect(formatted).toMatch(/Rp\s?85\.000\.000/);
  });

  it('handles zero amount safely', () => {
    const formatted = formatRupiah(0);
    expect(formatted).toMatch(/Rp\s?0/);
  });

  it('returns Rp 0 for negative or invalid numbers', () => {
    expect(formatRupiah(-50000)).toBe('Rp 0');
    expect(formatRupiah(NaN)).toBe('Rp 0');
    expect(formatRupiah(Infinity)).toBe('Rp 0');
  });
});

describe('normalizeIndonesianPhone', () => {
  it('converts leading 08 phone number to 628 format', () => {
    expect(normalizeIndonesianPhone('081234567890')).toBe('6281234567890');
  });

  it('preserves numbers already starting with 62', () => {
    expect(normalizeIndonesianPhone('6281234567890')).toBe('6281234567890');
  });

  it('strips non-digit characters like hyphens, spaces, and plus signs', () => {
    expect(normalizeIndonesianPhone('+62 812-3456-7890')).toBe('6281234567890');
    expect(normalizeIndonesianPhone('0812 3456 7890')).toBe('6281234567890');
  });
});
