import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LocationSelector } from './LocationSelector';
import * as geolocation from '@/lib/sales/geolocation';
import type { ProvinceItem, RegencyItem } from '@/types/sales';

vi.mock('@/lib/sales/geolocation', () => ({
  detectUserLocation: vi.fn(),
}));

describe('LocationSelector Component', () => {
  const mockProvinces: ProvinceItem[] = [
    {
      id: 'jawa-timur',
      name: 'Jawa Timur',
      sortOrder: 1,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'jawa-tengah',
      name: 'Jawa Tengah',
      sortOrder: 2,
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
      id: 'kota-surabaya',
      provinceId: 'jawa-timur',
      name: 'Surabaya',
      type: 'kota',
      sortOrder: 2,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'kab-semarang',
      provinceId: 'jawa-tengah',
      name: 'Semarang',
      type: 'kabupaten',
      sortOrder: 1,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'kab-inactive',
      provinceId: 'jawa-timur',
      name: 'Inactive Regency',
      type: 'kabupaten',
      sortOrder: 99,
      isActive: false,
      createdAt: '',
      updatedAt: '',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders province and regency selectors filtered by the selected province', () => {
    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        onSelectLocation={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Provinsi Domisili/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Kabupaten \/ Kota/i)).toBeInTheDocument();

    // Default province is Jawa Timur (first in list)
    // Sidoarjo and Surabaya should be in the options
    expect(screen.getByRole('option', { name: /Sidoarjo \(Kabupaten\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Surabaya \(Kota\)/i })).toBeInTheDocument();

    // Inactive regency and Jawa Tengah regency should not be in the dropdown
    expect(screen.queryByRole('option', { name: /Inactive Regency/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Semarang \(Kabupaten\)/i })
    ).not.toBeInTheDocument();
  });

  it('resets regency selection when province changes', () => {
    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        onSelectLocation={vi.fn()}
      />
    );

    const provinceSelect = screen.getByLabelText(/Provinsi Domisili/i);
    const regencySelect = screen.getByLabelText(/Kabupaten \/ Kota/i);

    // Select Sidoarjo first
    fireEvent.change(regencySelect, { target: { value: 'kab-sidoarjo' } });
    expect((regencySelect as HTMLSelectElement).value).toBe('kab-sidoarjo');

    // Switch province to Jawa Tengah
    fireEvent.change(provinceSelect, { target: { value: 'jawa-tengah' } });

    // Regency should be reset to empty
    expect((regencySelect as HTMLSelectElement).value).toBe('');
    // Now Semarang should be visible
    expect(screen.getByRole('option', { name: /Semarang \(Kabupaten\)/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /Sidoarjo \(Kabupaten\)/i })
    ).not.toBeInTheDocument();
  });

  it('submits manual selection and formats regency label with type', () => {
    const handleSelectLocation = vi.fn();

    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        onSelectLocation={handleSelectLocation}
      />
    );

    const regencySelect = screen.getByLabelText(/Kabupaten \/ Kota/i);
    fireEvent.change(regencySelect, { target: { value: 'kota-surabaya' } });

    const submitBtn = screen.getByRole('button', { name: /Lihat Dealer/i });
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    expect(handleSelectLocation).toHaveBeenCalledWith({
      provinceId: 'jawa-timur',
      regencyId: 'kota-surabaya',
      provinceName: 'Jawa Timur',
      regencyName: 'Surabaya (Kota)',
    });
  });

  it('handles automatic geolocation detection and user confirmation', async () => {
    const handleSelectLocation = vi.fn();

    vi.mocked(geolocation.detectUserLocation).mockResolvedValue({
      status: 'success',
      regencyId: 'kab-sidoarjo',
      regencyName: 'Sidoarjo (Kabupaten)',
      provinceId: 'jawa-timur',
      provinceName: 'Jawa Timur',
      distanceKm: 8,
    });

    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        onSelectLocation={handleSelectLocation}
      />
    );

    const detectBtn = screen.getByRole('button', { name: /Gunakan Lokasi Saya/i });
    fireEvent.click(detectBtn);

    // Confirmation dialog should appear with detected location info
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/Konfirmasi Lokasi Terdeteksi/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/Sidoarjo \(Kabupaten\)/i)).toBeInTheDocument();

    // Confirm button
    const confirmBtn = within(dialog).getByRole('button', { name: /Gunakan Lokasi Ini/i });
    fireEvent.click(confirmBtn);

    expect(handleSelectLocation).toHaveBeenCalledWith({
      provinceId: 'jawa-timur',
      regencyId: 'kab-sidoarjo',
      provinceName: 'Jawa Timur',
      regencyName: 'Sidoarjo (Kabupaten)',
    });
  });

  it('displays Indonesian error alert when geolocation permission is denied', async () => {
    vi.mocked(geolocation.detectUserLocation).mockResolvedValue({
      status: 'permission_denied',
      message: 'User denied geolocation',
    });

    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        onSelectLocation={vi.fn()}
      />
    );

    const detectBtn = screen.getByRole('button', { name: /Gunakan Lokasi Saya/i });
    fireEvent.click(detectBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Akses lokasi tidak diizinkan\. Silakan pilih provinsi dan kabupaten\/kota secara manual\./i
        )
      ).toBeInTheDocument();
    });
  });

  it('displays outside coverage error alert when location is outside East Java', async () => {
    vi.mocked(geolocation.detectUserLocation).mockResolvedValue({
      status: 'outside_coverage',
      message: 'Outside coverage',
    });

    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        onSelectLocation={vi.fn()}
      />
    );

    const detectBtn = screen.getByRole('button', { name: /Gunakan Lokasi Saya/i });
    fireEvent.click(detectBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Lokasi Anda terdeteksi di luar area layanan utama Honda Satrya Dealer Group \(Jawa Timur\)\./i
        )
      ).toBeInTheDocument();
    });
  });

  it('calls onCancel when user cancels editing existing location', () => {
    const handleCancel = vi.fn();

    render(
      <LocationSelector
        provinces={mockProvinces}
        regencies={mockRegencies}
        currentProvinceId="jawa-timur"
        currentRegencyId="kab-sidoarjo"
        onSelectLocation={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Batal/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalled();
  });
});
