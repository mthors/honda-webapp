/**
 * Helper to resolve media storage paths to URLs.
 * Handles full URLs, local paths, and Supabase public storage paths.
 */
export function getStorageImageUrl(
  storagePath: string | null | undefined,
  fallback: string = '/images/motorcycle-placeholder.svg'
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
    // Construct public Supabase storage URL for motorcycles bucket
    const cleanUrl = supabaseUrl.replace(/\/+$/, '');
    const cleanPath = storagePath.replace(/^\/+/, '');
    return `${cleanUrl}/storage/v1/object/public/motorcycles/${cleanPath}`;
  }

  return fallback;
}
