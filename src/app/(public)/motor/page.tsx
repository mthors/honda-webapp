import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Katalog Sepeda Motor Honda — Honda Satrya Dealer Group',
  description:
    'Daftar lini sepeda motor Honda resmi: Matic, Sport, Cub, dan EV di dealer Honda Satrya Dealer Group.',
};

export default function MotorCatalogPage() {
  const sampleCategories = [
    {
      name: dealershipCopy.catalog.categories.matic,
      desc: 'Skutik harian lincah dan berteknologi tinggi.',
    },
    {
      name: dealershipCopy.catalog.categories.cub,
      desc: 'Bebek legendaris tangguh dan hemat bahan bakar.',
    },
    {
      name: dealershipCopy.catalog.categories.sport,
      desc: 'Performa agresif dan handling presisi untuk jiwa sporty.',
    },
    {
      name: dealershipCopy.catalog.categories.ev,
      desc: 'Masa depan mobilitas ramah lingkungan tanpa emisi.',
    },
  ];

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            Milestone 3 — Pratinjau Katalog
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.catalog.title}
          </h1>
          <p className="mt-3 text-base text-body leading-relaxed">
            {dealershipCopy.catalog.subtitle}
          </p>
        </div>

        {/* Milestone Notice Card */}
        <Card variant="neutral" padding="lg" className="mb-12 border-l-4 border-l-primary">
          <h2 className="text-lg font-bold text-ink mb-2 font-manrope">
            {dealershipCopy.catalog.placeholderTitle}
          </h2>
          <p className="text-sm text-body leading-relaxed mb-4">
            {dealershipCopy.catalog.placeholderNotice}
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

        {/* Category Previews */}
        <h2 className="text-xl font-bold text-ink mb-6 font-manrope">Kategori Unit Honda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleCategories.map((cat) => (
            <Card
              key={cat.name}
              variant="canvas"
              padding="md"
              className="flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-ink font-manrope mb-2">{cat.name}</h3>
                <p className="text-xs text-body leading-relaxed">{cat.desc}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-hairline text-xs font-semibold text-primary">
                Akan Tersedia Segera →
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </div>
  );
}
