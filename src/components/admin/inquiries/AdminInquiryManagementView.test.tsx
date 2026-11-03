import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminInquiryManagementView } from './AdminInquiryManagementView';
import type { AdminLeadItem } from '@/types/inquiries';

describe('AdminInquiryManagementView Component', () => {
  const mockLeads: AdminLeadItem[] = [
    {
      id: 'lead-1',
      leadReference: 'INQ-20261103-A1B2',
      fullName: 'Ahmad Faiz',
      whatsappNumber: '081234567890',
      email: 'faiz@example.com',
      city: 'Sidoarjo',
      district: 'Waru',
      modelId: 'm-1',
      variantId: 'v-1',
      colorId: 'c-1',
      modelNameSnapshot: 'All New Honda Vario 160',
      variantNameSnapshot: 'CBS',
      colorNameSnapshot: 'Grande Matte Black',
      priceSnapshotIdr: 27350000,
      message: 'Apakah ada promo DP ringan?',
      sourcePage: '/motor/vario-160',
      sourceCampaign: null,
      consentPrivacyAt: '2026-11-03T10:00:00Z',
      status: 'new',
      createdAt: '2026-11-03T10:00:00Z',
      updatedAt: '2026-11-03T10:00:00Z',
    },
    {
      id: 'lead-2',
      leadReference: 'INQ-20261103-C3D4',
      fullName: 'Rina Wijaya',
      whatsappNumber: '085712345678',
      email: null,
      city: 'Surabaya',
      district: 'Rungkut',
      modelId: 'm-2',
      variantId: 'v-2',
      colorId: 'c-2',
      modelNameSnapshot: 'Honda Beat Street',
      variantNameSnapshot: 'Street',
      colorNameSnapshot: 'Street Black',
      priceSnapshotIdr: 19500000,
      message: null,
      sourcePage: '/hubungi',
      sourceCampaign: null,
      consentPrivacyAt: '2026-11-03T11:00:00Z',
      status: 'contacted',
      createdAt: '2026-11-03T11:00:00Z',
      updatedAt: '2026-11-03T11:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the inquiry management page header, badge counts, and table rows', () => {
    render(<AdminInquiryManagementView initialLeads={mockLeads} />);

    expect(screen.getByText('Pengelolaan Inquiry Prospek')).toBeInTheDocument();
    expect(screen.getByText(/1 Inquiry Baru/i)).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText('No. Referensi')).toBeInTheDocument();
    expect(screen.getByText('Pelanggan & Kontak')).toBeInTheDocument();
    expect(screen.getByText('Domisili')).toBeInTheDocument();
    expect(screen.getByText('Motor Diminati')).toBeInTheDocument();

    // Check both records in table
    expect(screen.getByText('INQ-20261103-A1B2')).toBeInTheDocument();
    expect(screen.getByText('Ahmad Faiz')).toBeInTheDocument();
    expect(screen.getByText('INQ-20261103-C3D4')).toBeInTheDocument();
    expect(screen.getByText('Rina Wijaya')).toBeInTheDocument();
  });

  it('filters inquiries by search query across name, phone, reference, and model', () => {
    render(<AdminInquiryManagementView initialLeads={mockLeads} />);

    const searchInput = screen.getByPlaceholderText(/Cari nama, WhatsApp, referensi, atau kota/i);

    // Search for "Ahmad"
    fireEvent.change(searchInput, { target: { value: 'Ahmad' } });
    expect(screen.getByText('INQ-20261103-A1B2')).toBeInTheDocument();
    expect(screen.queryByText('INQ-20261103-C3D4')).not.toBeInTheDocument();

    // Search for "Beat"
    fireEvent.change(searchInput, { target: { value: 'Beat' } });
    expect(screen.queryByText('INQ-20261103-A1B2')).not.toBeInTheDocument();
    expect(screen.getByText('INQ-20261103-C3D4')).toBeInTheDocument();
  });

  it('filters inquiries by status dropdown', () => {
    render(<AdminInquiryManagementView initialLeads={mockLeads} />);

    const statusSelect = screen.getByDisplayValue('Semua Status');

    // Filter by "Baru" (new)
    fireEvent.change(statusSelect, { target: { value: 'new' } });
    expect(screen.getByText('INQ-20261103-A1B2')).toBeInTheDocument();
    expect(screen.queryByText('INQ-20261103-C3D4')).not.toBeInTheDocument();

    // Filter by "Dihubungi" (contacted)
    fireEvent.change(statusSelect, { target: { value: 'contacted' } });
    expect(screen.queryByText('INQ-20261103-A1B2')).not.toBeInTheDocument();
    expect(screen.getByText('INQ-20261103-C3D4')).toBeInTheDocument();
  });

  it('opens detailed view modal when "Lihat Detail" is clicked and closes on dismiss', () => {
    render(<AdminInquiryManagementView initialLeads={mockLeads} />);

    const detailButtons = screen.getAllByRole('button', { name: /Lihat Detail/i });
    fireEvent.click(detailButtons[0]);

    // Check modal contents
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Detail Inquiry Prospek')).toBeInTheDocument();
    expect(screen.getByText('Apakah ada promo DP ringan?')).toBeInTheDocument();
    expect(screen.getByText('Persetujuan Privasi & Atribusi')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Hubungi Pelanggan via WhatsApp/i })
    ).toBeInTheDocument();

    // Close Modal
    const closeBtn = screen.getByRole('button', { name: 'Tutup Detail' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('provides the genuine Excel (.xlsx) export button', () => {
    render(<AdminInquiryManagementView initialLeads={mockLeads} />);

    const exportBtn = screen.getByRole('button', { name: /Unduh Excel \(\.xlsx\)/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).not.toBeDisabled();
  });
});
