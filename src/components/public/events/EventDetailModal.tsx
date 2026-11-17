'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import type { EventItem } from '@/types/events';
import { formatJakartaDateRange } from '@/lib/events/timezone';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  useEffect(() => {
    if (!event) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  if (!event) return null;

  const posterUrl = getStorageImageUrl(event.imageUrl, '', 'events');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-event-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-surface border border-hairline w-full max-w-xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header Bar with Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-hairline bg-canvas">
          <span className="text-xs uppercase font-bold tracking-wider text-primary">
            {dealershipCopy.events.eventDetailTitle}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink font-bold text-xl p-1 leading-none focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label={dealershipCopy.events.closeModal}
          >
            &times;
          </button>
        </div>

        {/* Poster Image (if available) */}
        {posterUrl && (
          <div className="w-full h-56 sm:h-72 relative bg-neutral-2 border-b border-hairline">
            <Image
              src={posterUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 600px"
              priority
            />
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div>
            <h2
              id="modal-event-title"
              className="font-heading font-bold text-xl sm:text-2xl text-ink leading-tight"
            >
              {event.title}
            </h2>
            <div className="mt-2 inline-flex items-center space-x-2 text-xs font-semibold text-primary">
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
          </div>

          {/* Dealership Location Box */}
          {event.location && (
            <div className="p-4 bg-neutral-2/40 border-l-4 border-primary space-y-1">
              <div className="text-xs font-bold text-ink uppercase tracking-wider">
                {dealershipCopy.events.locationLabel}
              </div>
              <div className="text-sm font-bold text-ink">{event.location.name}</div>
              <div className="text-xs text-body leading-relaxed">{event.location.address}</div>
              {event.location.phone && (
                <div className="text-xs text-muted pt-1">
                  <span className="font-semibold text-ink">Telepon:</span> {event.location.phone}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-muted">
              Deskripsi Kegiatan
            </h3>
            <div className="text-xs sm:text-sm text-body leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-hairline flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-none font-semibold"
            >
              {dealershipCopy.common.close}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
