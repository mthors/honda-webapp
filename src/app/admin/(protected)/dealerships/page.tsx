import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getDealerships } from '@/lib/settings/queries';
import { DealershipManagementView } from '@/components/admin/dealerships/DealershipManagementView';

export const metadata = {
  title: 'Kelola Jaringan Dealer — Admin Honda Satrya Dealer Group',
  description: 'Manajemen entitas showroom dealer yang tergabung dalam Honda Satrya Dealer Group.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDealershipsPage() {
  await requireAdmin();

  const dealerships = await getDealerships();

  return <DealershipManagementView initialDealerships={dealerships} />;
}
