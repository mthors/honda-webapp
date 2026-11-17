'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { EventItem } from '@/types/events';
import { formatJakartaDateRange } from '@/lib/events/timezone';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { dealershipCopy } from '@/content/copy/id';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EventDetailModal } from './EventDetailModal';

interface UpcomingEventsSectionProps {
  upcomingEvents: EventItem[];
}

export function UpcomingEventsSection({ upcomingEvents }: UpcomingEventsSectionProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-surface border border-hairline p-8 text-center space-y-2">
        <h3 className="font-heading font-bold text-base text-ink">
          {dealershipCopy.events.upcomingEvents}
        </h3>
        <p className="text-xs text-muted max-w-md mx-auto">{dealershipCopy.events.emptyUpcoming}</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="upcoming-events-title" className="space-y-6">
      <div className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div>
          <h2
            id="upcoming-events-title"
            className="font-heading font-bold text-xl sm:text-2xl text-ink"
          >
            {dealershipCopy.events.upcomingEvents}
          </h2>
          <p className="text-xs sm:text-sm text-body mt-0.5">
            Jadwal kegiatan showroom resmi, pameran publik, dan sesi uji kendara terdekat.
          </p>
        </div>
        <span className="text-xs font-semibold text-muted">
          {upcomingEvents.length} Acara Terjadwal
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upcomingEvents.map((evt) => {
          const posterUrl = getStorageImageUrl(evt.imageUrl, '', 'events');
          return (
            <Card
              key={evt.id}
              className="flex flex-col justify-between border border-hairline bg-surface rounded-none overflow-hidden hover:border-primary/50 transition-colors shadow-xs group"
            >
              <div>
                {/* Poster or Fallback banner */}
                <div className="w-full h-44 relative bg-neutral-2 overflow-hidden border-b border-hairline">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={evt.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-2 text-muted text-xs p-4 text-center">
                      <svg
                        className="w-8 h-8 text-muted/40 mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Agenda Showroom Honda</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="text-xs font-semibold text-primary">
                    {formatJakartaDateRange(evt.startAt, evt.endAt)}
                  </div>

                  <h3 className="font-heading font-bold text-base text-ink group-hover:text-primary transition-colors line-clamp-2">
                    {evt.title}
                  </h3>

                  {evt.location && (
                    <div className="text-xs text-muted space-y-0.5">
                      <div className="font-semibold text-ink flex items-center space-x-1">
                        <svg
                          className="w-3.5 h-3.5 text-primary shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        <span>{evt.location.name}</span>
                      </div>
                      <p className="text-[11px] pl-4">{evt.location.city}</p>
                    </div>
                  )}

                  <p className="text-xs text-body line-clamp-3 leading-relaxed">
                    {evt.description}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedEvent(evt)}
                  className="w-full font-bold text-xs"
                >
                  {dealershipCopy.events.viewDetails}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedEvent && (
        <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </section>
  );
}
