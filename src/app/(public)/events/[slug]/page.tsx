import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicEventBySlug } from '@/lib/events/queries';
import { formatJakartaDateRange } from '@/lib/events/timezone';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { Container } from '@/components/ui/Container';
import { dealershipCopy } from '@/content/copy/id';

interface EventDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    return {
      title: 'Acara Tidak Ditemukan | Honda Satrya Dealer Group',
    };
  }

  return {
    title: `${event.title} | Agenda Acara Honda Satrya`,
    description: event.description.slice(0, 160),
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    notFound();
    return null;
  }

  const posterUrl = getStorageImageUrl(event.imageUrl, '', 'events');

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
            <li>
              <Link href="/events" className="hover:text-primary transition-colors">
                {dealershipCopy.nav.events}
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-ink truncate max-w-xs" aria-current="page">
              {event.title}
            </li>
          </ol>
        </nav>

        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/events"
            className="inline-flex items-center text-xs font-bold text-primary hover:underline underline-offset-4"
          >
            &larr; Kembali ke {dealershipCopy.events.calendarTitle}
          </Link>
        </div>

        {/* Event Detail Layout */}
        <article className="bg-surface border border-hairline overflow-hidden shadow-xs">
          {/* Poster Hero (if available) */}
          {posterUrl && (
            <div className="w-full h-64 sm:h-96 relative bg-neutral-2 border-b border-hairline">
              <Image
                src={posterUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-8">
            {/* Header info */}
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-primary uppercase tracking-wider">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatJakartaDateRange(event.startAt, event.endAt)}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold font-heading text-ink leading-tight">
                {event.title}
              </h1>
            </div>

            {/* Dealership Location Card */}
            {(event.dealership || event.location) && (
              <div className="p-5 bg-neutral-2/40 border-l-4 border-primary space-y-2">
                <div className="text-xs font-bold text-ink uppercase tracking-wider">
                  {dealershipCopy.events.locationLabel}
                </div>
                <div className="text-base font-bold text-ink">
                  {(event.dealership || event.location)?.name}
                </div>
                <div className="text-xs sm:text-sm text-body">
                  {(event.dealership || event.location)?.address}
                </div>
                <div className="text-xs text-muted pt-1">
                  <span className="font-semibold text-ink">Wilayah:</span>{' '}
                  {(event.dealership || event.location)?.city}
                  {(event.dealership || event.location)?.phone && (
                    <span className="ml-4">
                      <span className="font-semibold text-ink">Telepon:</span>{' '}
                      {(event.dealership || event.location)?.phone}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-3 pt-4 border-t border-hairline">
              <h2 className="text-xs uppercase font-bold tracking-wider text-muted">
                Deskripsi Lengkap Acara
              </h2>
              <div className="text-xs sm:text-base text-body leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>
          </div>
        </article>
      </Container>
    </div>
  );
}
