import { describe, it, expect, vi } from 'vitest';
import {
  MIN_HERO_IMAGE_SIZE_BYTES,
  MIN_HERO_IMAGE_WIDTH,
  MIN_HERO_IMAGE_HEIGHT,
  isHeroImageEligibleBySize,
} from './image-quality';
import { getStorageImageSizes } from './image-quality.server';

describe('Hero Image Quality Filter (Minimum 100 KB Threshold)', () => {
  it('confirms threshold constant is 100 KB (102,400 bytes)', () => {
    expect(MIN_HERO_IMAGE_SIZE_BYTES).toBe(102400);
  });

  it('excludes an image below 100 KB (e.g. 50 KB, 102,399 bytes)', () => {
    // 50 KB
    expect(isHeroImageEligibleBySize(50 * 1024)).toBe(false);

    // 102,399 bytes (1 byte below 100 KB)
    expect(isHeroImageEligibleBySize(102399)).toBe(false);

    // 0 or negative
    expect(isHeroImageEligibleBySize(0)).toBe(false);
    expect(isHeroImageEligibleBySize(-100)).toBe(false);
    expect(isHeroImageEligibleBySize(null)).toBe(false);
    expect(isHeroImageEligibleBySize(undefined)).toBe(false);
    expect(isHeroImageEligibleBySize(NaN)).toBe(false);
  });

  it('excludes an image exactly 100 KB (102,400 bytes)', () => {
    expect(isHeroImageEligibleBySize(102400)).toBe(false);
    expect(isHeroImageEligibleBySize(100 * 1024)).toBe(false);
  });

  it('considers an image above 100 KB eligible when dimensions are sufficient', () => {
    // 102,401 bytes (1 byte above 100 KB)
    expect(isHeroImageEligibleBySize(102401)).toBe(true);

    // 150 KB
    expect(isHeroImageEligibleBySize(150 * 1024)).toBe(true);

    // 200 KB with good dimensions
    expect(
      isHeroImageEligibleBySize(200 * 1024, { width: 1200, height: 800 })
    ).toBe(true);
  });

  it('rejects an image above 100 KB if dimensions fall below safeguard threshold', () => {
    // File size is 150 KB, but width is too small (e.g. 400 < 600)
    expect(
      isHeroImageEligibleBySize(150 * 1024, { width: 400, height: 800 })
    ).toBe(false);

    // File size is 150 KB, but height is too small (e.g. 300 < 400)
    expect(
      isHeroImageEligibleBySize(150 * 1024, { width: 800, height: 300 })
    ).toBe(false);

    // Meets exact minimum safeguards
    expect(
      isHeroImageEligibleBySize(150 * 1024, {
        width: MIN_HERO_IMAGE_WIDTH,
        height: MIN_HERO_IMAGE_HEIGHT,
      })
    ).toBe(true);
  });

  describe('getStorageImageSizes', () => {
    it('queries storage buckets and maps file sizes', async () => {
      const mockList = vi.fn().mockImplementation((bucket: string) => {
        if (bucket === 'motorcycles') {
          return Promise.resolve({
            data: [
              { name: 'pcx.webp', metadata: { size: 134368 } },
              { name: 'beat.webp', metadata: { size: 26976 } },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const mockClient = {
        storage: {
          from: (bucket: string) => ({
            list: () => mockList(bucket),
          }),
        },
      } as unknown as Parameters<typeof getStorageImageSizes>[0];

      const sizes = await getStorageImageSizes(mockClient);

      expect(sizes['pcx.webp']).toBe(134368);
      expect(sizes['motorcycles/pcx.webp']).toBe(134368);
      expect(sizes['beat.webp']).toBe(26976);
      expect(sizes['motorcycles/beat.webp']).toBe(26976);
    });

    it('returns empty object gracefully when storage fails or is unavailable', async () => {
      const mockClient = {
        storage: {
          from: () => ({
            list: () => Promise.reject(new Error('Storage unavailable')),
          }),
        },
      } as unknown as Parameters<typeof getStorageImageSizes>[0];

      const sizes = await getStorageImageSizes(mockClient);
      expect(sizes).toEqual({});
    });
  });
});
