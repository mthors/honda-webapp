import React from 'react';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminPromotions, getMotorcycleOptionsForAdmin } from '@/lib/admin/queries';
import { PromotionManagementView } from '@/components/admin/promotions/PromotionManagementView';

export const metadata = {
  title: 'Kelola Promo — Admin Honda Satrya Dealer Group',
  description: 'Pengelolaan program promo, syarat & ketentuan, dan jadwal promosi.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPromoPage() {
  await requireAdmin();

  const [promotions, modelOptions] = await Promise.all([
    getAdminPromotions(),
    getMotorcycleOptionsForAdmin(),
  ]);

  return <PromotionManagementView initialPromotions={promotions} modelOptions={modelOptions} />;
}
