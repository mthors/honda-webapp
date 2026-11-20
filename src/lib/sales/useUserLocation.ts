'use client';

import { useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import {
  type SavedUserLocation,
  getSavedUserLocation,
  saveUserLocation,
  clearSavedUserLocation,
  touchUserLocationActivity,
  LOCATION_CHANGE_EVENT,
  USER_LOCATION_STORAGE_KEY,
} from './location-storage';

function subscribeLocation(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(LOCATION_CHANGE_EVENT, callback);
  document.addEventListener('visibilitychange', callback);

  return () => {
    window.removeEventListener(LOCATION_CHANGE_EVENT, callback);
    document.removeEventListener('visibilitychange', callback);
  };
}

let cachedRaw: string | null = null;
let cachedParsed: SavedUserLocation | null = null;

function getLocationSnapshot(): SavedUserLocation | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  const raw = window.sessionStorage.getItem(USER_LOCATION_STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedParsed = getSavedUserLocation();
  }
  return cachedParsed;
}

function getServerSnapshot(): SavedUserLocation | null {
  return null;
}

function subscribeClient() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getClientServerSnapshot() {
  return false;
}

export function useUserLocation() {
  const isClient = useSyncExternalStore(
    subscribeClient,
    getClientSnapshot,
    getClientServerSnapshot
  );
  const location = useSyncExternalStore(subscribeLocation, getLocationSnapshot, getServerSnapshot);
  const isLoading = !isClient;
  const lastTouchTimeRef = useRef<number>(0);

  // Throttled user activity handler (maximum once every 30 seconds on meaningful user interaction)
  useEffect(() => {
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastTouchTimeRef.current > 30 * 1000) {
        lastTouchTimeRef.current = now;
        touchUserLocationActivity();
      }
    };

    window.addEventListener('click', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const setLocation = useCallback((loc: Omit<SavedUserLocation, 'lastActivityAt'>) => {
    saveUserLocation(loc);
  }, []);

  const clearLocation = useCallback(() => {
    clearSavedUserLocation();
  }, []);

  const touchActivity = useCallback(() => {
    touchUserLocationActivity();
  }, []);

  return {
    location,
    isLoading,
    setLocation,
    clearLocation,
    touchActivity,
  };
}
