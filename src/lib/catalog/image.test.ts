import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStorageImageUrl } from './image';

describe('getStorageImageUrl Helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vnnceqvppickvkwxgxua.supabase.co';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default fallback when storagePath is null, undefined, or empty', () => {
    expect(getStorageImageUrl(null)).toBe('/images/motorcycle-placeholder.svg');
    expect(getStorageImageUrl(undefined)).toBe('/images/motorcycle-placeholder.svg');
    expect(getStorageImageUrl('')).toBe('/images/motorcycle-placeholder.svg');
    expect(getStorageImageUrl('   ')).toBe('/images/motorcycle-placeholder.svg');
    expect(getStorageImageUrl(null, '/custom-fallback.png')).toBe('/custom-fallback.png');
  });

  it('preserves full http/https URLs and root-relative paths as-is', () => {
    expect(getStorageImageUrl('https://cdn.example.com/bike.jpg')).toBe(
      'https://cdn.example.com/bike.jpg'
    );
    expect(getStorageImageUrl('http://example.com/bike.jpg')).toBe('http://example.com/bike.jpg');
    expect(getStorageImageUrl('/images/motorcycle-placeholder.svg')).toBe(
      '/images/motorcycle-placeholder.svg'
    );
  });

  it('constructs public Supabase storage URL targeting motorcycles bucket by default', () => {
    const url = getStorageImageUrl('vario-160-cbs.webp');
    expect(url).toBe(
      'https://vnnceqvppickvkwxgxua.supabase.co/storage/v1/object/public/motorcycles/vario-160-cbs.webp'
    );
  });

  it('preserves bucket prefix when path already begins with promotions or hero-banners', () => {
    const promoUrl = getStorageImageUrl('promotions/ramadhan-deal.webp');
    expect(promoUrl).toBe(
      'https://vnnceqvppickvkwxgxua.supabase.co/storage/v1/object/public/promotions/ramadhan-deal.webp'
    );

    const bannerUrl = getStorageImageUrl('hero-banners/desktop-hero-1.webp');
    expect(bannerUrl).toBe(
      'https://vnnceqvppickvkwxgxua.supabase.co/storage/v1/object/public/hero-banners/desktop-hero-1.webp'
    );
  });

  it('supports explicit defaultBucket parameter', () => {
    const url = getStorageImageUrl('banner.webp', undefined, 'hero-banners');
    expect(url).toBe(
      'https://vnnceqvppickvkwxgxua.supabase.co/storage/v1/object/public/hero-banners/banner.webp'
    );
  });

  it('returns fallback if NEXT_PUBLIC_SUPABASE_URL is missing and path is relative', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(getStorageImageUrl('vario.png')).toBe('/images/motorcycle-placeholder.svg');
  });
});
