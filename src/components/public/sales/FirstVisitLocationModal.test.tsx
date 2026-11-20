import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  FirstVisitLocationModal,
  LOCATION_MODAL_DISMISSED_KEY,
  OPEN_LOCATION_MODAL_EVENT,
} from './FirstVisitLocationModal';
import * as useUserLocationModule from '@/lib/sales/useUserLocation';
import type { ProvinceItem, RegencyItem } from '@/types/sales';

let mockCurrentPathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPathname,
}));

vi.mock('@/lib/sales/useUserLocation', () => ({
  useUserLocation: vi.fn(),
}));

describe('FirstVisitLocationModal Component', () => {
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentPathname = '/';
    window.sessionStorage.clear();
  });

  it('renders and opens on first visit when no location is saved and not dismissed', () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Pilih Wilayah Domisili Anda')).toBeInTheDocument();
    expect(screen.getByText('Lewati untuk sekarang')).toBeInTheDocument();
  });

  it('does NOT open if a valid location already exists in session', () => {
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

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does NOT open if dismissed previously in sessionStorage', () => {
    window.sessionStorage.setItem(LOCATION_MODAL_DISMISSED_KEY, 'true');

    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does NOT open automatically when user is on /hubungi page', () => {
    mockCurrentPathname = '/hubungi';

    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses modal and sets sessionStorage flag when user clicks "Lewati untuk sekarang"', () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    const dismissBtn = screen.getByText('Lewati untuk sekarang');
    fireEvent.click(dismissBtn);

    expect(window.sessionStorage.getItem(LOCATION_MODAL_DISMISSED_KEY)).toBe('true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses modal when user clicks the "×" close button', () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    const closeBtn = screen.getByLabelText('Tutup modal lokasi');
    fireEvent.click(closeBtn);

    expect(window.sessionStorage.getItem(LOCATION_MODAL_DISMISSED_KEY)).toBe('true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses modal when Escape key is pressed', () => {
    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(window.sessionStorage.getItem(LOCATION_MODAL_DISMISSED_KEY)).toBe('true');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('saves location to session and closes modal when location is selected', () => {
    const mockSetLocation = vi.fn();

    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: mockSetLocation,
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    const regencySelect = screen.getByLabelText(/Kabupaten \/ Kota/i);
    fireEvent.change(regencySelect, { target: { value: 'kab-sidoarjo' } });

    const submitBtn = screen.getByRole('button', { name: /Konfirmasi Lokasi/i });
    fireEvent.click(submitBtn);

    expect(mockSetLocation).toHaveBeenCalledWith({
      provinceId: 'jawa-timur',
      regencyId: 'kab-sidoarjo',
      provinceName: 'Jawa Timur',
      regencyName: 'Sidoarjo (Kabupaten)',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens modal when OPEN_LOCATION_MODAL_EVENT custom event is fired', async () => {
    window.sessionStorage.setItem(LOCATION_MODAL_DISMISSED_KEY, 'true');

    vi.mocked(useUserLocationModule.useUserLocation).mockReturnValue({
      location: null,
      isLoading: false,
      setLocation: vi.fn(),
      clearLocation: vi.fn(),
      touchActivity: vi.fn(),
    });

    render(<FirstVisitLocationModal provinces={mockProvinces} regencies={mockRegencies} />);

    // Initially closed because dismissed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Trigger open event
    fireEvent(window, new Event(OPEN_LOCATION_MODAL_EVENT));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
