import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CatalogModelSummary } from '@/types/catalog';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/formatters';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { dealershipCopy } from '@/content/copy/id';

interface MotorcycleCardProps {
  model: CatalogModelSummary;
}

export function MotorcycleCard({ model }: MotorcycleCardProps) {
  const imageUrl = getStorageImageUrl(model.primaryImage?.storagePath);
  const imageAlt = model.primaryImage?.altText || `Sepeda motor Honda ${model.name}`;

  return (
    <Card
      variant="canvas"
      padding="none"
      className="flex flex-col h-full overflow-hidden border border-hairline hover:border-ink transition-colors group"
    >
      {/* Image Banner */}
      <div className="relative w-full aspect-[16/10] bg-neutral-2/40 flex items-center justify-center p-4 overflow-hidden border-b border-hairline">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          priority={model.isFeatured}
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <Badge variant="neutral" size="sm">
            {model.category.name}
          </Badge>
          {model.isNew && (
            <Badge variant="primary" size="sm">
              {dealershipCopy.status.newModel}
            </Badge>
          )}
          {model.isFeatured && (
            <Badge variant="neutral" size="sm">
              {dealershipCopy.status.featured}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink font-manrope group-hover:text-primary transition-colors">
            {model.name}
          </h3>

          {/* Quick Specs (Engine & Transmission) */}
          {(model.engineCc || model.transmission) && (
            <p className="mt-1 text-xs font-medium text-muted">
              {[
                model.engineCc ? `${model.engineCc} cc` : null,
                model.transmission ? model.transmission : null,
              ]
                .filter(Boolean)
                .join(' • ')}
            </p>
          )}

          {/* Short Description */}
          {model.shortDescription && (
            <p className="mt-2.5 text-xs text-body leading-relaxed line-clamp-2">
              {model.shortDescription}
            </p>
          )}
        </div>

        {/* Price & CTA */}
        <div className="mt-6 pt-4 border-t border-hairline">
          <div className="mb-4">
            {model.startingPriceIdr !== null ? (
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-muted block mb-0.5">
                  {dealershipCopy.catalog.startingFrom}
                </span>
                <span className="text-base sm:text-lg font-bold text-ink font-manrope">
                  {formatRupiah(model.startingPriceIdr)}
                </span>
                <span className="text-[11px] text-muted block">OTR Wilayah Dealer</span>
              </div>
            ) : (
              <div>
                <span className="text-xs text-body leading-tight block italic">
                  {dealershipCopy.catalog.noPriceAvailable}
                </span>
              </div>
            )}
          </div>

          <Link href={`/motor/${model.slug}`} className="block w-full">
            <Button variant="outline" size="sm" className="w-full justify-center">
              {dealershipCopy.catalog.viewDetails} →
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
