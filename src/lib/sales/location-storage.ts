/**
 * User Location Preference & Session Storage Management
 *
 * Implements:
 * - Temporary browsing location storage in browser sessionStorage.
 * - 2-hour sliding inactivity timeout.
 * - Meaningful activity tracking to refresh timeout.
 * - Cross-component reactive sync via window custom events.
 * - Expiration check on load, visibility change, and before discovery queries.
 */

export interface SavedUserLocation {
  provinceId: string;
  regencyId: string;
  provinceName: string;
  regencyName: string;
  lastActivityAt: number;
}

export const USER_LOCATION_STORAGE_KEY = 'honda-user-location';
export const LOCATION_CHANGE_EVENT = 'honda-location-change';
export const LOCATION_INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

function isWindowAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

/**
 * Retrieves the currently saved user location from sessionStorage.
 * Automatically checks for 2-hour inactivity expiration.
 * If expired, purges the stored record and returns null.
 */
export function getSavedUserLocation(): SavedUserLocation | null {
  if (!isWindowAvailable()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SavedUserLocation>;

    // Validate expected structure
    if (
      !parsed ||
      typeof parsed.provinceId !== 'string' ||
      typeof parsed.regencyId !== 'string' ||
      typeof parsed.provinceName !== 'string' ||
      typeof parsed.regencyName !== 'string' ||
      typeof parsed.lastActivityAt !== 'number'
    ) {
      clearSavedUserLocation();
      return null;
    }

    // Check 2-hour inactivity timeout
    const now = Date.now();
    const elapsed = now - parsed.lastActivityAt;

    if (elapsed > LOCATION_INACTIVITY_TIMEOUT_MS) {
      // Inactivity timeout exceeded: clear session
      clearSavedUserLocation();
      return null;
    }

    return parsed as SavedUserLocation;
  } catch (err) {
    console.error('Error reading saved user location from sessionStorage:', err);
    clearSavedUserLocation();
    return null;
  }
}

/**
 * Stores or updates the user location in sessionStorage with a fresh activity timestamp.
 * Dispatches a custom event to notify all listening components.
 */
export function saveUserLocation(
  location: Omit<SavedUserLocation, 'lastActivityAt'>
): SavedUserLocation | null {
  if (!isWindowAvailable()) {
    return null;
  }

  try {
    const payload: SavedUserLocation = {
      provinceId: location.provinceId.trim(),
      regencyId: location.regencyId.trim(),
      provinceName: location.provinceName.trim(),
      regencyName: location.regencyName.trim(),
      lastActivityAt: Date.now(),
    };

    window.sessionStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(payload));

    // Notify other components
    window.dispatchEvent(
      new CustomEvent<SavedUserLocation | null>(LOCATION_CHANGE_EVENT, {
        detail: payload,
      })
    );

    return payload;
  } catch (err) {
    console.error('Error saving user location to sessionStorage:', err);
    return null;
  }
}

/**
 * Refreshes the lastActivityAt timestamp for the current location if it has not expired.
 * Does not emit events or cause re-renders if the location is unchanged.
 * Returns true if refreshed, false if missing or expired.
 */
export function touchUserLocationActivity(): boolean {
  if (!isWindowAvailable()) {
    return false;
  }

  const current = getSavedUserLocation();
  if (!current) {
    return false;
  }

  try {
    const refreshed: SavedUserLocation = {
      ...current,
      lastActivityAt: Date.now(),
    };

    window.sessionStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(refreshed));
    return true;
  } catch (err) {
    console.error('Error touching user location activity timestamp:', err);
    return false;
  }
}

/**
 * Clears the saved user location from sessionStorage.
 * Dispatches a custom event with null to update active UI views.
 */
export function clearSavedUserLocation(): void {
  if (!isWindowAvailable()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(USER_LOCATION_STORAGE_KEY);
  } catch (err) {
    console.error('Error removing user location from sessionStorage:', err);
  }

  try {
    window.dispatchEvent(
      new CustomEvent<SavedUserLocation | null>(LOCATION_CHANGE_EVENT, {
        detail: null,
      })
    );
  } catch {
    // Ignore event dispatch errors in edge environments
  }
}
