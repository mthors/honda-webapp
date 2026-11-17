import { describe, it, expect } from 'vitest';
import { toEventSlug } from './slug';

describe('toEventSlug', () => {
  it('handles empty and whitespace-only titles by returning empty string', () => {
    expect(toEventSlug('')).toBe('');
    expect(toEventSlug('   ')).toBe('');
  });

  it('converts single character and multi-character titles to lowercase slug', () => {
    expect(toEventSlug('T')).toBe('t');
    expect(toEventSlug('Te')).toBe('te');
    expect(toEventSlug('Test')).toBe('test');
    expect(toEventSlug('Honda Riding Experience')).toBe('honda-riding-experience');
  });

  it('handles titles with spaces, punctuation, and special characters', () => {
    expect(toEventSlug('Pameran Motor Honda: BeAT & Vario (Sidoarjo)!')).toBe(
      'pameran-motor-honda-beat-vario-sidoarjo'
    );
    expect(toEventSlug('Test Drive 100% Gratis - Showroom Honda!')).toBe(
      'test-drive-100-gratis-showroom-honda'
    );
  });

  it('handles Indonesian diacritics and accented characters gracefully', () => {
    expect(toEventSlug('Éksibisi Motor Matic Honda Sidoarjo')).toBe(
      'eksibisi-motor-matic-honda-sidoarjo'
    );
    expect(toEventSlug('Kafe & Konsultasi Servis')).toBe('kafe-konsultasi-servis');
  });

  it('collapses consecutive spaces, hyphens, and underscores into a single hyphen', () => {
    expect(toEventSlug('Honda    Event____Special---Edition')).toBe('honda-event-special-edition');
    expect(toEventSlug('  --- Promo Kemerdekaan RI Ke-81 ---  ')).toBe(
      'promo-kemerdekaan-ri-ke-81'
    );
  });
});
