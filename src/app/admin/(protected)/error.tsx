'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminProtectedError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error('[Admin Protected Error Boundary caught an unhandled error]:', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="py-12 px-4 max-w-xl mx-auto">
      <Card
        variant="neutral"
        padding="lg"
        className="border border-hairline text-center py-10 px-6"
      >
        <div className="w-12 h-12 bg-status-error/10 text-status-error rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg font-mono">
          !
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-ink mb-2 font-manrope">
          Kendala Memuat Panel Administrator
        </h1>
        <p className="text-xs sm:text-sm text-body leading-relaxed mb-6">
          Terjadi kesalahan saat memuat data atau memproses permintaan pada panel ini. Silakan coba
          muat ulang atau kembali ke dasbor utama.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="sm" onClick={() => reset()}>
            Coba Lagi
          </Button>
          <Link href="/admin">
            <Button variant="outline" size="sm">
              Kembali ke Dasbor
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
