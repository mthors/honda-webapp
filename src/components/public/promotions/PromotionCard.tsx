import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PromotionSummary } from '@/types/promotions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { dealershipCopy } from '@/content/copy/id';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface PromotionCardProps {
  promotion: PromotionSummary;
}

function formatDateIndonesian(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString.split('T')[0];
  }
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const imageUrl = getStorageImageUrl(promotion.imagePath);
  const startDateStr = formatDateIndonesian(promotion.startsAt);
  const endDateStr = formatDateIndonesian(promotion.endsAt);

  return (
    <Card
      variant="canvas"
      padding="none"
      className="flex flex-col h-full overflow-hidden border border-hairline hover:border-ink transition-colors group"
    >
      {/* Visual Image / Banner */}
      <div className="relative w-full aspect-[16/9] bg-neutral-2/40 overflow-hidden border-b border-hairline flex items-center justify-center">
        <Image
          src={imageUrl}
          alt={promotion.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <Badge variant="primary" size="sm">
            {dealershipCopy.promotions.promoActiveBadge}
          </Badge>
          {promotion.eligibleModelCount > 0 && (
            <Badge variant="neutral" size="sm">
              {promotion.eligibleModelCount} Model Berlaku
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          <div className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1 font-manrope">
            {dealershipCopy.promotions.periodLabel}: {startDateStr} – {endDateStr}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-ink font-manrope group-hover:text-primary transition-colors line-clamp-2">
            {promotion.title}
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-body leading-relaxed line-clamp-3">
            {promotion.summary}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-6 pt-4 border-t border-hairline">
          <Link href={`/promo/${promotion.slug}`} className="block w-full">
            <Button variant="outline" size="sm" className="w-full justify-center">
              {dealershipCopy.promotions.viewPromoDetail} →
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

