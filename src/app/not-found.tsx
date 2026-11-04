import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dealershipCopy } from '@/content/copy/id';

export const metadata: Metadata = {
  title: '404: Halaman Tidak Ditemukan — Honda Satrya Dealer Group',
  description:
    'Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan. Silakan kembali ke beranda atau lihat katalog sepeda motor kami.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootNotFound() {
  return (
    <div className="py-20 sm:py-28">
      <Container>
        <Card
          variant="neutral"
          padding="lg"
          className="max-w-lg mx-auto text-center border border-hairline py-12 px-6 sm:px-10"
        >
          <span className="text-4xl sm:text-5xl font-extrabold text-muted block mb-3 font-manrope">
            404
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-manrope mb-3">
            {dealershipCopy.common.notFound}
          </h1>
          <p className="text-sm text-body leading-relaxed mb-8">
            Halaman yang Anda tuju tidak ditemukan, telah dipindahkan, atau alamat URL yang
            dimasukkan tidak sesuai.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button variant="primary" size="md">
                {dealershipCopy.common.backToHome}
              </Button>
            </Link>
            <Link href="/motor">
              <Button variant="outline" size="md">
                Lihat Katalog Motor
              </Button>
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
