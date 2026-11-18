'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { EventItem } from '@/types/events';
import { DAYS_OF_WEEK, buildMonthCalendarGrid } from '@/lib/events/calendar';
import {
  getJakartaDateParts,
  formatJakartaDate,
  formatJakartaDateRange,
  formatJakartaTime,
} from '@/lib/events/timezone';
import { dealershipCopy } from '@/content/copy/id';

export interface FloatingEventWidgetProps {
  events?: EventItem[];
  defaultOpen?: boolean;
}

export function FloatingEventWidget({
  events = [],
  defaultOpen = false,
}: FloatingEventWidgetProps) {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  // Filter only published events
  const publishedEvents = useMemo(() => {
    return (events || []).filter((e) => e.status === 'published');
  }, [events]);

  const now = useMemo(() => new Date(), []);
  const nowParts = useMemo(() => getJakartaDateParts(now), [now]);

  // Current viewed month & year
  const [viewYear, setViewYear] = useState<number>(nowParts.year);
  const [viewMonth, setViewMonth] = useState<number>(nowParts.month); // 1-12

  // Selected date key (default to today)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(nowParts.dateKey);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1);
      setViewMonth(12);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1);
      setViewMonth(1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleResetToToday = () => {
    setViewYear(nowParts.year);
    setViewMonth(nowParts.month);
    setSelectedDateKey(nowParts.dateKey);
  };

  // Build calendar month grid
  const monthCells = useMemo(() => {
    return buildMonthCalendarGrid(viewYear, viewMonth, publishedEvents, now);
  }, [viewYear, viewMonth, publishedEvents, now]);

  // Month title formatted in Indonesian
  const monthTitle = useMemo(() => {
    const d = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
    return formatJakartaDate(d, { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  // Events on selected date
  const selectedDayCell = useMemo(() => {
    return monthCells.find((c) => c.dateKey === selectedDateKey);
  }, [monthCells, selectedDateKey]);

  const selectedDateFormatted = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    return formatJakartaDate(dateObj, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDateKey]);

  const selectedEvents = selectedDayCell?.events || [];

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        id="floating-event-widget-trigger"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="floating-event-widget-panel"
        aria-label={
          isOpen
            ? dealershipCopy.events.floatingWidgetAriaClose
            : dealershipCopy.events.floatingWidgetAriaOpen
        }
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:right-6 sm:bottom-6 z-40 bg-primary text-on-primary hover:bg-primary-hover shadow-lg hover:shadow-xl rounded-full px-3.5 py-3 sm:px-5 sm:py-3 flex items-center justify-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 motion-reduce:transition-none cursor-pointer"
      >
        {/* Calendar Icon */}
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="hidden sm:inline font-bold text-sm tracking-tight font-manrope">
          {dealershipCopy.events.floatingTriggerLabel}
        </span>
        {publishedEvents.length > 0 && (
          <span
            className="w-2 h-2 rounded-full bg-canvas animate-pulse shrink-0"
            title={`${publishedEvents.length} acara`}
          />
        )}
      </button>

      {/* Calendar Panel Dialog */}
      <div
        ref={panelRef}
        id="floating-event-widget-panel"
        role="dialog"
        aria-modal="false"
        aria-label={dealershipCopy.events.floatingTriggerLabel}
        className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 right-3 sm:left-auto sm:right-6 sm:bottom-20 z-50 sm:w-[380px] bg-canvas border border-hairline shadow-2xl rounded-none flex flex-col max-h-[min(620px,calc(100vh-6.5rem))] transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
          isOpen
            ? 'opacity-100 translate-y-0 visible pointer-events-auto'
            : 'opacity-0 translate-y-2 invisible pointer-events-none'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-primary shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-sm font-bold text-ink font-manrope">
              {dealershipCopy.events.floatingTriggerLabel}
            </h2>
          </div>

          <button
            type="button"
            aria-label={dealershipCopy.events.floatingWidgetAriaClose}
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-muted hover:text-ink hover:bg-neutral-2 transition-colors rounded-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4 space-y-4">
          {/* Month Navigation & Title */}
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <div>
              <span className="text-xs sm:text-sm font-bold text-ink capitalize font-manrope">
                {monthTitle}
              </span>
              <span className="text-[10px] text-muted block">WIB (Asia/Jakarta)</span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleResetToToday}
                className="px-2 py-0.5 text-[11px] font-semibold text-body hover:text-ink border border-hairline hover:bg-neutral-2 transition-colors rounded-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {dealershipCopy.events.today}
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label={dealershipCopy.events.previousMonth}
                className="w-7 h-7 flex items-center justify-center border border-hairline text-ink hover:bg-neutral-2 transition-colors rounded-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label={dealershipCopy.events.nextMonth}
                className="w-7 h-7 flex items-center justify-center border border-hairline text-ink hover:bg-neutral-2 transition-colors rounded-none focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.key}
                className="py-0.5 text-[11px] font-bold text-muted uppercase tracking-wider"
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Kalender Acara">
            {monthCells.map((cell) => {
              const isSelected = cell.dateKey === selectedDateKey;
              const hasEvents = cell.events.length > 0;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  aria-label={`${cell.dayNumber} ${cell.isCurrentMonth ? '' : '(bulan lain)'}, ${cell.events.length} acara`}
                  aria-pressed={isSelected}
                  className={`h-9 sm:h-10 p-1 flex flex-col items-center justify-between border transition-all text-center relative focus:outline-none focus:ring-1 focus:ring-primary rounded-none cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 font-bold text-ink'
                      : cell.isToday
                        ? 'border-primary/50 bg-neutral-2/40 text-primary font-bold'
                        : 'border-hairline/60 hover:bg-neutral-2 text-body'
                  } ${!cell.isCurrentMonth ? 'opacity-35' : ''}`}
                >
                  <span className="text-[11px] leading-none mt-0.5">{cell.dayNumber}</span>

                  <div className="flex items-center space-x-0.5 h-2">
                    {hasEvents && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                        title={`${cell.events.length} acara`}
                      />
                    )}
                    {cell.isToday && !hasEvents && (
                      <span
                        className="w-1 h-1 rounded-full bg-neutral-3 shrink-0"
                        title="Hari Ini"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Header & Event List */}
          <div className="border-t border-hairline pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                {dealershipCopy.events.selectedDateHeader}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-ink capitalize font-manrope">
              {selectedDateFormatted}
            </h3>

            {/* Event List or Empty State */}
            {selectedEvents.length === 0 ? (
              <div className="py-4 text-center text-muted text-xs space-y-1 bg-neutral-2/20 border border-dashed border-hairline p-3">
                <p className="font-semibold text-body">{dealershipCopy.events.emptyDateEvents}</p>
                <p className="text-[11px] text-muted">{dealershipCopy.events.selectDatePrompt}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 bg-surface border border-hairline space-y-1.5 rounded-none hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start space-x-2.5">
                      {evt.imageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={evt.imageUrl}
                          alt={evt.title}
                          className="w-12 h-12 object-cover shrink-0 rounded-none border border-hairline bg-neutral-2"
                        />
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-xs font-bold text-ink leading-snug line-clamp-2 font-manrope">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-primary font-semibold">
                          {formatJakartaDateRange(evt.startAt, evt.endAt)}
                          {evt.startAt && (
                            <span className="text-muted font-normal ml-1">
                              • {formatJakartaTime(evt.startAt)}
                            </span>
                          )}
                        </p>
                        {evt.dealership && (
                          <p className="text-[10px] text-muted truncate">
                            📍 {evt.dealership.name}, {evt.dealership.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-end border-t border-hairline/60">
                      <Link
                        href={`/events/${evt.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] font-bold text-primary hover:underline inline-flex items-center space-x-0.5"
                      >
                        <span>{dealershipCopy.events.viewDetails}</span>
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Footer */}
        <div className="px-4 py-2.5 border-t border-hairline bg-surface text-center">
          <Link
            href="/events"
            onClick={() => setIsOpen(false)}
            className="text-xs font-bold text-primary hover:underline inline-flex items-center space-x-1"
          >
            <span>{dealershipCopy.events.viewAllEvents}</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </>
  );
}
