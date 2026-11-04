import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import {
  generateInquiryExcelWorkbook,
  getIndonesianLeadStatusLabel,
  formatExportDateTime,
  sanitizeExcelText,
} from './export';
import type { AdminLeadItem } from '@/types/inquiries';

describe('Excel (.xlsx) Inquiry Export Generator', () => {
  const sampleLeads: AdminLeadItem[] = [
    {
      id: 'lead-1',
      leadReference: 'INQ-20261103-A1B2',
      fullName: 'Ahmad Dahlan',
      whatsappNumber: '6281234567890',
      email: 'ahmad@example.com',
      city: 'Sidoarjo',
      district: 'Gedangan',
      modelId: 'm-1',
      variantId: 'v-1',
      colorId: 'c-1',
      modelNameSnapshot: 'All New Honda Vario 160',
      variantNameSnapshot: 'CBS',
      colorNameSnapshot: 'Grande Matte Black',
      priceSnapshotIdr: 27350000,
      message: 'Mohon info promo uang muka (DP).',
      sourcePage: '/motor/vario-160',
      sourceCampaign: 'promo-akhir-tahun',
      consentPrivacyAt: '2026-11-03T10:30:00Z',
      status: 'new',
      createdAt: '2026-11-03T10:30:00Z',
      updatedAt: '2026-11-03T10:30:00Z',
    },
    {
      id: 'lead-2',
      leadReference: 'INQ-20261103-C3D4',
      fullName: 'Dewi Lestari',
      whatsappNumber: '6285712345678',
      email: null,
      city: 'Surabaya',
      district: null,
      modelId: null,
      variantId: null,
      colorId: null,
      modelNameSnapshot: null,
      variantNameSnapshot: null,
      colorNameSnapshot: null,
      priceSnapshotIdr: null,
      message: null,
      sourcePage: '/hubungi',
      sourceCampaign: null,
      consentPrivacyAt: '2026-11-03T11:00:00Z',
      status: 'contacted',
      createdAt: '2026-11-03T11:00:00Z',
      updatedAt: '2026-11-03T11:15:00Z',
    },
  ];

  it('correctly maps lead status codes to Indonesian labels', () => {
    expect(getIndonesianLeadStatusLabel('new')).toBe('Baru');
    expect(getIndonesianLeadStatusLabel('contacted')).toBe('Dihubungi');
    expect(getIndonesianLeadStatusLabel('qualified')).toBe('Memenuhi Syarat');
    expect(getIndonesianLeadStatusLabel('converted')).toBe('Terkonversi');
  });

  it('formats dates into readable Indonesian time format', () => {
    const formatted = formatExportDateTime('2026-11-03T10:30:00Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('WIB');
  });

  it('generates a genuine binary .xlsx buffer with PK zip magic header', async () => {
    const buffer = await generateInquiryExcelWorkbook(sampleLeads);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify zip signature (0x50 0x4B 0x03 0x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });

  it('produces a readable Excel workbook with accurate columns and Indonesian data', async () => {
    const buffer = await generateInquiryExcelWorkbook(sampleLeads);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    const worksheet = workbook.getWorksheet('Daftar Inquiry');
    expect(worksheet).toBeDefined();

    // Verify Header Row (Row 1)
    const headerRow = worksheet!.getRow(1);
    expect(headerRow.getCell(1).value).toBe('No. Referensi');
    expect(headerRow.getCell(2).value).toBe('Tanggal Pengajuan');
    expect(headerRow.getCell(3).value).toBe('Nama Pelanggan');
    expect(headerRow.getCell(4).value).toBe('Nomor WhatsApp');
    expect(headerRow.getCell(5).value).toBe('Email');
    expect(headerRow.getCell(6).value).toBe('Kota / Kabupaten');
    expect(headerRow.getCell(8).value).toBe('Model Motor');
    expect(headerRow.getCell(15).value).toBe('Status Lead');

    // Verify Data Row 1 (Row 2)
    const row1 = worksheet!.getRow(2);
    expect(row1.getCell(1).value).toBe('INQ-20261103-A1B2');
    expect(row1.getCell(3).value).toBe('Ahmad Dahlan');
    expect(row1.getCell(4).value).toBe("'6281234567890"); // Preserved text format
    expect(row1.getCell(5).value).toBe('ahmad@example.com');
    expect(row1.getCell(6).value).toBe('Sidoarjo');
    expect(row1.getCell(7).value).toBe('Gedangan');
    expect(row1.getCell(8).value).toBe('All New Honda Vario 160');
    expect(row1.getCell(9).value).toBe('CBS');
    expect(row1.getCell(10).value).toBe('Grande Matte Black');
    expect(row1.getCell(11).value).toBe(27350000);
    expect(row1.getCell(15).value).toBe('Baru');

    // Verify Data Row 2 (Row 3 - with null fields handled gracefully)
    const row2 = worksheet!.getRow(3);
    expect(row2.getCell(1).value).toBe('INQ-20261103-C3D4');
    expect(row2.getCell(3).value).toBe('Dewi Lestari');
    expect(row2.getCell(5).value).toBe('-');
    expect(row2.getCell(7).value).toBe('-');
    expect(row2.getCell(8).value).toBe('-');
    expect(row2.getCell(15).value).toBe('Dihubungi');
  });

  describe('Formula Injection Defense (CWE-1236)', () => {
    it('neutralizes dangerous formula characters using sanitizeExcelText', () => {
      // Equals (=)
      expect(sanitizeExcelText('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeExcelText("   =cmd|' /C calc'!A0")).toBe("'   =cmd|' /C calc'!A0");

      // Plus (+)
      expect(sanitizeExcelText('+6281234567890')).toBe("'+6281234567890");

      // Minus (-)
      expect(sanitizeExcelText('-2+5')).toBe("'-2+5");
      expect(sanitizeExcelText('- Halo sales honda')).toBe("'- Halo sales honda");

      // At sign (@)
      expect(sanitizeExcelText('@HYPERLINK("https://evil.com")')).toBe(
        '\'@HYPERLINK("https://evil.com")'
      );

      // Tab, CR, LF
      expect(sanitizeExcelText('\tmalicious')).toBe("'\tmalicious");
      expect(sanitizeExcelText('\rmalicious')).toBe("'\rmalicious");
      expect(sanitizeExcelText('\nmalicious')).toBe("'\nmalicious");

      // Safe legitimate values preserved as-is
      expect(sanitizeExcelText('Ahmad Dahlan')).toBe('Ahmad Dahlan');
      expect(sanitizeExcelText('Sidoarjo')).toBe('Sidoarjo');
      expect(sanitizeExcelText('Honda Vario 160')).toBe('Honda Vario 160');

      // Standalone dash or fallback
      expect(sanitizeExcelText('-')).toBe('-');
      expect(sanitizeExcelText(null)).toBe('-');
      expect(sanitizeExcelText(undefined)).toBe('-');
      expect(sanitizeExcelText('')).toBe('-');
      expect(sanitizeExcelText('   ')).toBe('-');
    });

    it('neutralizes formula injection across all customer-controlled fields in generated workbook', async () => {
      const maliciousLeads: AdminLeadItem[] = [
        {
          id: 'lead-exploit-1',
          leadReference: '=INQ-EXPL-1',
          fullName: "=cmd|' /C calc'!A0",
          whatsappNumber: '+6281234567890',
          email: '-attacker@evil.com',
          city: '@Surabaya',
          district: '+Gedangan',
          modelId: 'm-1',
          variantId: 'v-1',
          colorId: 'c-1',
          modelNameSnapshot: '=HYPERLINK("http://evil.com","Vario")',
          variantNameSnapshot: '-CBS',
          colorNameSnapshot: '+Black',
          priceSnapshotIdr: 27000000,
          message: '=1+1',
          sourcePage: '/motor/vario-160',
          sourceCampaign: null,
          consentPrivacyAt: '2026-11-04T10:00:00Z',
          status: 'new',
          createdAt: '2026-11-04T10:00:00Z',
          updatedAt: '2026-11-04T10:00:00Z',
        },
      ];

      const buffer = await generateInquiryExcelWorkbook(maliciousLeads);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

      const worksheet = workbook.getWorksheet('Daftar Inquiry');
      expect(worksheet).toBeDefined();

      const dataRow = worksheet!.getRow(2);

      // Verify every customer-controlled cell value is prefixed with single quote
      // and cell value is a plain string
      const refCell = dataRow.getCell(1);
      expect(refCell.value).toBe("'=INQ-EXPL-1");
      expect(typeof refCell.value).toBe('string');

      const nameCell = dataRow.getCell(3);
      expect(nameCell.value).toBe("'=cmd|' /C calc'!A0");
      expect(typeof nameCell.value).toBe('string');

      const phoneCell = dataRow.getCell(4);
      expect(phoneCell.value).toBe("'+6281234567890");
      expect(typeof phoneCell.value).toBe('string');

      const emailCell = dataRow.getCell(5);
      expect(emailCell.value).toBe("'-attacker@evil.com");
      expect(typeof emailCell.value).toBe('string');

      const cityCell = dataRow.getCell(6);
      expect(cityCell.value).toBe("'@Surabaya");
      expect(typeof cityCell.value).toBe('string');

      const districtCell = dataRow.getCell(7);
      expect(districtCell.value).toBe("'+Gedangan");
      expect(typeof districtCell.value).toBe('string');

      const modelCell = dataRow.getCell(8);
      expect(modelCell.value).toBe('\'=HYPERLINK("http://evil.com","Vario")');
      expect(typeof modelCell.value).toBe('string');

      const variantCell = dataRow.getCell(9);
      expect(variantCell.value).toBe("'-CBS");
      expect(typeof variantCell.value).toBe('string');

      const colorCell = dataRow.getCell(10);
      expect(colorCell.value).toBe("'+Black");
      expect(typeof colorCell.value).toBe('string');

      const msgCell = dataRow.getCell(12);
      expect(msgCell.value).toBe("'=1+1");
      expect(typeof msgCell.value).toBe('string');
    });
  });
});
