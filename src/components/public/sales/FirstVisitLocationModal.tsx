'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { useUserLocation } from '@/lib/sales/useUserLocation';
import { LocationSelector } from './LocationSelector';
import type { ProvinceItem, RegencyItem } from '@/types/sales';

export const LOCATION_MODAL_DISMISSED_KEY = 'honda-location-modal-dismissed';
export const LOCATION_DISMISSED_CHANGE_EVENT = 'honda-location-dismissed-change';
export const OPEN_LOCATION_MODAL_EVENT = 'honda-open-location-modal';
export const REQUEST_LOCATION_EVENT = 'honda-request-location';

function subscribeDismissed(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(LOCATION_DISMISSED_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener(LOCATION_DISMISSED_CHANGE_EVENT, callback);
  };
}

function getDismissedSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  return window.sessionStorage.getItem(LOCATION_MODAL_DISMISSED_KEY) === 'true';
}

function getServerDismissedSnapshot(): boolean {
  return true; // Keep closed on server
}

interface FirstVisitLocationModalProps {
  provinces: ProvinceItem[];
  regencies: RegencyItem[];
}

export function FirstVisitLocationModal({ provinces, regencies }: FirstVisitLocationModalProps) {
  const { location, isLoading, setLocation } = useUserLocation();
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const [hasSelectedInModal, setHasSelectedInModal] = useState(false);
  const pathname = usePathname();

  const isDismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getServerDismissedSnapshot
  );

  const t = dealershipCopy.locationDiscovery;

  // Determine open state purely from reactive external store and navigation state
  const shouldAutoShow =
    !location && !isDismissed && !hasSelectedInModal && pathname !== '/hubungi';
  const isOpen = !isLoading && (isManuallyOpen || shouldAutoShow);

  const handleDismiss = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(LOCATION_MODAL_DISMISSED_KEY, 'true');
        window.dispatchEvent(new Event(LOCATION_DISMISSED_CHANGE_EVENT));
      }
    } catch (err) {
      console.warn('Could not record location modal dismissal in sessionStorage:', err);
    }
    setIsManuallyOpen(false);
  }, []);

  // Global custom event listeners to allow any component to open the modal (e.g. Ubah Lokasi, contact CTAs)
  useEffect(() => {
    const handleOpenModal = () => {
      setIsManuallyOpen(true);
    };

    const handleRequestLocation = () => {
      // If customer has no location yet, prompt them
      if (!location) {
        setIsManuallyOpen(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };

    window.addEventListener(OPEN_LOCATION_MODAL_EVENT, handleOpenModal);
    window.addEventListener(REQUEST_LOCATION_EVENT, handleRequestLocation);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(OPEN_LOCATION_MODAL_EVENT, handleOpenModal);
      window.removeEventListener(REQUEST_LOCATION_EVENT, handleRequestLocation);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, location, handleDismiss]);

  const handleLocationSelected = (newLoc: {
    provinceId: string;
    regencyId: string;
    provinceName: string;
    regencyName: string;
  }) => {
    setHasSelectedInModal(true);
    setLocation(newLoc);
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(LOCATION_MODAL_DISMISSED_KEY);
        window.dispatchEvent(new Event(LOCATION_DISMISSED_CHANGE_EVENT));
      }
    } catch {
      // Ignore
    }
    setIsManuallyOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-canvas text-ink border border-hairline shadow-2xl p-6 sm:p-8 my-auto">
        {/* Dismiss Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup modal lokasi"
          className="absolute top-4 right-4 z-10 text-muted hover:text-ink p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-none"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Embedded LocationSelector */}
        <LocationSelector
          provinces={provinces}
          regencies={regencies}
          currentProvinceId={location?.provinceId}
          currentRegencyId={location?.regencyId}
          title={t.firstVisitModalTitle}
          subtitle={t.firstVisitModalSubtitle}
          submitLabel={t.saveLocation}
          cancelLabel={t.dismissPrompt}
          onSelectLocation={handleLocationSelected}
          onCancel={handleDismiss}
          showCardWrapper={false}
          isCompact
        />
      </div>
    </div>
  );
}
