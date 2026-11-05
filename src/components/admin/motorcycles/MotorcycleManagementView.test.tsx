import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MotorcycleManagementView } from './MotorcycleManagementView';
import type { AdminMotorcycleItem, AdminCategoryOption, AdminColorOption } from '@/types/motorcycle';
import * as actions from '@/lib/motorcycles/actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/motorcycles/actions', () => ({
  createMotorcycleModelAction: vi.fn(),
  updateMotorcycleModelAction: vi.fn(),
  toggleMotorcycleModelStatusAction: vi.fn(),
  deleteMotorcycleModelAction: vi.fn(),
  getMotorcycleModelDetailAction: vi.fn(),
}));

describe('MotorcycleManagementView', () => {
  const mockCategories: AdminCategoryOption[] = [
    { id: 'cat-matic-uuid', name: 'Matic', slug: 'matic' },
    { id: 'cat-sport-uuid', name: 'Sport', slug: 'sport' },
  ];

  const mockColors: AdminColorOption[] = [
    { id: 'col-black-uuid', name: 'Hitam Doff', slug: 'hitam-doff', hexCode: '#111111' },
    { id: 'col-red-uuid', name: 'Merah Glossy', slug: 'merah-glossy', hexCode: '#E60012' },
  ];

  const mockModels: AdminMotorcycleItem[] = [
    {
      id: 'model-1111-uuid',
      name: 'Honda Vario 160',
      slug: 'honda-vario-160',
      categoryId: 'cat-matic-uuid',
      categoryName: 'Matic',
      categorySlug: 'matic',
      shortDescription: 'Skutik premium berperforma tinggi',
      engineCc: 160,
      transmission: 'Otomatis',
      isFeatured: true,
      isNew: false,
      status: 'published',
      publishedAt: '2026-11-01T00:00:00.000Z',
      primaryImage: {
        storagePath: 'motorcycles/vario-160/card.webp',
        altText: 'Honda Vario 160',
      },
      variantCount: 2,
      imageCount: 3,
      startingPriceIdr: 27000000,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'model-2222-uuid',
      name: 'Honda CBR150R',
      slug: 'honda-cbr150r',
      categoryId: 'cat-sport-uuid',
      categoryName: 'Sport',
      categorySlug: 'sport',
      shortDescription: 'Motor sport full fairing',
      engineCc: 150,
      transmission: 'Manual 6-Speed',
      isFeatured: false,
      isNew: true,
      status: 'draft',
      publishedAt: null,
      primaryImage: null,
      variantCount: 1,
      imageCount: 2,
      startingPriceIdr: 38000000,
      createdAt: '2026-11-02T00:00:00.000Z',
      updatedAt: '2026-11-02T00:00:00.000Z',
    },
    {
      id: 'model-3333-uuid',
      name: 'Honda Supra X 125 Lama',
      slug: 'honda-supra-x-125-lama',
      categoryId: 'cat-matic-uuid',
      categoryName: 'Matic',
      categorySlug: 'matic',
      shortDescription: 'Model lawas diarsipkan',
      engineCc: 125,
      transmission: 'Manual',
      isFeatured: false,
      isNew: false,
      status: 'archived',
      publishedAt: null,
      primaryImage: null,
      variantCount: 1,
      imageCount: 0,
      startingPriceIdr: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, statistics chips, and motorcycle catalog table', () => {
    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    // Title and subtitle
    expect(screen.getByText('Pengelolaan Katalog Sepeda Motor')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Manajemen model motor, varian tipe, pilihan warna, dan galeri visual showroom.'
      )
    ).toBeInTheDocument();

    // Table rows
    expect(screen.getByText('Honda Vario 160')).toBeInTheDocument();
    expect(screen.getByText('honda-vario-160')).toBeInTheDocument();
    expect(screen.getByText('Honda CBR150R')).toBeInTheDocument();
    expect(screen.getByText('honda-cbr150r')).toBeInTheDocument();
    expect(screen.getByText('Honda Supra X 125 Lama')).toBeInTheDocument();

    // Status chips and badges
    expect(screen.getAllByText('Tayang').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Draf').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diarsipkan').length).toBeGreaterThan(0);
    expect(screen.getByText('Unggulan')).toBeInTheDocument();
    expect(screen.getByText('Baru')).toBeInTheDocument();
  });

  it('renders empty state when no models exist in catalog', () => {
    render(
      <MotorcycleManagementView
        initialModels={[]}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    expect(screen.getByText('Belum Ada Model Motor')).toBeInTheDocument();
  });

  it('filters model list dynamically by search text (name and slug)', () => {
    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    const searchInput = screen.getByPlaceholderText('Cari nama model atau slug...');
    fireEvent.change(searchInput, { target: { value: 'cbr' } });

    expect(screen.getByText('Honda CBR150R')).toBeInTheDocument();
    expect(screen.queryByText('Honda Vario 160')).not.toBeInTheDocument();
    expect(screen.queryByText('Honda Supra X 125 Lama')).not.toBeInTheDocument();
  });

  it('filters model list dynamically by category', () => {
    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    const categorySelect = screen.getByLabelText('Filter kategori motor');
    fireEvent.change(categorySelect, { target: { value: 'cat-sport-uuid' } });

    expect(screen.getByText('Honda CBR150R')).toBeInTheDocument();
    expect(screen.queryByText('Honda Vario 160')).not.toBeInTheDocument();
  });

  it('filters model list dynamically by publication status', () => {
    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    const statusSelect = screen.getByLabelText('Filter status motor');
    fireEvent.change(statusSelect, { target: { value: 'archived' } });

    expect(screen.getByText('Honda Supra X 125 Lama')).toBeInTheDocument();
    expect(screen.queryByText('Honda Vario 160')).not.toBeInTheDocument();
    expect(screen.queryByText('Honda CBR150R')).not.toBeInTheDocument();
  });

  it('opens create modal when "Tambah Motor Baru" is clicked and can close it', () => {
    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    const addButton = screen.getByRole('button', { name: /Tambah Motor Baru/i });
    fireEvent.click(addButton);

    // Modal appears
    expect(screen.getByText('Tambah Model Motor Baru')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nama Model Motor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug URL/i)).toBeInTheDocument();

    // Close button via aria-label
    const closeButton = screen.getByRole('button', { name: /Tutup formulir/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Tambah Model Motor Baru')).not.toBeInTheDocument();
  });

  it('opens delete confirmation modal with cancel button and blocked dependency handling', async () => {
    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    // Click delete on first row (Vario 160)
    const deleteButtons = screen.getAllByRole('button', { name: /^Hapus$/i });
    fireEvent.click(deleteButtons[0]);

    // Delete confirmation dialog
    expect(screen.getByText('Konfirmasi Penghapusan Model Motor')).toBeInTheDocument();
    expect(
      screen.getByText(/Apakah Anda yakin ingin menghapus model motor ini secara permanen/i)
    ).toBeInTheDocument();

    // Simulate clicking delete confirmation and receiving blocked response
    vi.mocked(actions.deleteMotorcycleModelAction).mockResolvedValueOnce({
      success: false,
      error: 'Model ini tercatat dalam 3 inquiry prospek.',
      data: { id: 'model-1111-uuid', blocked: true, reason: 'leads_exist' },
    });

    const confirmButton = screen.getByRole('button', { name: /Tetap Hapus Permanen/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Penghapusan Diblokir')).toBeInTheDocument();
      expect(screen.getByText('Model ini tercatat dalam 3 inquiry prospek.')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Arsipkan Saja \(Disarankan\)/i })
      ).toBeInTheDocument();
    });

    // Cancel / dismiss
    const cancelButton = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Konfirmasi Penghapusan Model Motor')).not.toBeInTheDocument();
  });

  it('triggers toggleMotorcycleModelStatusAction when quick status action is clicked', async () => {
    vi.mocked(actions.toggleMotorcycleModelStatusAction).mockResolvedValueOnce({
      success: true,
      data: { id: 'model-1111-uuid', status: 'draft' },
    });

    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    // Find the button that unpublishes Vario (published) to Draft: "Jadikan Draf"
    const draftButton = screen.getByRole('button', { name: /Jadikan Draf/i });
    fireEvent.click(draftButton);

    await waitFor(() => {
      expect(actions.toggleMotorcycleModelStatusAction).toHaveBeenCalledWith(
        'model-1111-uuid',
        'draft'
      );
    });
  });

  it('loads model detail and opens edit modal via getMotorcycleModelDetailAction', async () => {
    vi.mocked(actions.getMotorcycleModelDetailAction).mockResolvedValueOnce({
      success: true,
      data: {
        ...mockModels[0],
        description: 'Deskripsi lengkap',
        seoTitle: null,
        seoDescription: null,
        variants: [],
        images: [],
      },
    });

    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^Ubah$/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(actions.getMotorcycleModelDetailAction).toHaveBeenCalledWith('model-1111-uuid');
      expect(screen.getByText('Ubah Data Model Motor')).toBeInTheDocument();
    });
  });

  it('updates displayed list immediately when initialModels prop updates following mutation', () => {
    const { rerender } = render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    expect(screen.queryByText('Honda PCX 160 Baru')).not.toBeInTheDocument();

    const updatedModels: AdminMotorcycleItem[] = [
      ...mockModels,
      {
        id: 'model-4444-uuid',
        name: 'Honda PCX 160 Baru',
        slug: 'honda-pcx-160-baru',
        categoryId: 'cat-matic-uuid',
        categoryName: 'Matic',
        categorySlug: 'matic',
        shortDescription: 'Skutik mewah',
        engineCc: 160,
        transmission: 'Otomatis',
        isFeatured: true,
        isNew: true,
        status: 'published',
        publishedAt: '2026-11-05T00:00:00.000Z',
        primaryImage: null,
        variantCount: 1,
        imageCount: 1,
        startingPriceIdr: 32000000,
        createdAt: '2026-11-05T00:00:00.000Z',
        updatedAt: '2026-11-05T00:00:00.000Z',
      },
    ];

    // Rerender simulating Server Component returning refreshed initialModels
    rerender(
      <MotorcycleManagementView
        initialModels={updatedModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    expect(screen.getByText('Honda PCX 160 Baru')).toBeInTheDocument();
    expect(screen.getByText('honda-pcx-160-baru')).toBeInTheDocument();
  });

  it('keeps create modal open and displays error banner when creation fails', async () => {
    vi.mocked(actions.createMotorcycleModelAction).mockResolvedValueOnce({
      success: false,
      error: 'Slug URL sudah digunakan oleh model lain.',
      fieldErrors: { slug: ['Slug sudah terdaftar.'] },
    });

    render(
      <MotorcycleManagementView
        initialModels={mockModels}
        categories={mockCategories}
        colors={mockColors}
      />
    );

    // Open create modal
    const addButton = screen.getByRole('button', { name: /Tambah Motor Baru/i });
    fireEvent.click(addButton);

    // Fill minimal valid fields
    fireEvent.change(screen.getByLabelText(/Nama Model Motor/i), {
      target: { value: 'Honda Vario Duplikat' },
    });
    fireEvent.change(screen.getByLabelText(/Kategori Motor \*/i), {
      target: { value: 'cat-matic-uuid' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Buat Model Motor/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Modal remains open and shows error
      expect(screen.getByText('Tambah Model Motor Baru')).toBeInTheDocument();
      expect(
        screen.getByText('Slug URL sudah digunakan oleh model lain.')
      ).toBeInTheDocument();
    });
  });
});
