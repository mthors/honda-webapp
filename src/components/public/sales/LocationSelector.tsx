'use client';

import React, { useState, useTransition } from 'react';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { detectUserLocation, type GeolocationResult } from '@/lib/sales/geolocation';
import type { ProvinceItem, RegencyItem } from '@/types/sales';

interface LocationSelectorProps {
  provinces: ProvinceItem[];
  regencies: RegencyItem[];
  currentProvinceId?: string;
  currentRegencyId?: string;
  onSelectLocation: (location: {
    provinceId: string;
    regencyId: string;
    provinceName: string;
    regencyName: string;
  }) => void;
  onCancel?: () => void;
  isCompact?: boolean;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  cancelLabel?: string;
  showCardWrapper?: boolean;
}

export function LocationSelector({
  provinces,
  regencies,
  currentProvinceId,
  currentRegencyId,
  onSelectLocation,
  onCancel,
  isCompact = false,
  title,
  subtitle,
  submitLabel,
  cancelLabel,
  showCardWrapper = true,
}: LocationSelectorProps) {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(
    currentProvinceId || provinces[0]?.id || ''
  );
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>(currentRegencyId || '');

  // Geolocation Detection State
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<Extract<
    GeolocationResult,
    { status: 'success' }
  > | null>(null);

  const [, startTransition] = useTransition();

  const t = dealershipCopy.locationDiscovery;

  // Filter active regencies belonging to the selected province
  const availableRegencies = regencies.filter(
    (r) => r.isActive && r.provinceId === selectedProvinceId
  );

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvId = e.target.value;
    setSelectedProvinceId(newProvId);
    // Reset regency selection on province change
    setSelectedRegencyId('');
    setGeoError(null);
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegencyId(e.target.value);
    setGeoError(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvinceId || !selectedRegencyId) return;

    const prov = provinces.find((p) => p.id === selectedProvinceId);
    const reg = regencies.find((r) => r.id === selectedRegencyId);

    if (prov && reg) {
      onSelectLocation({
        provinceId: prov.id,
        regencyId: reg.id,
        provinceName: prov.name,
        regencyName: `${reg.name} (${reg.type === 'kota' ? 'Kota' : 'Kabupaten'})`,
      });
    }
  };

  const handleDetectLocation = async () => {
    setGeoError(null);
    setDetectedLocation(null);
    setIsDetectingGeo(true);

    try {
      const result = await detectUserLocation();

      if (result.status === 'success') {
        setDetectedLocation(result);
      } else if (result.status === 'permission_denied') {
        setGeoError(t.geoPermissionDenied);
      } else if (result.status === 'outside_coverage') {
        setGeoError(t.geoOutsideCoverage);
      } else {
        setGeoError(t.geoUnavailable);
      }
    } catch (err) {
      console.error('Unexpected error during geolocation detection:', err);
      setGeoError(t.geoUnavailable);
    } finally {
      setIsDetectingGeo(false);
    }
  };

  const handleConfirmDetectedLocation = () => {
    if (!detectedLocation) return;

    startTransition(() => {
      onSelectLocation({
        provinceId: detectedLocation.provinceId,
        regencyId: detectedLocation.regencyId,
        provinceName: detectedLocation.provinceName,
        regencyName: detectedLocation.regencyName,
      });
      setDetectedLocation(null);
    });
  };

  const content = (
    <>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-ink font-heading tracking-tight">
          {title || t.heading}
        </h2>
        <p className="text-sm text-body mt-1.5 leading-relaxed">{subtitle || t.subheading}</p>
      </div>

      {/* Geolocation Feedback Alert */}
      {geoError && (
        <div
          role="alert"
          className="mb-5 p-3.5 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs flex items-start justify-between gap-3"
        >
          <span>{geoError}</span>
          <button
            type="button"
            onClick={() => setGeoError(null)}
            className="text-amber-800 hover:text-amber-950 font-bold uppercase text-[10px] shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Geolocation Confirmation Dialog */}
      {detectedLocation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="geo-confirm-title"
          className="mb-6 p-4 bg-primary/5 border border-primary/20 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <svg
              className="w-5 h-5 text-primary shrink-0 mt-0.5"
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
            <div>
              <h3 id="geo-confirm-title" className="text-sm font-bold text-ink">
                {t.detectedConfirmTitle}
              </h3>
              <p className="text-xs text-body mt-1">
                {t.detectedConfirmMessage
                  .replace('{regencyName}', detectedLocation.regencyName)
                  .replace('{provinceName}', detectedLocation.provinceName)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleConfirmDetectedLocation}
            >
              {t.useDetectedLocation}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDetectedLocation(null)}
            >
              {t.chooseManually}
            </Button>
          </div>
        </div>
      )}

      {/* Manual Selection Form */}
      <form onSubmit={handleManualSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Province Selector */}
          <div>
            <label
              htmlFor="location-province-select"
              className="block text-xs font-semibold text-body mb-1"
            >
              {t.provinceLabel} <span className="text-primary">*</span>
            </label>
            <select
              id="location-province-select"
              value={selectedProvinceId}
              onChange={handleProvinceChange}
              required
              className="w-full text-sm px-3 py-2.5 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
            >
              <option value="" disabled>
                {t.provincePlaceholder}
              </option>
              {provinces
                .filter((p) => p.isActive)
                .map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Regency Selector */}
          <div>
            <label
              htmlFor="location-regency-select"
              className="block text-xs font-semibold text-body mb-1"
            >
              {t.regencyLabel} <span className="text-primary">*</span>
            </label>
            <select
              id="location-regency-select"
              value={selectedRegencyId}
              onChange={handleRegencyChange}
              required
              disabled={!selectedProvinceId || availableRegencies.length === 0}
              className="w-full text-sm px-3 py-2.5 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink disabled:bg-neutral-1 disabled:text-muted"
            >
              <option value="">
                {selectedProvinceId ? t.regencyPlaceholder : 'Pilih provinsi terlebih dahulu'}
              </option>
              {availableRegencies.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.type === 'kota' ? 'Kota' : 'Kabupaten'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-hairline mt-4">
          {/* Geolocation Button */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetectingGeo}
            className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-body hover:text-primary transition-colors py-2 px-3 border border-hairline bg-surface hover:bg-neutral-1 disabled:opacity-50"
            title="Deteksi otomatis lokasi menggunakan koordinat perangkat"
          >
            <svg
              className={`w-4 h-4 text-primary ${isDetectingGeo ? 'animate-spin' : ''}`}
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
            <span>{isDetectingGeo ? t.detectingLocation : t.useMyLocation}</span>
          </button>

          {/* Submit & Optional Cancel */}
          <div className="flex items-center gap-2.5">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                {cancelLabel || 'Batal'}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedProvinceId || !selectedRegencyId}
            >
              {submitLabel || t.viewDealerships}
            </Button>
          </div>
        </div>
      </form>
    </>
  );

  if (!showCardWrapper) {
    return <div className="relative">{content}</div>;
  }

  return (
    <Card
      variant="canvas"
      padding={isCompact ? 'md' : 'lg'}
      className="border border-hairline shadow-sm relative"
    >
      {content}
    </Card>
  );
}
