import type { PriceConflictCandidate, PriceDateRange, PriceEntry } from '@/types/pricing';

/**
 * Normalizes city names for consistent, case-insensitive comparison.
 * Trims extra whitespace and converts to lower case.
 * Null, undefined, or empty strings are normalized to an empty string.
 */
export function normalizeCity(city?: string | null): string {
  if (!city) return '';
  return city.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks whether validUntil is null or greater than or equal to validFrom.
 */
export function isDateOrderValid(validFrom: string, validUntil: string | null): boolean {
  if (!validUntil) return true;
  return validUntil >= validFrom;
}

/**
 * Checks whether a target date (YYYY-MM-DD) falls within an effective date window.
 * If targetDate is omitted, current local ISO date is used.
 */
export function isDateRangeActive(
  validFrom: string,
  validUntil: string | null,
  targetDate?: string
): boolean {
  const checkDate = targetDate || new Date().toISOString().split('T')[0];
  if (checkDate < validFrom) return false;
  if (validUntil && checkDate > validUntil) return false;
  return true;
}

/**
 * Determines whether two effective date ranges overlap.
 * Null validUntil is treated as open-ended (positive infinity).
 *
 * Range A and Range B overlap on discrete calendar days if and only if:
 * validFromA <= (validUntilB ?? infinity) AND validFromB <= (validUntilA ?? infinity)
 */
export function doDateRangesOverlap(rangeA: PriceDateRange, rangeB: PriceDateRange): boolean {
  const farFuture = '9999-12-31';
  const endA = rangeA.validUntil || farFuture;
  const endB = rangeB.validUntil || farFuture;

  return rangeA.validFrom <= endB && rangeB.validFrom <= endA;
}

export interface PriceConflictResult {
  hasConflict: boolean;
  conflictingEntry?: PriceEntry | PriceConflictCandidate;
  reason?: string;
}

export interface ConflictCheckOptions {
  /**
   * If true, only checks against entries where isPublished is true.
   * Default: false (checks against all active price records for the variant/city/type).
   */
  publishedOnly?: boolean;
}

/**
 * Checks whether a candidate price entry conflicts with any existing price entries.
 *
 * A conflict occurs when an existing entry matches:
 * 1. The same variant ID
 * 2. The same normalized city (case-insensitive)
 * 3. The same price type ('otr' | 'cash' | 'promo')
 * 4. A different entry ID (self-updates are excluded)
 * 5. Overlapping effective date ranges
 */
export function findPriceConflict(
  candidate: PriceConflictCandidate,
  existingEntries: Array<PriceEntry | PriceConflictCandidate>,
  options: ConflictCheckOptions = {}
): PriceConflictResult {
  if (!isDateOrderValid(candidate.validFrom, candidate.validUntil)) {
    return {
      hasConflict: true,
      reason: `Tanggal akhir (${candidate.validUntil}) tidak boleh mendahului tanggal mulai (${candidate.validFrom}).`,
    };
  }

  const candidateCity = normalizeCity(candidate.city);

  for (const existing of existingEntries) {
    // Skip self when updating an existing entry
    if (candidate.id && existing.id && candidate.id === existing.id) {
      continue;
    }

    // Optional filter by publication status
    if (options.publishedOnly && existing.isPublished === false) {
      continue;
    }

    // Must match the same variant
    if (candidate.variantId !== existing.variantId) {
      continue;
    }

    // Must match the same price type
    if (candidate.priceType !== existing.priceType) {
      continue;
    }

    // Must match the same city scope
    if (candidateCity !== normalizeCity(existing.city)) {
      continue;
    }

    // Check for date range overlap
    const overlaps = doDateRangesOverlap(
      { validFrom: candidate.validFrom, validUntil: candidate.validUntil },
      { validFrom: existing.validFrom, validUntil: existing.validUntil }
    );

    if (overlaps) {
      const existingPeriod = `${existing.validFrom} s/d ${existing.validUntil || 'seterusnya'}`;
      const candidatePeriod = `${candidate.validFrom} s/d ${candidate.validUntil || 'seterusnya'}`;
      const cityLabel = candidate.city ? ` untuk wilayah ${candidate.city}` : '';

      return {
        hasConflict: true,
        conflictingEntry: existing,
        reason: `Konflik periode harga: Rentang tanggal (${candidatePeriod}) bertabrakan dengan periode harga ${existing.priceType.toUpperCase()} yang sudah ada (${existingPeriod})${cityLabel}.`,
      };
    }
  }

  return {
    hasConflict: false,
  };
}

/**
 * Generates the parameters for PostgreSQL concurrency protection.
 * In Supabase server actions, concurrency-safe writes should:
 * 1. Acquire a row-level lock on the parent motorcycle_variants row (SELECT id FROM motorcycle_variants WHERE id = $id FOR UPDATE).
 * 2. Query existing price entries for (variant_id, city, price_type).
 * 3. Execute findPriceConflict().
 * 4. Insert or update the price entry within the transaction.
 */
export function buildConflictQueryFilters(candidate: PriceConflictCandidate) {
  return {
    variant_id: candidate.variantId,
    price_type: candidate.priceType,
    city: candidate.city || null,
  };
}
