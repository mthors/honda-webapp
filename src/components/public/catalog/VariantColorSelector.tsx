'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { CatalogVariant, VariantColorItem } from '@/types/catalog';
import { Button } from '@/components/ui/Button';
import { formatRupiah, normalizeIndonesianPhone } from '@/lib/formatters';
import { dealershipCopy } from '@/content/copy/id';

interface VariantColorSelectorProps {
  modelName: string;
  modelSlug: string;
  variants: CatalogVariant[];
  onColorImageChange?: (imagePath: string | null) => void;
  dealerWhatsApp?: string;
}

export function VariantColorSelector({
  modelName,
  modelSlug,
  variants,
  onColorImageChange,
  dealerWhatsApp = '081234567890',
}: VariantColorSelectorProps) {
  const initialVariant = variants[0] || null;
  const [selectedVariant, setSelectedVariant] = useState<CatalogVariant | null>(initialVariant);

  const availableColors = selectedVariant?.colors || [];
  const initialColor = availableColors[0] || null;
  const [selectedColor, setSelectedColor] = useState<VariantColorItem | null>(initialColor);

  const handleVariantChange = (variant: CatalogVariant) => {
    setSelectedVariant(variant);
    const newColors = variant.colors;
    const nextColor = newColors[0] || null;
    setSelectedColor(nextColor);
    if (onColorImageChange) {
      onColorImageChange(nextColor?.imagePath || null);
    }
  };

  const handleColorChange = (color: VariantColorItem) => {
    setSelectedColor(color);
    if (onColorImageChange) {
      onColorImageChange(color.imagePath || null);
    }
  };

  // WhatsApp prefilled message
  const waNumber = normalizeIndonesianPhone(dealerWhatsApp);
  const waText = encodeURIComponent(
    `Halo Honda Satrya Dealer Group, saya tertarik dengan informasi sepeda motor ${modelName}${
      selectedVariant ? ` varian ${selectedVariant.name}` : ''
    }${selectedColor ? ` warna ${selectedColor.name}` : ''}. Mohon rincian ketersediaan unit dan harga OTR untuk wilayah domisili saya.`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waText}`;

  // Inquiry page URL with preselected parameters
  const inquiryParams = new URLSearchParams();
  inquiryParams.set('model', modelSlug);
  if (selectedVariant) inquiryParams.set('variant', selectedVariant.name);
  if (selectedColor) inquiryParams.set('color', selectedColor.name);
  const inquiryUrl = `/hubungi?${inquiryParams.toString()}`;

  const currentPrice = selectedVariant?.priceIdr ?? null;

  return (
    <div className="space-y-6">
      {/* Price Summary */}
      <div className="p-4 bg-neutral-2/40 border border-hairline">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
          {dealershipCopy.catalog.startingFrom}
        </span>
        {currentPrice !== null ? (
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-ink font-manrope">
                {formatRupiah(currentPrice)}
              </span>
              <span className="text-xs font-medium text-muted">
                {selectedVariant ? `(${selectedVariant.name})` : ''}
              </span>
            </div>
            <span className="text-xs text-muted block mt-0.5">OTR Wilayah Dealer</span>
          </div>
        ) : (
          <div>
            <span className="text-sm font-semibold text-body italic">
              {dealershipCopy.catalog.noPriceAvailable}
            </span>
          </div>
        )}
      </div>

      {/* Variants Selector */}
      {variants.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2.5 font-manrope">
            {dealershipCopy.catalog.variantSelectTitle}
          </label>
          <div
            role="radiogroup"
            aria-label={dealershipCopy.catalog.variantSelectTitle}
            className="flex flex-wrap gap-2"
          >
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleVariantChange(v)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold border transition-all ${
                    isSelected
                      ? 'bg-ink text-canvas border-ink shadow-xs'
                      : 'bg-canvas text-body border-hairline hover:border-ink hover:text-ink'
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
          {selectedVariant?.description && (
            <p className="mt-2 text-xs text-muted leading-relaxed">{selectedVariant.description}</p>
          )}
        </div>
      )}

      {/* Colors Selector */}
      {availableColors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider font-manrope">
              {dealershipCopy.catalog.colorSelectTitle}
            </label>
            {selectedColor && (
              <span className="text-xs font-medium text-body">{selectedColor.name}</span>
            )}
          </div>

          <div
            role="radiogroup"
            aria-label={dealershipCopy.catalog.colorSelectTitle}
            className="flex flex-wrap items-center gap-3"
          >
            {availableColors.map((col) => {
              const isSelected = selectedColor?.id === col.id;
              return (
                <button
                  key={col.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleColorChange(col)}
                  aria-label={`${col.name}${isSelected ? ' (terpilih)' : ''}`}
                  title={col.name}
                  className={`group relative flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-hairline hover:border-ink'
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-full border border-black/10 shadow-inner"
                    style={{
                      backgroundColor: col.hexCode || '#CCCCCC',
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing and Legal Disclaimer */}
      <div className="p-4 bg-canvas border-l-4 border-l-primary border border-hairline text-xs text-body leading-relaxed">
        <p className="font-bold text-ink mb-1">{dealershipCopy.catalog.priceDisclaimerTitle}</p>
        <p>{dealershipCopy.catalog.priceDisclaimer}</p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
          <Button variant="primary" size="md" className="w-full justify-center">
            {dealershipCopy.catalog.whatsappCta}
          </Button>
        </a>

        <Link href={inquiryUrl} className="flex-1">
          <Button variant="outline" size="md" className="w-full justify-center">
            {dealershipCopy.catalog.inquiryCta}
          </Button>
        </Link>
      </div>
    </div>
  );
}
