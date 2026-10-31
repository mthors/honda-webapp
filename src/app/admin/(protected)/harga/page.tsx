import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminPriceEntries, getMotorcycleOptionsForAdmin } from '@/lib/admin/queries';
import { PriceManagementView } from '@/components/admin/pricing/PriceManagementView';

export const metadata = {
  title: 'Kelola Harga OTR — Admin Honda Satrya Dealer Group',
  description: 'Pengelolaan daftar tarif dan harga OTR motor Honda.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHargaPage() {
  await requireAdmin();

  const [entries, modelOptions] = await Promise.all([
    getAdminPriceEntries(),
    getMotorcycleOptionsForAdmin(),
  ]);

  return <PriceManagementView initialEntries={entries} modelOptions={modelOptions} />;
}
