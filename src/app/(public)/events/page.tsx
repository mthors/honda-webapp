import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicEvents, getPublicUpcomingEvents } from '@/lib/events/queries';
import { EventCalendarView } from '@/components/public/events/EventCalendarView';
import { UpcomingEventsSection } from '@/components/public/events/UpcomingEventsSection';
import { Container } from '@/components/ui/Container';
import { dealershipCopy } from '@/content/copy/id';

export const metadata: Metadata = {
  title: 'Agenda Kegiatan & Acara | Honda Satrya Dealer Group',
  description:
    'Jadwal pameran sepeda motor Honda, test ride, dan agenda promo eksklusif Honda Satrya Dealer Group di Sidoarjo, Surabaya, dan sekitarnya.',
};

export default async function PublicEventsPage() {
  const [allEvents, upcomingEvents] = await Promise.all([
    getPublicEvents(),
    getPublicUpcomingEvents(),
  ]);

  return (
    <div className="bg-canvas text-ink min-h-screen py-8 sm:py-12">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-xs text-muted">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                {dealershipCopy.catalog.breadcrumbHome}
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-ink" aria-current="page">
              {dealershipCopy.nav.events}
            </li>
          </ol>
        </nav>

        {/* Page Header */}
        <header className="mb-10 space-y-2 border-b border-hairline pb-6">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">
            Agenda Dealer Resmi
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold font-heading text-ink tracking-tight">
            {dealershipCopy.events.title}
          </h1>
          <p className="text-xs sm:text-base text-body max-w-2xl leading-relaxed">
            {dealershipCopy.events.subtitle}
          </p>
        </header>

        {/* Main Content Layout */}
        <div className="space-y-16">
          {/* Section 1: Monthly Calendar Interface */}
          <section aria-label={dealershipCopy.events.calendarTitle}>
            <EventCalendarView events={allEvents} />
          </section>

          {/* Section 2: Upcoming Events List */}
          <UpcomingEventsSection upcomingEvents={upcomingEvents} />
        </div>
      </Container>
    </div>
  );
}
