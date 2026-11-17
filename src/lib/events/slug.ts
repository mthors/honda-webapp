/**
 * Utility for generating URL slugs from event titles.
 * Matches standard application slug conventions (lowercase, alphanumeric, single hyphens).
 */

/**
 * Generates a clean URL slug from an event title.
 * - Strips diacritics / accent marks (e.g. é -> e)
 * - Converts to lowercase
 * - Strips characters that are not lowercase alphanumeric, spaces, or hyphens
 * - Collapses consecutive spaces, underscores, and hyphens into a single hyphen
 * - Trims leading and trailing hyphens
 */
export function toEventSlug(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
