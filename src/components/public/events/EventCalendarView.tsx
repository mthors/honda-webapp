'use client';

import React, { useState, useMemo } from 'react';
import type { EventItem } from '@/types/events';
import { DAYS_OF_WEEK, buildMonthCalendarGrid } from '@/lib/events/calendar';
import {
  getJakartaDateParts,
  formatJakartaDate,
  formatJakartaDateRange,
} from '@/lib/events/timezone';
import { dealershipCopy } from '@/content/copy/id';
import { EventDetailModal } from './EventDetailModal';

interface EventCalendarViewProps {
  events: EventItem[];
}

export function EventCalendarView({ events }: EventCalendarViewProps) {
  const now = useMemo(() => new Date(), []);
  const nowParts = useMemo(() => getJakartaDateParts(now), [now]);

  // Current viewed month & year
  const [viewYear, setViewYear] = useState<number>(nowParts.year);
  const [viewMonth, setViewMonth] = useState<number>(nowParts.month); // 1-12

  // Selected date key (default to today)
  const [selectedDateKey, setSelectedDateKey] = useState<string>(nowParts.dateKey);

  // Active modal event
  const [selectedModalEvent, setSelectedModalEvent] = useState<EventItem | null>(null);

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

  // Build month cells
  const monthCells = useMemo(() => {
    return buildMonthCalendarGrid(viewYear, viewMonth, events, now);
  }, [viewYear, viewMonth, events, now]);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            1. Calendar Grid (7 Cols on desktop)
           ========================================================================= */}
        <div className="lg:col-span-7 bg-surface border border-hairline p-4 sm:p-6 shadow-xs">
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-ink capitalize">
                {monthTitle}
              </h2>
              <span className="text-[11px] text-muted">Waktu Indonesia Barat (WIB)</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResetToToday}
                className="px-2.5 py-1 text-xs font-semibold text-body hover:text-ink border border-hairline hover:bg-neutral-2/50 transition-colors"
              >
                {dealershipCopy.events.today}
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label={dealershipCopy.events.previousMonth}
                className="w-8 h-8 flex items-center justify-center border border-hairline text-ink hover:bg-neutral-2/50 transition-colors"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label={dealershipCopy.events.nextMonth}
                className="w-8 h-8 flex items-center justify-center border border-hairline text-ink hover:bg-neutral-2/50 transition-colors"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.key}
                className="py-1 text-xs font-bold text-muted uppercase tracking-wider"
              >
                {day.label}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1">
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
                  className={`min-h-[52px] sm:min-h-[64px] p-1.5 flex flex-col justify-between border transition-all text-left relative focus:outline-none focus:ring-1 focus:ring-primary ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : cell.isToday
                        ? 'border-primary/40 bg-neutral-2/40'
                        : 'border-hairline/60 hover:bg-neutral-2/40'
                  } ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold leading-none ${
                        cell.isToday
                          ? 'text-primary font-bold'
                          : isSelected
                            ? 'text-ink font-bold'
                            : 'text-body'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Hari Ini" />
                    )}
                  </div>

                  {/* Event Marker indicator */}
                  {hasEvents && (
                    <div className="w-full mt-1">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
                        <span className="text-[10px] font-bold text-primary truncate hidden sm:inline">
                          {cell.events.length > 1 ? `${cell.events.length} Acara` : '1 Acara'}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            2. Selected Date Event List (5 Cols on desktop)
           ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-hairline p-5 shadow-xs">
            <div className="border-b border-hairline pb-3 mb-4">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                {dealershipCopy.events.selectedDateHeader}
              </span>
              <h3 className="text-sm sm:text-base font-bold font-heading text-ink capitalize mt-0.5">
                {selectedDateFormatted}
              </h3>
            </div>

            {selectedEvents.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs space-y-1">
                <svg
                  className="w-8 h-8 mx-auto text-muted/50 mb-2"
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
                <p className="font-semibold text-body">{dealershipCopy.events.emptyDateEvents}</p>
                <p className="text-[11px]">{dealershipCopy.events.selectDatePrompt}</p>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-hairline">
                {selectedEvents.map((evt) => (
                  <div key={evt.id} className="pt-3 first:pt-0 space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-ink font-heading leading-snug">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-primary font-semibold mt-1">
                        {formatJakartaDateRange(evt.startAt, evt.endAt)}
                      </p>
                    </div>

                    {evt.location && (
                      <div className="text-xs text-muted flex items-start space-x-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5"
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
                        <span>
                          <strong className="text-ink">{evt.location.name}</strong> —{' '}
                          {evt.location.city}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-body line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>

                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedModalEvent(evt)}
                        className="inline-flex items-center text-xs font-bold text-primary hover:underline underline-offset-4"
                      >
                        {dealershipCopy.events.viewDetails} &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Event Detail Modal */}
      {selectedModalEvent && (
        <EventDetailModal event={selectedModalEvent} onClose={() => setSelectedModalEvent(null)} />
      )}
    </div>
  );
}
