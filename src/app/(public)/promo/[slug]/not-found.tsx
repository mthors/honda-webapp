import React from 'react';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function PromoNotFound() {
  return (
    <div className="py-20 sm:py-28 text-center">
      <Container>
        <div className="max-w-md mx-auto p-8 bg-neutral-2/40 border border-hairline">
          <span className="text-3xl font-extrabold text-muted block mb-3 font-manrope">404</span>
          <h1 className="text-xl sm:text-2xl font-bold text-ink mb-2 font-manrope">
            {dealershipCopy.promotions.promoNotFoundTitle}
          </h1>
          <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
            {dealershipCopy.promotions.promoNotFoundDescription}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/promo">
              <Button variant="primary" size="sm">
                {dealershipCopy.promotions.backToPromoList}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                {dealershipCopy.common.backToHome}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
