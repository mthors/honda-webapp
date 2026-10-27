'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { CatalogModelImage } from '@/types/catalog';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface ProductGalleryProps {
  images: CatalogModelImage[];
  modelName: string;
  selectedColorImage?: string | null;
}

export function ProductGallery({ images, modelName, selectedColorImage }: ProductGalleryProps) {
  const [userSelectedImage, setUserSelectedImage] = useState<CatalogModelImage | null>(null);
  const [prevColorImage, setPrevColorImage] = useState<string | null | undefined>(
    selectedColorImage
  );

  // When selected color image changes from parent, reset user-selected override
  if (selectedColorImage !== prevColorImage) {
    setPrevColorImage(selectedColorImage);
    setUserSelectedImage(null);
  }

  const activeImage =
    userSelectedImage ||
    (selectedColorImage
      ? images.find((img) => img.storagePath === selectedColorImage) || {
          id: 'selected-color-image',
          storagePath: selectedColorImage,
          altText: `Honda ${modelName} - Varian Warna`,
          imageRole: 'color' as const,
          sortOrder: 0,
          variantId: null,
          colorId: null,
        }
      : null) ||
    images[0] ||
    null;

  const currentPath = activeImage?.storagePath;
  const currentAlt = activeImage?.altText || `Honda ${modelName}`;
  const displayUrl = getStorageImageUrl(currentPath);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Display */}
      <div className="relative w-full aspect-[4/3] bg-neutral-2/40 border border-hairline overflow-hidden flex items-center justify-center p-4">
        <Image
          src={displayUrl}
          alt={currentAlt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-4 transition-all duration-300"
        />
      </div>

      {/* Thumbnails Row (if more than 1 image) */}
      {images.length > 1 && (
        <div
          role="region"
          aria-label="Galeri gambar model"
          className="flex items-center gap-2 overflow-x-auto pb-2"
        >
          {images.map((img, idx) => {
            const isSelected = activeImage?.id === img.id;
            const thumbUrl = getStorageImageUrl(img.storagePath);
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setUserSelectedImage(img)}
                aria-pressed={isSelected}
                aria-label={`Lihat gambar ${idx + 1}: ${img.altText}`}
                className={`relative shrink-0 w-20 h-16 bg-neutral-2/40 border transition-all ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-hairline hover:border-ink'
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={img.altText}
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
