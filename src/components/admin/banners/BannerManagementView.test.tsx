import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BannerManagementView } from './BannerManagementView';
import type { AdminHeroBannerItem } from '@/lib/admin/queries';
import * as adminActions from '@/lib/admin/actions';

const mockUpload = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
  }),
}));

vi.mock('@/lib/admin/actions', () => ({
  upsertHeroBannerAction: vi.fn(),
}));

describe('BannerManagementView (Promotional Banner CMS)', () => {
  const mockBanners: AdminHeroBannerItem[] = [
    {
      id: 'banner-1',
      title: 'Promo Spesial Awal Tahun',
      subtitle: 'Diskon DP hingga 2 juta rupiah',
      desktopImagePath: 'promo-desktop-1.webp',
      mobileImagePath: 'promo-mobile-1.webp',
      altText: 'Promo Spesial Awal Tahun Honda',
      ctaLabel: 'Lihat Promo',
      ctaUrl: '/promo/awal-tahun',
      startsAt: '2026-01-01T00:00:00Z',
      endsAt: '2026-01-31T23:59:59Z',
      sortOrder: 1,
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no promotional banners exist', () => {
    render(<BannerManagementView initialBanners={[]} />);

    expect(screen.getByText('Pengelolaan Spanduk Promosi')).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Spanduk Promosi')).toBeInTheDocument();
    expect(
      screen.getByText(/Pemisahan Materi Promosi dan Etalase Beranda/i)
    ).toBeInTheDocument();
  });

  it('renders banners list when banners are provided', () => {
    render(<BannerManagementView initialBanners={mockBanners} />);

    expect(screen.getByText('Promo Spesial Awal Tahun')).toBeInTheDocument();
    expect(screen.getByText('Diskon DP hingga 2 juta rupiah')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Dipublikasikan')).toBeInTheDocument();
  });

  it('opens creation form when clicking add new button', () => {
    render(<BannerManagementView initialBanners={[]} />);

    const addButton = screen.getByRole('button', { name: /\+ Tambah Spanduk Baru/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Tambah Spanduk Promosi Baru')).toBeInTheDocument();
    expect(screen.getByLabelText(/Judul Spanduk \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gambar Desktop Spanduk \*/i)).toBeInTheDocument();
  });

  it('validates file upload constraints (size limit > 5 MB)', async () => {
    render(<BannerManagementView initialBanners={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah Spanduk Baru/i }));

    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'giant.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    const desktopFileInput = document.querySelector('#banner-desktop-file') as HTMLInputElement;
    expect(desktopFileInput).toBeInTheDocument();

    fireEvent.change(desktopFileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Ukuran file desktop maksimal 5 MB/i)
      ).toBeInTheDocument();
    });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('validates file upload constraints (disallowed MIME type)', async () => {
    render(<BannerManagementView initialBanners={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah Spanduk Baru/i }));

    const invalidFile = new File(['dummy'], 'document.pdf', {
      type: 'application/pdf',
    });

    const desktopFileInput = document.querySelector('#banner-desktop-file') as HTMLInputElement;
    fireEvent.change(desktopFileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Format gambar harus berupa JPG, PNG, atau WebP/i)
      ).toBeInTheDocument();
    });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploads valid image to hero-banners storage bucket and updates desktopImagePath', async () => {
    mockUpload.mockResolvedValueOnce({
      data: { path: 'hero-banners/promo-test-123.webp' },
      error: null,
    });

    render(<BannerManagementView initialBanners={[]} />);

    fireEvent.click(screen.getByRole('button', { name: /\+ Tambah Spanduk Baru/i }));

    const validFile = new File(['valid content'], 'banner.webp', {
      type: 'image/webp',
    });
    Object.defineProperty(validFile, 'size', { value: 200 * 1024 });

    const desktopFileInput = document.querySelector('#banner-desktop-file') as HTMLInputElement;
    fireEvent.change(desktopFileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled();
    });

    const desktopInput = screen.getByLabelText(/Gambar Desktop Spanduk \*/i) as HTMLInputElement;
    expect(desktopInput.value).toBe('hero-banners/promo-test-123.webp');
  });

  it('allows editing an existing banner preserving images without re-upload', async () => {
    vi.mocked(adminActions.upsertHeroBannerAction).mockResolvedValueOnce({
      success: true,
      data: { id: 'banner-1' },
    });

    render(<BannerManagementView initialBanners={mockBanners} />);

    const editButton = screen.getByRole('button', { name: 'Ubah' });
    fireEvent.click(editButton);

    expect(screen.getByText('Ubah Spanduk Promosi')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Judul Spanduk \*/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Promo Spesial Awal Tahun');

    const desktopInput = screen.getByLabelText(/Gambar Desktop Spanduk \*/i) as HTMLInputElement;
    expect(desktopInput.value).toBe('promo-desktop-1.webp');

    // Update title only
    fireEvent.change(titleInput, { target: { value: 'Promo Spesial Imlek' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: 'Simpan' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(adminActions.upsertHeroBannerAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'banner-1',
          title: 'Promo Spesial Imlek',
          desktopImagePath: 'promo-desktop-1.webp',
        })
      );
    });
  });
});
