/**
 * Helper to resolve media storage paths to URLs.
 * Handles full URLs, local paths, and Supabase public storage paths.
 * Supports the 3 provisioned showroom buckets: motorcycles, promotions, hero-banners.
 */
export function getStorageImageUrl(
  storagePath: string | null | undefined,
  fallback: string = '/images/motorcycle-placeholder.svg',
  defaultBucket: string = 'motorcycles'
): string {
  if (!storagePath || storagePath.trim() === '') {
    return fallback;
  }

  // Already a full or root-relative URL
  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('/')
  ) {
    return storagePath;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const cleanPath = storagePath.replace(/^\/+/, '');

    // If cleanPath is already prefixed with a known bucket, preserve it
    if (
      cleanPath.startsWith('motorcycles/') ||
      cleanPath.startsWith('promotions/') ||
      cleanPath.startsWith('hero-banners/')
    ) {
      return `${cleanUrl}/storage/v1/object/public/${cleanPath}`;
    }

    // Construct public Supabase storage URL
    return `${cleanUrl}/storage/v1/object/public/${defaultBucket}/${cleanPath}`;
  }

  return fallback;
}
