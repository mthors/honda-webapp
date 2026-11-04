import ExcelJS from 'exceljs';
import type { AdminLeadItem } from '@/types/inquiries';

/**
 * Maps raw database lead status to human-readable Indonesian label.
 */
export function getIndonesianLeadStatusLabel(status: string): string {
  switch (status) {
    case 'new':
      return 'Baru';
    case 'contacted':
      return 'Dihubungi';
    case 'qualified':
      return 'Memenuhi Syarat';
    case 'follow_up':
      return 'Tindak Lanjut';
    case 'converted':
      return 'Terkonversi';
    case 'not_interested':
      return 'Tidak Tertarik';
    case 'unreachable':
      return 'Tidak Dapat Dihubungi';
    case 'duplicate':
      return 'Duplikat';
    case 'invalid':
      return 'Tidak Valid';
    default:
      return status;
  }
}

/**
 * Formats ISO timestamp to human-readable Indonesian date string.
 * Example: "03 Nov 2026, 14:30 WIB"
 */
export function formatExportDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    return (
      new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }).format(d) + ' WIB'
    );
  } catch {
    return isoString;
  }
}

/**
 * Neutralizes potential CSV/Formula injection triggers (CWE-1236) in spreadsheet text cells.
 * Prepends a single quote (') if the string begins with dangerous formula triggers:
 * '=', '+', '-', '@', horizontal tab (\t), carriage return (\r), or line feed (\n).
 * Preserves the customer's legitimate input while forcing spreadsheet software (Excel, Calc)
 * to interpret the cell strictly as literal text.
 */
export function sanitizeExcelText(val: string | null | undefined, fallback: string = '-'): string {
  if (val === null || val === undefined) {
    return fallback;
  }
  const raw = String(val);
  if (raw.length === 0) {
    return fallback;
  }
  if (raw.trim() === '-' || raw.trim().length === 0) {
    return fallback;
  }

  const trimmed = raw.trimStart();
  const firstChar = trimmed[0];
  const rawFirstChar = raw[0];

  if (
    firstChar === '=' ||
    firstChar === '+' ||
    firstChar === '-' ||
    firstChar === '@' ||
    rawFirstChar === '\t' ||
    rawFirstChar === '\r' ||
    rawFirstChar === '\n'
  ) {
    // If already prefixed with a single quote, preserve as-is
    if (raw.startsWith("'")) {
      return raw;
    }
    return `'${raw}`;
  }

  return raw;
}

/**
 * Generates a genuine Excel (.xlsx) workbook buffer for inquiry records.
 */
export async function generateInquiryExcelWorkbook(leads: AdminLeadItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Honda Satrya Dealer Group';
  workbook.lastModifiedBy = 'Administrator';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Daftar Inquiry', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Define structured columns with readable headers and appropriate widths
  worksheet.columns = [
    { header: 'No. Referensi', key: 'leadReference', width: 22 },
    { header: 'Tanggal Pengajuan', key: 'createdAt', width: 24 },
    { header: 'Nama Pelanggan', key: 'fullName', width: 26 },
    { header: 'Nomor WhatsApp', key: 'whatsappNumber', width: 20 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Kota / Kabupaten', key: 'city', width: 22 },
    { header: 'Kecamatan', key: 'district', width: 20 },
    { header: 'Model Motor', key: 'modelNameSnapshot', width: 26 },
    { header: 'Varian / Tipe', key: 'variantNameSnapshot', width: 20 },
    { header: 'Pilihan Warna', key: 'colorNameSnapshot', width: 22 },
    { header: 'Estimasi Harga OTR (Rp)', key: 'priceSnapshotIdr', width: 24 },
    { header: 'Pesan Pelanggan', key: 'message', width: 40 },
    { header: 'Halaman Sumber', key: 'sourcePage', width: 22 },
    { header: 'Persetujuan Privasi', key: 'consentPrivacyAt', width: 24 },
    { header: 'Status Lead', key: 'status', width: 18 },
  ];

  // Header row formatting (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate blue
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Populate data rows
  for (const lead of leads) {
    const cleanPhone = lead.whatsappNumber ? String(lead.whatsappNumber).trim() : '';
    const safePhone = cleanPhone
      ? cleanPhone.startsWith("'")
        ? cleanPhone
        : `'${cleanPhone}`
      : '-';

    const row = worksheet.addRow({
      leadReference: sanitizeExcelText(lead.leadReference),
      createdAt: formatExportDateTime(lead.createdAt),
      fullName: sanitizeExcelText(lead.fullName),
      // Format phone as explicit text to prevent Excel scientific notation and formula triggers
      whatsappNumber: safePhone,
      email: sanitizeExcelText(lead.email),
      city: sanitizeExcelText(lead.city),
      district: sanitizeExcelText(lead.district),
      modelNameSnapshot: sanitizeExcelText(lead.modelNameSnapshot),
      variantNameSnapshot: sanitizeExcelText(lead.variantNameSnapshot),
      colorNameSnapshot: sanitizeExcelText(lead.colorNameSnapshot),
      priceSnapshotIdr: lead.priceSnapshotIdr ?? '-',
      message: sanitizeExcelText(lead.message),
      sourcePage: sanitizeExcelText(lead.sourcePage),
      consentPrivacyAt: formatExportDateTime(lead.consentPrivacyAt),
      status: getIndonesianLeadStatusLabel(lead.status),
    });

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF111827' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 11 ? 'right' : 'left',
        wrapText: colNumber === 12, // Wrap text for message
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      // Currency number format for price column
      if (colNumber === 11 && typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
