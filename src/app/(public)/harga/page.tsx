import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Daftar Harga OTR Sepeda Motor Honda — Honda Satrya Dealer Group',
  description:
    'Informasi daftar harga OTR terbaru untuk sepeda motor Honda di dealer resmi Honda Satrya Dealer Group.',
};

export default function HargaPage() {
  return (
    <div className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            Milestone 4 — Pratinjau Harga OTR
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.pricing.title}
          </h1>
          <p className="mt-3 text-base text-body leading-relaxed">
            Informasi estimasi harga On The Road (OTR) resmi untuk wilayah Sidoarjo dan sekitarnya.
          </p>
        </div>

        {/* Official Disclaimer Box */}
        <Card variant="neutral" padding="lg" className="mb-8 border-l-4 border-l-primary">
          <div className="flex items-start space-x-3">
            <span className="text-primary text-xl font-bold leading-none">!</span>
            <div>
              <h2 className="text-base font-bold text-ink mb-2 font-manrope">
                Kebijakan & Disclaimer Harga Dealer
              </h2>
              <p className="text-sm text-body leading-relaxed">
                {dealershipCopy.pricing.disclaimer}
              </p>
            </div>
          </div>
        </Card>

        {/* Milestone 4 Development Status Notice */}
        <Card variant="canvas" padding="lg" className="border border-hairline">
          <h3 className="text-lg font-bold text-ink mb-2 font-manrope">
            {dealershipCopy.pricing.placeholderTitle}
          </h3>
          <p className="text-sm text-body leading-relaxed mb-6">
            {dealershipCopy.pricing.placeholderNotice} Untuk mendapatkan penawaran harga OTR terkini
            dan rincian diskon dealer, Anda dapat langsung menghubungi sales resmi kami.
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
