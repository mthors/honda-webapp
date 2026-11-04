import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getSiteSettings, getDealerships } from '@/lib/settings/queries';
import { SettingsManagementView } from '@/components/admin/settings/SettingsManagementView';

export const metadata = {
  title: 'Pengaturan Grup Dealer — Admin Honda Satrya Dealer Group',
  description: 'Pengelolaan identitas, kontak sentral, dan kebijakan privasi grup dealer.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [settings, dealerships] = await Promise.all([getSiteSettings(), getDealerships()]);

  return <SettingsManagementView initialSettings={settings} dealerships={dealerships} />;
}
