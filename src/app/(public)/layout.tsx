import React from 'react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { getSiteSettings } from '@/lib/settings/queries';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-ink">
      <PublicHeader settings={settings} />
      <main className="flex-1 w-full">{children}</main>
      <PublicFooter settings={settings} />
    </div>
  );
}
