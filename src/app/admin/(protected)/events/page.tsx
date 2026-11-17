import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/admin';
import { getAdminEvents } from '@/lib/events/queries';
import { getActiveDealerships } from '@/lib/settings/queries';
import { EventManagementView } from '@/components/admin/events/EventManagementView';

export const metadata: Metadata = {
  title: 'Manajemen Acara | Admin Honda Satrya Dealer Group',
  description: 'Kelola jadwal acara, pameran, dan kegiatan promosi dealer Honda Satrya.',
};

export default async function AdminEventsPage() {
  await requireAdmin();

  const [events, activeDealerships] = await Promise.all([
    getAdminEvents(),
    getActiveDealerships(),
  ]);

  return <EventManagementView initialEvents={events} activeDealerships={activeDealerships} />;
}
