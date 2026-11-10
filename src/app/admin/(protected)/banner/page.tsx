import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminHeroBanners } from '@/lib/admin/queries';
import { BannerManagementView } from '@/components/admin/banners/BannerManagementView';

export const metadata = {
  title: 'Kelola Spanduk Promosi — Admin Honda Satrya Dealer Group',
  description: 'Pengelolaan spanduk grafis promosi digital showroom Honda Satrya Dealer Group.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminBannerPage() {
  await requireAdmin();

  const banners = await getAdminHeroBanners();

  return <BannerManagementView initialBanners={banners} />;
}
