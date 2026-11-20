import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateHaversineDistanceKm,
  findNearestOperationalRegency,
  detectUserLocation,
} from './geolocation';

describe('Geolocation & Proximity Approximation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateHaversineDistanceKm', () => {
    it('calculates approximately 0 km between identical points', () => {
      const dist = calculateHaversineDistanceKm(-7.2575, 112.7521, -7.2575, 112.7521);
      expect(dist).toBeCloseTo(0, 1);
    });

    it('calculates distance between Surabaya and Sidoarjo (~23-28 km)', () => {
      // Surabaya: -7.2575, 112.7521
      // Sidoarjo: -7.4478, 112.7183
      const dist = calculateHaversineDistanceKm(-7.2575, 112.7521, -7.4478, 112.7183);
      expect(dist).toBeGreaterThan(20);
      expect(dist).toBeLessThan(30);
    });
  });

  describe('findNearestOperationalRegency', () => {
    it('finds Sidoarjo when coordinates are in Sidoarjo', () => {
      const { regency, distanceKm } = findNearestOperationalRegency(-7.45, 112.71);
      expect(regency.id).toBe('kab-sidoarjo');
      expect(distanceKm).toBeLessThan(5);
    });

    it('finds Surabaya when coordinates are in central Surabaya', () => {
      const { regency, distanceKm } = findNearestOperationalRegency(-7.26, 112.75);
      expect(regency.id).toBe('kota-surabaya');
      expect(distanceKm).toBeLessThan(5);
    });

    it('finds Malang when coordinates are in Malang City', () => {
      const { regency, distanceKm } = findNearestOperationalRegency(-7.98, 112.62);
      expect(regency.id).toBe('kota-malang');
      expect(distanceKm).toBeLessThan(5);
    });
  });

  describe('detectUserLocation', () => {
    const originalGeolocation = navigator.geolocation;

    afterEach(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
      });
    });

    it('returns unsupported when navigator.geolocation is not available', async () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        configurable: true,
      });

      const res = await detectUserLocation();
      expect(res.status).toBe('unsupported');
    });

    it('returns nearest regency on successful geolocation match within East Java', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: -7.4478,
              longitude: 112.7183,
              accuracy: 10,
            },
          });
        }),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const res = await detectUserLocation();
      expect(res.status).toBe('success');
      if (res.status === 'success') {
        expect(res.regencyId).toBe('kab-sidoarjo');
        expect(res.provinceId).toBe('jawa-timur');
      }
    });

    it('returns outside_coverage when coordinates are far from East Java (e.g. Jakarta)', async () => {
      // Jakarta coordinates: -6.2088, 106.8456
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: -6.2088,
              longitude: 106.8456,
              accuracy: 10,
            },
          });
        }),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const res = await detectUserLocation();
      expect(res.status).toBe('outside_coverage');
    });

    it('returns permission_denied when user blocks geolocation access', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            PERMISSION_DENIED: 1,
            message: 'User denied geolocation',
          });
        }),
      };

      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const res = await detectUserLocation();
      expect(res.status).toBe('permission_denied');
    });
  });
});
