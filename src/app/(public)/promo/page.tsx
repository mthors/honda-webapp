import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Promo Sepeda Motor Honda — Honda Satrya Dealer Group',
  description:
    'Program promo resmi, diskon spesial, dan penawaran menarik dari dealer Honda Satrya Dealer Group.',
};

export default function PromoPage() {
  return (
    <div className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            Milestone 4 — Pratinjau Promo
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.promotions.title}
          </h1>
          <p className="mt-3 text-base text-body leading-relaxed">
            Dapatkan penawaran terbaik dan program spesial resmi dari dealer Honda Satrya Dealer
            Group.
          </p>
        </div>

        <Card variant="neutral" padding="lg" className="border-l-4 border-l-primary mb-8">
          <h2 className="text-lg font-bold text-ink mb-2 font-manrope">
            {dealershipCopy.promotions.placeholderTitle}
          </h2>
          <p className="text-sm text-body leading-relaxed mb-6">
            {dealershipCopy.promotions.placeholderNotice} Hubungi konsultan sales kami untuk
            menanyakan promo berjalan bulan ini.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/hubungi">
              <Button variant="primary" size="sm">
                {dealershipCopy.common.contactSales}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                {dealershipCopy.common.backToHome}
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
