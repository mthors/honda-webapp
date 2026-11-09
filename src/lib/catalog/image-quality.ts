/**
 * Minimum image file size threshold for homepage hero imagery.
 * 100 KB = 100 * 1024 = 102,400 bytes.
 * Images <= 102,400 bytes are strictly ineligible for the hero.
 */
export const MIN_HERO_IMAGE_SIZE_BYTES = 100 * 1024; // 102,400 bytes

/**
 * Additional dimension safeguards for hero display quality.
 */
export const MIN_HERO_IMAGE_WIDTH = 600;
export const MIN_HERO_IMAGE_HEIGHT = 400;

export interface ImageDimension {
  width?: number;
  height?: number;
}

/**
 * Evaluates whether an image is eligible for the homepage hero based on byte size
 * and optional dimension constraints.
 *
 * Requirements:
 * - File size > 100 KB (102,400 bytes): eligible
 * - File size <= 100 KB (102,400 bytes): ineligible (excluded)
 * - Dimensions must meet minimum width/height safeguards if provided.
 */
export function isHeroImageEligibleBySize(
  sizeBytes: number | null | undefined,
  dimensions?: ImageDimension
): boolean {
  if (typeof sizeBytes !== 'number' || isNaN(sizeBytes) || sizeBytes <= 0) {
    return false;
  }

  // Strictly greater than 100 KB (102,400 bytes)
  if (sizeBytes <= MIN_HERO_IMAGE_SIZE_BYTES) {
    return false;
  }

  // Dimension safeguards
  if (dimensions?.width !== undefined && dimensions.width < MIN_HERO_IMAGE_WIDTH) {
    return false;
  }

  if (dimensions?.height !== undefined && dimensions.height < MIN_HERO_IMAGE_HEIGHT) {
    return false;
  }

  return true;
}
