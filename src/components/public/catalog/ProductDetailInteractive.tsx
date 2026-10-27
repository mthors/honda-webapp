'use client';

import React, { useState } from 'react';
import type { CatalogModelDetail } from '@/types/catalog';
import { ProductGallery } from './ProductGallery';
import { VariantColorSelector } from './VariantColorSelector';

interface ProductDetailInteractiveProps {
  model: CatalogModelDetail;
  dealerWhatsApp?: string;
}

export function ProductDetailInteractive({ model, dealerWhatsApp }: ProductDetailInteractiveProps) {
  const [selectedColorImage, setSelectedColorImage] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Left Column: Image Gallery */}
      <div className="lg:col-span-7">
        <ProductGallery
          images={model.images}
          modelName={model.name}
          selectedColorImage={selectedColorImage}
        />
      </div>

      {/* Right Column: Variant & Color Selection & CTAs */}
      <div className="lg:col-span-5">
        <VariantColorSelector
          modelName={model.name}
          modelSlug={model.slug}
          variants={model.variants}
          onColorImageChange={setSelectedColorImage}
          dealerWhatsApp={dealerWhatsApp}
        />
      </div>
    </div>
  );
}
