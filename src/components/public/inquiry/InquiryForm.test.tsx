import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { InquiryForm } from './InquiryForm';
import * as inquiryActions from '@/lib/inquiries/actions';
import type { InquiryModelOption } from '@/types/inquiries';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('@/lib/inquiries/actions', () => ({
  submitInquiryAction: vi.fn(),
}));

describe('InquiryForm Component', () => {
  const mockModelOptions: InquiryModelOption[] = [
    {
      id: 'm-1',
      name: 'All New Honda Vario 160',
      slug: 'vario-160',
      variants: [
        {
          id: 'v-1',
          name: 'CBS',
          code: 'VARIO-CBS',
          priceIdr: 27350000,
          colors: [
            { id: 'c-1', name: 'Grande Matte Black', hexCode: '#1A1A1A' },
            { id: 'c-2', name: 'Grande Matte White', hexCode: '#FFFFFF' },
          ],
        },
        {
          id: 'v-2',
          name: 'ABS',
          code: 'VARIO-ABS',
          priceIdr: 30150000,
          colors: [{ id: 'c-3', name: 'Grande Matte Blue', hexCode: '#002B49' }],
        },
      ],
    },
    {
      id: 'm-2',
      name: 'Honda Beat Street',
      slug: 'beat-street',
      variants: [
        {
          id: 'v-3',
          name: 'Street Standard',
          code: 'BEAT-STREET',
          priceIdr: 19500000,
          colors: [{ id: 'c-4', name: 'Street Black', hexCode: '#000000' }],
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );
  });

  it('renders required input fields in natural Bahasa Indonesia', () => {
    render(<InquiryForm modelOptions={mockModelOptions} />);

    expect(screen.getByLabelText(/Nama Lengkap/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nomor WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kota \/ Kabupaten Domisili/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pesan Tambahan/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kirim Pertanyaan/i })).toBeInTheDocument();
  });

  it('prepopulates model, variant, and color from URL search parameters', () => {
    const searchParams = new URLSearchParams({
      model: 'vario-160',
      variant: 'CBS',
      color: 'Grande Matte Black',
    });
    vi.mocked(useSearchParams).mockReturnValue(
      searchParams as unknown as ReturnType<typeof useSearchParams>
    );

    render(<InquiryForm modelOptions={mockModelOptions} />);

    const modelSelect = screen.getByLabelText(/Model Motor Pilihan/i) as HTMLSelectElement;
    expect(modelSelect.value).toBe('m-1');

    const variantSelect = screen.getByLabelText(/Varian \/ Tipe/i) as HTMLSelectElement;
    expect(variantSelect.value).toBe('v-1');

    const colorSelect = screen.getByLabelText(/Warna Pilihan/i) as HTMLSelectElement;
    expect(colorSelect.value).toBe('c-1');
  });

  it('displays validation feedback when required fields are missing on client submission', async () => {
    render(<InquiryForm modelOptions={mockModelOptions} />);

    const submitBtn = screen.getByRole('button', { name: /Kirim Pertanyaan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Nama lengkap minimal 2 karakter.')).toBeInTheDocument();
      expect(screen.getByText(/Nomor WhatsApp tidak valid/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Persetujuan kebijakan privasi wajib dicentang/i)
      ).toBeInTheDocument();
    });

    expect(inquiryActions.submitInquiryAction).not.toHaveBeenCalled();
  });

  it('submits valid inquiry and transitions into success confirmation state with WhatsApp handoff', async () => {
    vi.mocked(inquiryActions.submitInquiryAction).mockResolvedValue({
      success: true,
      leadReference: 'INQ-20261103-9A8B',
    });

    render(<InquiryForm modelOptions={mockModelOptions} dealerWhatsApp="6281234567890" />);

    // Fill in valid details
    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/i), {
      target: { value: '081234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Kota \/ Kabupaten Domisili/i), {
      target: { value: 'Sidoarjo' },
    });

    // Select Model & Variant
    fireEvent.change(screen.getByLabelText(/Model Motor Pilihan/i), {
      target: { value: 'm-1' },
    });
    fireEvent.change(screen.getByLabelText(/Varian \/ Tipe/i), {
      target: { value: 'v-1' },
    });
    fireEvent.change(screen.getByLabelText(/Warna Pilihan/i), {
      target: { value: 'c-1' },
    });

    // Check Privacy Consent
    fireEvent.click(screen.getByRole('checkbox'));

    // Submit Form
    const submitBtn = screen.getByRole('button', { name: /Kirim Pertanyaan/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(inquiryActions.submitInquiryAction).toHaveBeenCalledTimes(1);
    });

    // Verify Success Screen
    await waitFor(() => {
      expect(screen.getByText(/Pertanyaan Anda Berhasil Terkirim/i)).toBeInTheDocument();
      expect(screen.getByText('INQ-20261103-9A8B')).toBeInTheDocument();
      expect(screen.getByText(/Lanjutkan Obrolan via WhatsApp/i)).toBeInTheDocument();
    });

    // Check WhatsApp handoff button link
    const waLink = screen.getByRole('link', {
      name: /Lanjutkan Obrolan via WhatsApp/i,
    });
    expect(waLink).toHaveAttribute('href');
    expect(waLink.getAttribute('href')).toContain('wa.me/6281234567890');
    expect(waLink.getAttribute('href')).toContain('INQ-20261103-9A8B');
  });

  it('displays server error gracefully without breaking UI', async () => {
    vi.mocked(inquiryActions.submitInquiryAction).mockResolvedValue({
      success: false,
      error: 'Terjadi kendala sistem saat menyimpan data pertanyaan Anda.',
    });

    render(<InquiryForm modelOptions={mockModelOptions} />);

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/i), {
      target: { value: '081234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Kota \/ Kabupaten Domisili/i), {
      target: { value: 'Sidoarjo' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /Kirim Pertanyaan/i }));

    await waitFor(() => {
      expect(screen.getByText(/Terjadi kendala sistem saat menyimpan data/i)).toBeInTheDocument();
    });
  });

  it('renders configured privacy notice when prop is supplied', () => {
    const customNotice = 'Pemberitahuan privasi resmi grup dealer untuk verifikasi pelanggan.';
    render(<InquiryForm modelOptions={mockModelOptions} privacyNotice={customNotice} />);

    expect(screen.getByText(/Baca Ringkasan Kebijakan Privasi & Ketentuan/i)).toBeInTheDocument();
    expect(screen.getByText(customNotice)).toBeInTheDocument();
  });

  it('accepts phone formatted with parentheses, hyphens, and dots without client validation error', async () => {
    vi.mocked(inquiryActions.submitInquiryAction).mockResolvedValue({
      success: true,
      leadReference: 'INQ-PHONE-TEST',
    });

    render(<InquiryForm modelOptions={mockModelOptions} />);

    fireEvent.change(screen.getByLabelText(/Nama Lengkap/i), {
      target: { value: 'Budi Santoso' },
    });
    fireEvent.change(screen.getByLabelText(/Nomor WhatsApp/i), {
      target: { value: '(0812) 3456-7890' },
    });
    fireEvent.change(screen.getByLabelText(/Kota \/ Kabupaten Domisili/i), {
      target: { value: 'Sidoarjo' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /Kirim Pertanyaan/i }));

    await waitFor(() => {
      expect(inquiryActions.submitInquiryAction).toHaveBeenCalledTimes(1);
    });
  });

  it('enforces maxLength on message textarea to prevent excessive input', () => {
    render(<InquiryForm modelOptions={mockModelOptions} />);
    const textarea = screen.getByLabelText(/Pesan Tambahan/i);
    expect(textarea).toHaveAttribute('maxLength', '1000');
  });
});
