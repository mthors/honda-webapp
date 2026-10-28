import { describe, it, expect } from 'vitest';
import {
  normalizeCity,
  isDateOrderValid,
  isDateRangeActive,
  doDateRangesOverlap,
  findPriceConflict,
  buildConflictQueryFilters,
} from './validation';
import {
  createPriceEntrySchema,
  updatePriceEntrySchema,
  dateStringSchema,
  type PriceConflictCandidate,
} from '@/types/pricing';

describe('Pricing Date Validation & Conflict Detection', () => {
  const variantA = '44444444-4444-4444-d444-444444444401';
  const variantB = '44444444-4444-4444-d444-444444444402';

  describe('normalizeCity', () => {
    it('normalizes city casing and whitespace consistently', () => {
      expect(normalizeCity('Sidoarjo')).toBe('sidoarjo');
      expect(normalizeCity('  sidoarjo  ')).toBe('sidoarjo');
      expect(normalizeCity('KABUPATEN   SIDOARJO')).toBe('kabupaten sidoarjo');
      expect(normalizeCity(null)).toBe('');
      expect(normalizeCity(undefined)).toBe('');
      expect(normalizeCity('')).toBe('');
    });
  });

  describe('isDateOrderValid', () => {
    it('returns true when validUntil is null (open-ended)', () => {
      expect(isDateOrderValid('2026-01-01', null)).toBe(true);
    });

    it('returns true when validUntil is after or equal to validFrom', () => {
      expect(isDateOrderValid('2026-01-01', '2026-01-01')).toBe(true);
      expect(isDateOrderValid('2026-01-01', '2026-06-30')).toBe(true);
    });

    it('returns false when validUntil precedes validFrom', () => {
      expect(isDateOrderValid('2026-06-30', '2026-01-01')).toBe(false);
    });
  });

  describe('isDateRangeActive', () => {
    it('correctly identifies active dates within bounded range', () => {
      const from = '2026-01-01';
      const until = '2026-06-30';

      expect(isDateRangeActive(from, until, '2026-01-01')).toBe(true);
      expect(isDateRangeActive(from, until, '2026-03-15')).toBe(true);
      expect(isDateRangeActive(from, until, '2026-06-30')).toBe(true);
      expect(isDateRangeActive(from, until, '2025-12-31')).toBe(false);
      expect(isDateRangeActive(from, until, '2026-07-01')).toBe(false);
    });

    it('correctly identifies active dates within open-ended range', () => {
      const from = '2026-07-01';
      const until = null;

      expect(isDateRangeActive(from, until, '2026-06-30')).toBe(false);
      expect(isDateRangeActive(from, until, '2026-07-01')).toBe(true);
      expect(isDateRangeActive(from, until, '2027-12-31')).toBe(true);
    });
  });

  describe('doDateRangesOverlap', () => {
    it('detects identical date ranges as overlapping', () => {
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-01-01', validUntil: '2026-06-30' },
          { validFrom: '2026-01-01', validUntil: '2026-06-30' }
        )
      ).toBe(true);
    });

    it('detects partial left overlap', () => {
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-01-01', validUntil: '2026-04-30' },
          { validFrom: '2026-03-01', validUntil: '2026-06-30' }
        )
      ).toBe(true);
    });

    it('detects partial right overlap', () => {
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-04-01', validUntil: '2026-08-31' },
          { validFrom: '2026-01-01', validUntil: '2026-05-31' }
        )
      ).toBe(true);
    });

    it('detects subset range enclosed inside superset', () => {
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-02-01', validUntil: '2026-03-31' },
          { validFrom: '2026-01-01', validUntil: '2026-12-31' }
        )
      ).toBe(true);
    });

    it('detects single shared boundary day as overlapping', () => {
      // Both active on 2026-06-30
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-01-01', validUntil: '2026-06-30' },
          { validFrom: '2026-06-30', validUntil: '2026-12-31' }
        )
      ).toBe(true);
    });

    it('correctly allows strictly adjacent ranges without overlap', () => {
      // Range A ends on 2026-06-30, Range B begins on 2026-07-01 -> strictly adjacent, NO overlap
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-01-01', validUntil: '2026-06-30' },
          { validFrom: '2026-07-01', validUntil: '2026-12-31' }
        )
      ).toBe(false);

      expect(
        doDateRangesOverlap(
          { validFrom: '2026-07-01', validUntil: '2026-12-31' },
          { validFrom: '2026-01-01', validUntil: '2026-06-30' }
        )
      ).toBe(false);
    });

    it('detects open-ended overlaps', () => {
      // Both open-ended
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-01-01', validUntil: null },
          { validFrom: '2026-06-01', validUntil: null }
        )
      ).toBe(true);

      // Candidate open-ended starting inside bounded range
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-03-01', validUntil: null },
          { validFrom: '2026-01-01', validUntil: '2026-06-30' }
        )
      ).toBe(true);

      // Existing open-ended starting earlier than bounded candidate
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-05-01', validUntil: '2026-09-30' },
          { validFrom: '2026-01-01', validUntil: null }
        )
      ).toBe(true);
    });

    it('correctly handles open-ended range that begins strictly after an earlier bounded range', () => {
      // Earlier bounded range finishes before the open-ended range begins
      expect(
        doDateRangesOverlap(
          { validFrom: '2026-07-01', validUntil: null },
          { validFrom: '2026-01-01', validUntil: '2026-06-30' }
        )
      ).toBe(false);

      expect(
        doDateRangesOverlap(
          { validFrom: '2026-01-01', validUntil: '2026-06-30' },
          { validFrom: '2026-07-01', validUntil: null }
        )
      ).toBe(false);
    });
  });

  describe('findPriceConflict', () => {
    const existingEntries: PriceConflictCandidate[] = [
      {
        id: '11111111-1111-1111-1111-111111111101',
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: '2026-06-30',
        isPublished: true,
      },
      {
        id: '11111111-1111-1111-1111-111111111102',
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-07-01',
        validUntil: null,
        isPublished: true,
      },
      {
        id: '11111111-1111-1111-1111-111111111103',
        variantId: variantA,
        city: 'Surabaya',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: null,
        isPublished: true,
      },
      {
        id: '11111111-1111-1111-1111-111111111104',
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'cash',
        validFrom: '2026-01-01',
        validUntil: null,
        isPublished: true,
      },
      {
        id: '11111111-1111-1111-1111-111111111105',
        variantId: variantB,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: null,
        isPublished: true,
      },
    ];

    it('rejects candidate with invalid date order (validFrom > validUntil)', () => {
      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-06-01',
        validUntil: '2026-01-01',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(true);
      expect(result.reason).toContain('tidak boleh mendahului');
    });

    it('flags conflict when candidate overlaps existing entry for same variant, city, and type', () => {
      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-03-01',
        validUntil: '2026-08-31',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEntry?.id).toBe('11111111-1111-1111-1111-111111111101');
      expect(result.reason).toContain('Konflik periode harga');
    });

    it('flags conflict even if city casing or spacing differs slightly', () => {
      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: '  sidoarjo  ',
        priceType: 'otr',
        validFrom: '2026-05-01',
        validUntil: '2026-05-31',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(true);
    });

    it('allows overlapping dates if variant is different', () => {
      // Variant B already has open-ended, but Variant C has no entries
      const variantC = '44444444-4444-4444-d444-444444444403';
      const candidate: PriceConflictCandidate = {
        variantId: variantC,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(false);
    });

    it('allows overlapping dates if city is different', () => {
      // Candidate for Malang
      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: 'Malang',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: null,
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(false);
    });

    it('allows overlapping dates if priceType is different', () => {
      // Candidate for 'promo' type in Sidoarjo (existing has 'otr' and 'cash')
      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'promo',
        validFrom: '2026-01-01',
        validUntil: '2026-06-30',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(false);
    });

    it('allows update of an existing entry without conflicting with itself', () => {
      // Updating entry 101's amount without changing dates
      const candidate: PriceConflictCandidate = {
        id: '11111111-1111-1111-1111-111111111101',
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: '2026-06-30',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(false);
    });

    it('detects conflict when updating an entry so that it collides with a distinct existing entry', () => {
      // Updating entry 101 to extend until 2026-08-31, which collides with entry 102 (starts 2026-07-01)
      const candidate: PriceConflictCandidate = {
        id: '11111111-1111-1111-1111-111111111101',
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: '2026-08-31',
      };

      const result = findPriceConflict(candidate, existingEntries);
      expect(result.hasConflict).toBe(true);
      expect(result.conflictingEntry?.id).toBe('11111111-1111-1111-1111-111111111102');
    });

    it('respects publishedOnly option when unpublished fixtures exist', () => {
      const entriesWithDraft: PriceConflictCandidate[] = [
        {
          id: 'draft-1',
          variantId: variantA,
          city: 'Sidoarjo',
          priceType: 'otr',
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
          isPublished: false,
        },
      ];

      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-05-01',
        validUntil: '2026-06-30',
      };

      // When checking against published only, draft does not conflict
      const resultPublished = findPriceConflict(candidate, entriesWithDraft, {
        publishedOnly: true,
      });
      expect(resultPublished.hasConflict).toBe(false);

      // Default checks all entries, so it detects conflict
      const resultAll = findPriceConflict(candidate, entriesWithDraft);
      expect(resultAll.hasConflict).toBe(true);
    });
  });

  describe('buildConflictQueryFilters', () => {
    it('returns structured database filter parameters', () => {
      const candidate: PriceConflictCandidate = {
        variantId: variantA,
        city: 'Sidoarjo',
        priceType: 'otr',
        validFrom: '2026-01-01',
        validUntil: null,
      };

      expect(buildConflictQueryFilters(candidate)).toEqual({
        variant_id: variantA,
        price_type: 'otr',
        city: 'Sidoarjo',
      });
    });
  });

  describe('Zod Schema Validation', () => {
    describe('dateStringSchema', () => {
      it('accepts valid calendar dates in YYYY-MM-DD format', () => {
        expect(dateStringSchema.safeParse('2026-01-15').success).toBe(true);
        expect(dateStringSchema.safeParse('2024-02-29').success).toBe(true); // leap year
      });

      it('rejects invalid calendar dates or formats', () => {
        expect(dateStringSchema.safeParse('2026-02-30').success).toBe(false); // Feb 30 does not exist
        expect(dateStringSchema.safeParse('2026-13-01').success).toBe(false); // Month 13
        expect(dateStringSchema.safeParse('15-01-2026').success).toBe(false); // Wrong format
        expect(dateStringSchema.safeParse('invalid').success).toBe(false);
      });
    });

    describe('createPriceEntrySchema', () => {
      it('validates a complete, valid price entry payload', () => {
        const payload = {
          variantId: '44444444-4444-4444-d444-444444444401',
          city: 'Sidoarjo',
          priceType: 'otr' as const,
          amountIdr: 27500000,
          validFrom: '2026-01-01',
          validUntil: '2026-12-31',
          isPublished: false,
          sourceNote: 'Internal dealer rate card Q1 2026',
        };

        const result = createPriceEntrySchema.safeParse(payload);
        expect(result.success).toBe(true);
      });

      it('accepts open-ended validUntil (null or undefined)', () => {
        const payload = {
          variantId: '44444444-4444-4444-d444-444444444401',
          city: 'Sidoarjo',
          priceType: 'otr' as const,
          amountIdr: 27500000,
          validFrom: '2026-01-01',
          validUntil: null,
        };

        const result = createPriceEntrySchema.safeParse(payload);
        expect(result.success).toBe(true);
      });

      it('rejects negative or non-integer amounts', () => {
        const payload = {
          variantId: '44444444-4444-4444-d444-444444444401',
          city: 'Sidoarjo',
          priceType: 'otr' as const,
          amountIdr: -1000,
          validFrom: '2026-01-01',
        };

        const result = createPriceEntrySchema.safeParse(payload);
        expect(result.success).toBe(false);
      });

      it('rejects payload when validUntil precedes validFrom', () => {
        const payload = {
          variantId: '44444444-4444-4444-d444-444444444401',
          city: 'Sidoarjo',
          priceType: 'otr' as const,
          amountIdr: 27500000,
          validFrom: '2026-06-30',
          validUntil: '2026-01-01',
        };

        const result = createPriceEntrySchema.safeParse(payload);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('tidak boleh mendahului');
        }
      });
    });

    describe('updatePriceEntrySchema', () => {
      it('validates partial updates', () => {
        const payload = {
          id: '77777777-7777-4777-8777-777777777701',
          amountIdr: 28000000,
          sourceNote: 'Adjusted for inflation',
        };

        const result = updatePriceEntrySchema.safeParse(payload);
        expect(result.success).toBe(true);
      });

      it('rejects partial update if both validFrom and validUntil are provided in reverse order', () => {
        const payload = {
          id: '77777777-7777-4777-8777-777777777701',
          validFrom: '2026-12-31',
          validUntil: '2026-01-01',
        };

        const result = updatePriceEntrySchema.safeParse(payload);
        expect(result.success).toBe(false);
      });
    });
  });
});
