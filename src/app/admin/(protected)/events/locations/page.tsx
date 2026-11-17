import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminDealerLocations } from '@/lib/events/queries';
import { DealerLocationManagementView } from '@/components/admin/events/DealerLocationManagementView';

export const metadata: Metadata = {
  title: 'Lokasi Dealer Acara | Admin Honda Satrya Dealer Group',
  description: 'Kelola daftar cabang dan lokasi dealer resmi penyelenggara acara.',
};

export default async function AdminDealerLocationsPage() {
  await requireAdmin();

  const locations = await getAdminDealerLocations();

  return <DealerLocationManagementView initialLocations={locations} />;
}
