import React from 'react';
import type { Metadata } from 'next';
import { getAdminMotorcycleModels, getAdminCategoriesAndColors } from '@/lib/motorcycles/queries';
import { MotorcycleManagementView } from '@/components/admin/motorcycles/MotorcycleManagementView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pengelolaan Katalog Motor — Admin Honda Satrya Dealer Group',
  description: 'Manajemen model sepeda motor, varian tipe, warna, dan galeri visual showroom.',
};

export default async function AdminMotorcyclesPage() {
  const [models, { categories, colors }] = await Promise.all([
    getAdminMotorcycleModels(),
    getAdminCategoriesAndColors(),
  ]);

  return (
    <MotorcycleManagementView
      initialModels={models}
      categories={categories}
      colors={colors}
    />
  );
}

