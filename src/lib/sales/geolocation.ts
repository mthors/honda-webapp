/**
 * Client-Side Geolocation & Reverse-Geocoding Approximation for East Java
 *
 * Requirements:
 * 1. Zero external network dependencies (no paid APIs, no third-party data tracking).
 * 2. 100% private: GPS coordinates never leave the customer's browser.
 * 3. Never requests permission automatically; only triggered on explicit user click.
 * 4. Resolves nearest operational regency via Haversine great-circle distance.
 * 5. Requires explicit user confirmation of the detected region before saving.
 */

export interface RegencyCoordinates {
  id: string;
  name: string;
  type: 'kabupaten' | 'kota';
  provinceId: string;
  provinceName: string;
  latitude: number;
  longitude: number;
}

/**
 * Operational Regency Reference Coordinates in Jawa Timur
 */
export const OPERATIONAL_REGENCIES_GEO: RegencyCoordinates[] = [
  {
    id: 'kab-sidoarjo',
    name: 'Sidoarjo',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.4478,
    longitude: 112.7183,
  },
  {
    id: 'kota-surabaya',
    name: 'Surabaya',
    type: 'kota',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.2575,
    longitude: 112.7521,
  },
  {
    id: 'kab-gresik',
    name: 'Gresik',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.1566,
    longitude: 112.6555,
  },
  {
    id: 'kab-mojokerto',
    name: 'Mojokerto',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.5459,
    longitude: 112.4381,
  },
  {
    id: 'kota-mojokerto',
    name: 'Mojokerto',
    type: 'kota',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.4726,
    longitude: 112.4381,
  },
  {
    id: 'kab-pasuruan',
    name: 'Pasuruan',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.7,
    longitude: 112.9,
  },
  {
    id: 'kota-pasuruan',
    name: 'Pasuruan',
    type: 'kota',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.6453,
    longitude: 112.9075,
  },
  {
    id: 'kab-malang',
    name: 'Malang',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -8.15,
    longitude: 112.65,
  },
  {
    id: 'kota-malang',
    name: 'Malang',
    type: 'kota',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.9839,
    longitude: 112.6214,
  },
  {
    id: 'kab-jombang',
    name: 'Jombang',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.5459,
    longitude: 112.2331,
  },
  {
    id: 'kab-lamongan',
    name: 'Lamongan',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.1283,
    longitude: 112.3134,
  },
  {
    id: 'kab-bangkalan',
    name: 'Bangkalan',
    type: 'kabupaten',
    provinceId: 'jawa-timur',
    provinceName: 'Jawa Timur',
    latitude: -7.0315,
    longitude: 112.7483,
  },
];

/**
 * Calculates great-circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest operational regency from coordinate input.
 */
export function findNearestOperationalRegency(
  latitude: number,
  longitude: number
): { regency: RegencyCoordinates; distanceKm: number } {
  let closest = OPERATIONAL_REGENCIES_GEO[0];
  let minDistance = calculateHaversineDistanceKm(
    latitude,
    longitude,
    closest.latitude,
    closest.longitude
  );

  for (let i = 1; i < OPERATIONAL_REGENCIES_GEO.length; i++) {
    const candidate = OPERATIONAL_REGENCIES_GEO[i];
    const dist = calculateHaversineDistanceKm(
      latitude,
      longitude,
      candidate.latitude,
      candidate.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = candidate;
    }
  }

  return {
    regency: closest,
    distanceKm: minDistance,
  };
}

export type GeolocationResult =
  | {
      status: 'success';
      regencyId: string;
      regencyName: string;
      provinceId: string;
      provinceName: string;
      distanceKm: number;
    }
  | {
      status: 'outside_coverage';
      message: string;
      nearestRegencyName?: string;
      distanceKm?: number;
    }
  | {
      status: 'permission_denied';
      message: string;
    }
  | {
      status: 'unavailable';
      message: string;
    }
  | {
      status: 'unsupported';
      message: string;
    };

/**
 * Requests device geolocation after explicit user action and maps to nearest operational regency.
 * Maximum threshold for operational matching is 85 km.
 */
export async function detectUserLocation(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      status: 'unsupported',
      message: 'Browser Anda tidak mendukung deteksi lokasi otomatis.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const { regency, distanceKm } = findNearestOperationalRegency(latitude, longitude);

        // Maximum distance threshold for East Java coverage (85 km)
        if (distanceKm > 85) {
          resolve({
            status: 'outside_coverage',
            message:
              'Lokasi Anda terdeteksi di luar area layanan utama Honda Satrya Dealer Group di Jawa Timur.',
            nearestRegencyName: regency.name,
            distanceKm: Math.round(distanceKm),
          });
          return;
        }

        resolve({
          status: 'success',
          regencyId: regency.id,
          regencyName: `${regency.name} (${regency.type === 'kota' ? 'Kota' : 'Kabupaten'})`,
          provinceId: regency.provinceId,
          provinceName: regency.provinceName,
          distanceKm: Math.round(distanceKm),
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({
            status: 'permission_denied',
            message: 'Izin akses lokasi tidak diberikan. Silakan pilih lokasi secara manual.',
          });
        } else {
          resolve({
            status: 'unavailable',
            message: 'Gagal mendeteksi lokasi perangkat. Silakan pilih lokasi secara manual.',
          });
        }
      },
      {
        enableHighAccuracy: false, // Low-power, fast network/GPS resolution
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}
