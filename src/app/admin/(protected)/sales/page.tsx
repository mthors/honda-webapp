import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getSalesManagementData } from '@/lib/sales/queries';
import { SalesManagementView } from '@/components/admin/sales/SalesManagementView';

export const metadata = {
  title: 'Kelola Tim Sales & Wilayah Layanan — Admin Honda Satrya Dealer Group',
  description:
    'Manajemen tenaga penjual (sales) resmi per cabang dealer dan pemetaan cakupan wilayah layanan antar kota/kabupaten.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSalesPage() {
  await requireAdmin();

  const data = await getSalesManagementData();

  return (
    <SalesManagementView
      initialDealerships={data.dealerships}
      initialProvinces={data.provinces}
      initialRegencies={data.regencies}
      initialServiceAreas={data.serviceAreas}
      initialSalesReps={data.salesReps}
    />
  );
}
