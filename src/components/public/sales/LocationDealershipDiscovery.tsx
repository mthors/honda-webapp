'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useUserLocation } from '@/lib/sales/useUserLocation';
import { discoverDealershipsByRegencyAction } from '@/lib/sales/actions';
import { normalizeIndonesianPhone } from '@/lib/formatters';
import { LocationSelector } from './LocationSelector';
import type { ProvinceItem, RegencyItem } from '@/types/sales';
import type { DealershipItem } from '@/types/dealership';

interface LocationDealershipDiscoveryProps {
  provinces: ProvinceItem[];
  regencies: RegencyItem[];
  allDealerships: DealershipItem[];
}

export function LocationDealershipDiscovery({
  provinces,
  regencies,
  allDealerships,
}: LocationDealershipDiscoveryProps) {
  const { location, isLoading: isLocationLoading, setLocation } = useUserLocation();
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [matchedDealerships, setMatchedDealerships] = useState<DealershipItem[]>([]);
  const [loadedRegencyId, setLoadedRegencyId] = useState<string | null>(null);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  const activeFetchIdRef = useRef(0);

  const isFetchingDealerships =
    Boolean(location?.regencyId) && loadedRegencyId !== location?.regencyId;

  const t = dealershipCopy.locationDiscovery;

  // Whenever user location changes or initializes, discover dealerships for that regency
  useEffect(() => {
    const regencyId = location?.regencyId;
    if (!regencyId) {
      return;
    }

    const currentFetchId = ++activeFetchIdRef.current;
    let isMounted = true;

    void (async () => {
      try {
        const res = await discoverDealershipsByRegencyAction(regencyId);
        if (!isMounted || activeFetchIdRef.current !== currentFetchId) return;

        if (res.success && res.data) {
          setMatchedDealerships(res.data);
          setDiscoveryError(null);
        } else {
          setDiscoveryError(res.error || 'Gagal mencari dealer yang melayani wilayah Anda.');
        }
      } catch (err) {
        if (!isMounted || activeFetchIdRef.current !== currentFetchId) return;
        console.error('Error discovering dealerships:', err);
        setDiscoveryError('Terjadi kendala sistem saat mencari dealer yang melayani wilayah Anda.');
      } finally {
        if (isMounted && activeFetchIdRef.current === currentFetchId) {
          setLoadedRegencyId(regencyId);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location?.regencyId]);

  if (isLocationLoading) {
    return (
      <Card variant="canvas" padding="lg" className="border border-hairline animate-pulse mb-12">
        <div className="h-6 bg-neutral-2 w-1/3 mb-3" />
        <div className="h-4 bg-neutral-2 w-2/3" />
      </Card>
    );
  }

  // State 1: No location selected yet, or user explicitly requested to change location
  if (!location || isChangingLocation) {
    return (
      <div className="mb-14">
        <LocationSelector
          provinces={provinces}
          regencies={regencies}
          currentProvinceId={location?.provinceId}
          currentRegencyId={location?.regencyId}
          onSelectLocation={(newLocation) => {
            setLocation(newLocation);
            setIsChangingLocation(false);
          }}
          onCancel={location ? () => setIsChangingLocation(false) : undefined}
        />
      </div>
    );
  }

  // State 2: Location is active. Render persistent indicator and matching dealerships.
  return (
    <section aria-labelledby="location-discovery-heading" className="mb-14 space-y-6">
      {/* Persistent Location Bar */}
      <div className="bg-canvas border border-hairline p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div>
            <span className="text-xs text-muted block uppercase tracking-wider font-semibold">
              {t.activeLocationLabel}
            </span>
            <div className="text-sm sm:text-base font-bold text-ink">
              <span>{location.regencyName}</span>
              <span className="text-muted font-normal">, {location.provinceName}</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsChangingLocation(true)}
          className="self-start sm:self-auto shrink-0"
        >
          {t.changeLocation}
        </Button>
      </div>

      {/* Discovery Results Header */}
      <div>
        <h2
          id="location-discovery-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-heading"
        >
          {t.matchingDealershipsTitle}
        </h2>
        <p className="mt-1 text-sm text-body">{t.matchingDealershipsSubtitle}</p>
      </div>

      {/* Discovery Loading State */}
      {isFetchingDealerships && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((idx) => (
            <Card
              key={idx}
              variant="canvas"
              padding="md"
              className="border border-hairline animate-pulse space-y-4"
            >
              <div className="h-5 bg-neutral-2 w-1/2" />
              <div className="h-4 bg-neutral-2 w-3/4" />
              <div className="h-4 bg-neutral-2 w-2/3" />
              <div className="h-9 bg-neutral-2 w-full mt-4" />
            </Card>
          ))}
        </div>
      )}

      {/* Discovery Error State */}
      {!isFetchingDealerships && discoveryError && (
        <Card
          variant="neutral"
          padding="lg"
          className="border border-red-200 bg-red-50 text-center"
        >
          <p className="text-sm text-status-error font-medium">{discoveryError}</p>
          <button
            type="button"
            onClick={() => setIsChangingLocation(true)}
            className="mt-3 text-xs text-primary font-semibold underline"
          >
            Pilih Ulang Lokasi
          </button>
        </Card>
      )}

      {/* Discovery Empty State: No dealership serves this region */}
      {!isFetchingDealerships && !discoveryError && matchedDealerships.length === 0 && (
        <Card variant="neutral" padding="lg" className="text-center p-8 border border-hairline">
          <div className="max-w-md mx-auto space-y-3">
            <svg
              className="w-12 h-12 text-muted mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="text-base font-bold text-ink font-heading">{t.emptyDealershipsTitle}</h3>
            <p className="text-xs text-body leading-relaxed">
              {t.emptyDealershipsMessage.replace('{regencyName}', location.regencyName)}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#lokasi-showroom"
                className="text-xs text-primary font-semibold hover:underline"
              >
                Lihat Semua Lokasi Showroom ({allDealerships.length}) &darr;
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Discovery Success: Active Dealerships List */}
      {!isFetchingDealerships && !discoveryError && matchedDealerships.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchedDealerships.map((dealer) => {
            const rawWA = dealer.whatsappNumber;
            const cleanWA = rawWA ? normalizeIndonesianPhone(rawWA) : '';
            const hasWA = cleanWA.length >= 9;
            const branchWaUrl = hasWA
              ? `https://wa.me/${cleanWA}?text=${encodeURIComponent(
                  `Halo ${dealer.name}, saya berdomisili di ${location.regencyName} dan ingin menanyakan informasi motor Honda.`
                )}`
              : null;

            return (
              <Card
                key={dealer.id}
                variant="canvas"
                padding="md"
                className="border border-hairline flex flex-col justify-between h-full hover:border-primary/40 transition-colors shadow-2xs"
              >
                <div className="space-y-4">
                  {/* Card Header: City, Name & Synthetic Demo Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                        {dealer.city}
                      </span>
                      <h3 className="text-base font-bold text-ink font-heading mt-0.5">
                        {dealer.name}
                      </h3>
                    </div>
                    {dealer.isSynthetic && (
                      <Badge variant="warning" size="sm">
                        {dealershipCopy.adminSettings.syntheticBadge}
                      </Badge>
                    )}
                  </div>

                  {/* Detail Rows */}
                  <div className="space-y-3 text-xs border-t border-hairline pt-3">
                    {/* Address */}
                    <div>
                      <span className="font-semibold text-muted block text-[11px] uppercase tracking-wider">
                        Alamat Showroom
                      </span>
                      <p className="text-body leading-relaxed mt-0.5">
                        {dealer.address || (
                          <span className="text-muted italic">
                            {dealershipCopy.contact.infoUnavailable}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Opening Hours */}
                    <div>
                      <span className="font-semibold text-muted block text-[11px] uppercase tracking-wider">
                        {dealershipCopy.contact.operatingHoursTitle}
                      </span>
                      <p className="text-body leading-relaxed mt-0.5">
                        {dealer.openingHours || (
                          <span className="text-muted italic">
                            {dealershipCopy.contact.infoUnavailable}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Contact Info */}
                    <div>
                      <span className="font-semibold text-muted block text-[11px] uppercase tracking-wider">
                        {dealershipCopy.contact.branchContact}
                      </span>
                      <div className="text-body mt-0.5 space-y-0.5">
                        {dealer.phone && <div>Tel: {dealer.phone}</div>}
                        {cleanWA && <div>WA: +{cleanWA}</div>}
                        {!dealer.phone && !cleanWA && (
                          <span className="text-muted italic">
                            {dealershipCopy.contact.infoUnavailable}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-hairline mt-4 space-y-2">
                  {branchWaUrl && (
                    <a
                      href={branchWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-status-success hover:bg-green-700 transition-colors shadow-2xs"
                    >
                      <span>Chat Cabang via WhatsApp</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  )}

                  <Link
                    href="/motor"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink bg-neutral-1 hover:bg-neutral-2 border border-hairline transition-colors"
                  >
                    <span>{t.viewCatalogForArea}</span>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
