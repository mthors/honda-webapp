import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminEvents, getActiveDealerLocations } from '@/lib/events/queries';
import { EventManagementView } from '@/components/admin/events/EventManagementView';

export const metadata: Metadata = {
  title: 'Manajemen Acara | Admin Honda Satrya Dealer Group',
  description: 'Kelola jadwal acara, pameran, dan kegiatan promosi dealer Honda Satrya.',
};

export default async function AdminEventsPage() {
  await requireAdmin();

  const [events, activeLocations] = await Promise.all([
    getAdminEvents(),
    getActiveDealerLocations(),
  ]);

  return <EventManagementView initialEvents={events} activeLocations={activeLocations} />;
}
