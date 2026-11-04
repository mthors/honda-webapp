'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dealershipCopy } from '@/content/copy/id';

export interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    // Log unexpected errors safely on client console without leaking sensitive credentials
    console.error('[Root Error Boundary caught an unhandled error]:', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="py-20 sm:py-28">
      <Container>
        <Card
          variant="neutral"
          padding="lg"
          className="max-w-lg mx-auto text-center border border-hairline py-12 px-6 sm:px-10"
        >
          <div className="w-14 h-14 bg-status-error/10 text-status-error rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl font-manrope">
            !
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-manrope mb-3">
            Terjadi Kendala pada Sistem
          </h1>
          <p className="text-sm text-body leading-relaxed mb-8">
            {dealershipCopy.common.serverError}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" size="md" onClick={() => reset()}>
              Muat Ulang Halaman
            </Button>
            <Link href="/">
              <Button variant="outline" size="md">
                {dealershipCopy.common.backToHome}
              </Button>
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-hairline">
            <p className="text-xs text-muted">
              Butuh bantuan segera?{' '}
              <Link href="/hubungi" className="text-primary hover:underline font-medium">
                Hubungi Layanan Kontak Kami
              </Link>
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
