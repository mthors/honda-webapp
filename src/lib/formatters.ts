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
