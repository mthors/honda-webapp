import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getSavedUserLocation,
  saveUserLocation,
  touchUserLocationActivity,
  clearSavedUserLocation,
  USER_LOCATION_STORAGE_KEY,
  LOCATION_INACTIVITY_TIMEOUT_MS,
  LOCATION_CHANGE_EVENT,
} from './location-storage';

describe('Location Storage & Inactivity Expiration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when no location is saved in sessionStorage', () => {
    expect(getSavedUserLocation()).toBeNull();
  });

  it('saves user location to sessionStorage with lastActivityAt timestamp and dispatches event', () => {
    const eventSpy = vi.fn();
    window.addEventListener(LOCATION_CHANGE_EVENT, eventSpy);

    const saved = saveUserLocation({
      provinceId: 'jawa-timur',
      regencyId: 'kab-sidoarjo',
      provinceName: 'Jawa Timur',
      regencyName: 'Sidoarjo (Kabupaten)',
    });

    expect(saved).not.toBeNull();
    expect(saved?.provinceId).toBe('jawa-timur');
    expect(saved?.regencyId).toBe('kab-sidoarjo');
    expect(typeof saved?.lastActivityAt).toBe('number');

    const raw = sessionStorage.getItem(USER_LOCATION_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.regencyId).toBe('kab-sidoarjo');

    expect(eventSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener(LOCATION_CHANGE_EVENT, eventSpy);
  });

  it('retrieves saved location if within 2-hour inactivity window', () => {
    vi.useFakeTimers();
    const startTime = Date.now();
    vi.setSystemTime(startTime);

    saveUserLocation({
      provinceId: 'jawa-timur',
      regencyId: 'kota-surabaya',
      provinceName: 'Jawa Timur',
      regencyName: 'Surabaya (Kota)',
    });

    // Advance time by 1 hour (less than 2 hours)
    vi.advanceTimersByTime(60 * 60 * 1000);

    const retrieved = getSavedUserLocation();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.regencyId).toBe('kota-surabaya');
  });

  it('expires and purges saved location after 2 hours of inactivity', () => {
    vi.useFakeTimers();
    const startTime = Date.now();
    vi.setSystemTime(startTime);

    saveUserLocation({
      provinceId: 'jawa-timur',
      regencyId: 'kab-sidoarjo',
      provinceName: 'Jawa Timur',
      regencyName: 'Sidoarjo (Kabupaten)',
    });

    // Advance time by 2 hours + 1 second
    vi.advanceTimersByTime(LOCATION_INACTIVITY_TIMEOUT_MS + 1000);

    const retrieved = getSavedUserLocation();
    expect(retrieved).toBeNull();
    expect(sessionStorage.getItem(USER_LOCATION_STORAGE_KEY)).toBeNull();
  });

  it('refreshes lastActivityAt when touchUserLocationActivity is invoked within timeout', () => {
    vi.useFakeTimers();
    const startTime = Date.now();
    vi.setSystemTime(startTime);

    saveUserLocation({
      provinceId: 'jawa-timur',
      regencyId: 'kab-sidoarjo',
      provinceName: 'Jawa Timur',
      regencyName: 'Sidoarjo (Kabupaten)',
    });

    // Advance 1.5 hours
    vi.advanceTimersByTime(90 * 60 * 1000);

    // Refresh activity
    const touched = touchUserLocationActivity();
    expect(touched).toBe(true);

    // Advance another 1.5 hours (total elapsed 3h from start, but only 1.5h from touch)
    vi.advanceTimersByTime(90 * 60 * 1000);

    const retrieved = getSavedUserLocation();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.regencyId).toBe('kab-sidoarjo');
  });

  it('handles corrupted JSON in sessionStorage by clearing it safely', () => {
    sessionStorage.setItem(USER_LOCATION_STORAGE_KEY, '{invalid-json');
    expect(getSavedUserLocation()).toBeNull();
    expect(sessionStorage.getItem(USER_LOCATION_STORAGE_KEY)).toBeNull();
  });

  it('clears saved location explicitly and notifies listeners', () => {
    const eventSpy = vi.fn();
    window.addEventListener(LOCATION_CHANGE_EVENT, eventSpy);

    saveUserLocation({
      provinceId: 'jawa-timur',
      regencyId: 'kab-sidoarjo',
      provinceName: 'Jawa Timur',
      regencyName: 'Sidoarjo (Kabupaten)',
    });

    clearSavedUserLocation();
    expect(sessionStorage.getItem(USER_LOCATION_STORAGE_KEY)).toBeNull();
    expect(getSavedUserLocation()).toBeNull();

    // Event was dispatched on save and on clear
    expect(eventSpy).toHaveBeenCalledTimes(2);
    window.removeEventListener(LOCATION_CHANGE_EVENT, eventSpy);
  });
});
