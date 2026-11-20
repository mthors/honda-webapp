import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocationDealershipDiscovery } from './LocationDealershipDiscovery';
import * as useUserLocationModule from '@/lib/sales/useUserLocation';
import * as salesActions from '@/lib/sales/actions';
import type { ProvinceItem, RegencyItem } from '@/types/sales';
import type { DealershipItem } from '@/types/dealership';

vi.mock('@/lib/sales/useUserLocation', () => ({
  useUserLocation: vi.fn(),
}));

vi.mock('@/lib/sales/actions', () => ({
  discoverDealershipsByRegencyAction: vi.fn(),
}));

describe('LocationDealershipDiscovery Component', () => {
  const mockProvinces: ProvinceItem[] = [
    {
      id: 'jawa-timur',
      name: 'Jawa Timur',
      sortOrder: 1,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockRegencies: RegencyItem[] = [
    {
      id: 'kab-sidoarjo',
      provinceId: 'jawa-timur',
      name: 'Sidoarjo',
      type: 'kabupaten',
      sortOrder: 1,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'kab-pacitan',
      provinceId: 'jawa-timur',
      name: 'Pacitan',
      type: 'kabupaten',
      sortOrder: 2,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockDealerships: DealershipItem[] = [
    {
      id: 'd-1',
      name: 'Honda Satrya — Sidoarjo Sentral',
      code: 'satrya-sidoarjo',
      city: 'Sidoarjo',
      address: 'Jl. Raya Sidoarjo No. 12',
      phone: '031-8941234',
      whatsappNumber: '081234567890',
      openingHours: 'Senin - Sabtu: 08:00 - 16:30',
      isSynthetic: false,
      isActive: true,
      sortOrder: 1,
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders LocationSelector when no location has been selected in session', () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(
      <LocationDealershipDiscovery
        provinces={mockProvinces}
        regencies={mockRegencies}
        allDealerships={mockDealerships}
      />
    );

    expect(screen.getByText(/Temukan Dealer Honda Terdekat/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Provinsi Domisili/i)).toBeInTheDocument();
  });

  it('renders persistent active location bar and discovers matching dealerships', async () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: {
        provinceId: 'jawa-timur',
        provinceName: 'Jawa Timur',
        regencyId: 'kab-sidoarjo',
        regencyName: 'Sidoarjo (Kabupaten)',
        lastActivityAt: Date.now(),
      },
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    vi.mocked(salesActions.discoverDealershipsByRegencyAction).mockResolvedValue({
      success: true,
      data: mockDealerships,
    });

    render(
      <LocationDealershipDiscovery
        provinces={mockProvinces}
        regencies={mockRegencies}
        allDealerships={mockDealerships}
      />
    );

    // Verify Persistent Bar
    expect(screen.getByText(/Lokasi Anda:/i)).toBeInTheDocument();
    expect(screen.getByText(/Sidoarjo \(Kabupaten\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ubah Lokasi/i })).toBeInTheDocument();

    // Verify Discovered Dealership Card
    await waitFor(() => {
      expect(screen.getByText('Honda Satrya — Sidoarjo Sentral')).toBeInTheDocument();
    });

    expect(screen.getByText('Jl. Raya Sidoarjo No. 12')).toBeInTheDocument();
    expect(screen.getByText(/Tel: 031-8941234/i)).toBeInTheDocument();
    expect(screen.getByText(/WA: \+6281234567890/i)).toBeInTheDocument();

    // Verify WhatsApp link has normalized number and pre-filled message
    const waLink = screen.getByRole('link', { name: /Chat Cabang via WhatsApp/i });
    expect(waLink).toHaveAttribute('href', expect.stringContaining('https://wa.me/6281234567890'));
    expect(waLink).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('Sidoarjo (Kabupaten)'))
    );
  });

  it('renders empty state when no dealerships serve the selected regency', async () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: {
        provinceId: 'jawa-timur',
        provinceName: 'Jawa Timur',
        regencyId: 'kab-pacitan',
        regencyName: 'Pacitan (Kabupaten)',
        lastActivityAt: Date.now(),
      },
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    vi.mocked(salesActions.discoverDealershipsByRegencyAction).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <LocationDealershipDiscovery
        provinces={mockProvinces}
        regencies={mockRegencies}
        allDealerships={mockDealerships}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Belum Ada Cabang Dealer di Wilayah Ini/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        /Saat ini belum ada cabang showroom resmi Honda Satrya yang tercatat melayani wilayah Pacitan \(Kabupaten\)/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: /Lihat Semua Lokasi Showroom \(1\)/i })
    ).toHaveAttribute('href', '#lokasi-showroom');
  });

  it('allows user to click "Ubah Lokasi" to re-open location selector', async () => {
    const mockSetLocation = vi.fn();
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: {
        provinceId: 'jawa-timur',
        provinceName: 'Jawa Timur',
        regencyId: 'kab-sidoarjo',
        regencyName: 'Sidoarjo (Kabupaten)',
        lastActivityAt: Date.now(),
      },
      isLoading: false,
      setLocation: mockSetLocation,
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    vi.mocked(salesActions.discoverDealershipsByRegencyAction).mockResolvedValue({
      success: true,
      data: mockDealerships,
    });

    render(
      <LocationDealershipDiscovery
        provinces={mockProvinces}
        regencies={mockRegencies}
        allDealerships={mockDealerships}
      />
    );

    const ubahBtn = screen.getByRole('button', { name: /Ubah Lokasi/i });
    fireEvent.click(ubahBtn);

    // Selector form is visible again
    expect(screen.getByText(/Temukan Dealer Honda Terdekat/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batal/i })).toBeInTheDocument();

    // Clicking Batal closes the selector and restores active location view
    fireEvent.click(screen.getByRole('button', { name: /Batal/i }));
    expect(screen.getByText(/Lokasi Anda:/i)).toBeInTheDocument();
  });
});
