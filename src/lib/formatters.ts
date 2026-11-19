/**
 * Indonesian Localization and Formatting Utilities
 *
 * Adheres to:
 * - id-ID locale standards
 * - Indonesian Rupiah (IDR) currency formatting
 * - Safe integer handling for financial amounts
 */

/**
 * Formats an integer Rupiah amount to standard Indonesian currency string.
 * Example: 19500000 -> "Rp 19.500.000"
 */
export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) {
    return 'Rp 0';
  }

  // Format with id-ID locale, no fractional cents
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  // Replace non-breaking space with regular space for consistent string rendering
  return formatted.replace(/\u00A0/g, ' ');
}

/**
 * Normalizes an Indonesian phone number to international WhatsApp format (e.g. 628123456789).
 */
export function normalizeIndonesianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return `62${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Formats a normalized or raw phone number into a readable Indonesian mobile number format (+62 812-3456-7890).
 */
export function formatIndonesianPhone(phone: string): string {
  const norm = normalizeIndonesianPhone(phone);
  if (norm.startsWith('62') && norm.length >= 10) {
    const rest = norm.slice(2);
    if (rest.length <= 10) {
      return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6)}`;
    }
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return phone;
}
