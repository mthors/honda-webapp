'use client';

import React, { useEffect } from 'react';

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Layout Error caught]:', {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-neutral-1 text-ink flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-canvas border border-hairline p-8 rounded-xs text-center shadow-xs">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">Terjadi Gangguan Sistem</h1>
          <p className="text-sm text-body leading-relaxed mb-6">
            Aplikasi mengalami kendala teknis saat memuat tata letak utama. Silakan muat ulang
            halaman.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xs hover:bg-primary-dark transition-colors cursor-pointer"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </body>
    </html>
  );
}
