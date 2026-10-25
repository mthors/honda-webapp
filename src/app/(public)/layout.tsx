import React from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <PublicHeader />
      <main className="flex-1 w-full">{children}</main>
      <PublicFooter />
    </div>
  );
}
