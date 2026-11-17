'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { EventItem, DealerLocationItem, EventStatus } from '@/types/events';
import {
  createEventAction,
  updateEventAction,
  toggleEventPublishAction,
  deleteEventAction,
} from '@/lib/events/actions';
import {
  getJakartaDateParts,
  jakartaToIsoString,
  formatJakartaDateRange,
} from '@/lib/events/timezone';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { createClient } from '@/lib/supabase/client';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface EventManagementViewProps {
  initialEvents: EventItem[];
  activeLocations: DealerLocationItem[];
}

type FilterStatus = 'all' | 'draft' | 'published';
type FilterTime = 'all' | 'upcoming' | 'past';

export function EventManagementView({ initialEvents, activeLocations }: EventManagementViewProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('17:00');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<EventStatus>('draft');

  // Poster upload state
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [posterUploadError, setPosterUploadError] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [timeFilter, setTimeFilter] = useState<FilterTime>('all');

  // Deletion Confirmation Modal State
  const [deletingRecord, setDeletingRecord] = useState<EventItem | null>(null);

  // Feedback & Transition State
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setLocationId(activeLocations[0]?.id || '');

    const now = new Date();
    const todayParts = getJakartaDateParts(now);
    const defaultDateStr = todayParts.dateKey;
    setStartDate(defaultDateStr);
    setStartTime('09:00');
    setEndDate(defaultDateStr);
    setEndTime('17:00');

    setImageUrl(null);
    setStatus('draft');
    setPosterUploadError(null);
    setFormError(null);
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (evt: EventItem) => {
    setEditingId(evt.id);
    setTitle(evt.title);
    setSlug(evt.slug);
    setDescription(evt.description);
    setLocationId(evt.locationId);

    const startParts = getJakartaDateParts(evt.startAt);
    const endParts = getJakartaDateParts(evt.endAt);

    setStartDate(startParts.dateKey);
    setStartTime(
      `${String(startParts.hours).padStart(2, '0')}:${String(startParts.minutes).padStart(2, '0')}`
    );
    setEndDate(endParts.dateKey);
    setEndTime(
      `${String(endParts.hours).padStart(2, '0')}:${String(endParts.minutes).padStart(2, '0')}`
    );

    setImageUrl(evt.imageUrl);
    setStatus(evt.status);
    setPosterUploadError(null);
    setFormError(null);
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId && !slug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPosterUploadError('Ukuran file poster maksimal 5 MB.');
      return;
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setPosterUploadError('Format gambar poster harus berupa JPG, PNG, atau WebP.');
      return;
    }

    setPosterUploadError(null);
    setIsUploadingPoster(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const cleanSlug =
        slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 30) || 'event-poster';
      const fileName = `${cleanSlug}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage.from('events').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) {
        setPosterUploadError(`Upload poster gagal: ${error.message}`);
      } else if (data) {
        setImageUrl(data.path);
      }
    } catch (err) {
      console.error('Upload poster error:', err);
      setPosterUploadError('Terjadi kesalahan saat mengunggah poster ke Supabase Storage.');
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);

    if (!startDate || !startTime || !endDate || !endTime) {
      setFormError('Jadwal mulai dan selesai acara wajib diisi.');
      return;
    }

    const startIso = jakartaToIsoString(startDate, startTime);
    const endIso = jakartaToIsoString(endDate, endTime);

    if (new Date(endIso) <= new Date(startIso)) {
      setFormError('Waktu selesai acara harus lebih lambat dari waktu mulai.');
      return;
    }

    if (!locationId) {
      setFormError('Pilih lokasi dealer penyelenggara.');
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await updateEventAction({
            id: editingId,
            title,
            slug,
            description,
            locationId,
            startAt: startIso,
            endAt: endIso,
            imageUrl,
            status,
          });

          if (!res.success) {
            setFormError(res.error || 'Gagal memperbarui acara.');
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            return;
          }

          if (res.data) {
            setEvents((prev) =>
              prev.map((evt) => (evt.id === editingId ? (res.data as EventItem) : evt))
            );
          }
          setSuccessMessage(dealershipCopy.adminEvents.saveSuccess);
          setIsEditing(false);
        } else {
          const res = await createEventAction({
            title,
            slug,
            description,
            locationId,
            startAt: startIso,
            endAt: endIso,
            imageUrl,
            status,
          });

          if (!res.success) {
            setFormError(res.error || 'Gagal menambahkan acara.');
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            return;
          }

          if (res.data) {
            setEvents((prev) => [res.data as EventItem, ...prev]);
          }
          setSuccessMessage(dealershipCopy.adminEvents.saveSuccess);
          setIsEditing(false);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan acara.');
      }
    });
  };

  const handleTogglePublish = (evt: EventItem) => {
    setActionError(null);
    setSuccessMessage(null);
    const newStatus: EventStatus = evt.status === 'published' ? 'draft' : 'published';

    startTransition(async () => {
      const res = await toggleEventPublishAction({
        id: evt.id,
        status: newStatus,
      });

      if (!res.success) {
        setActionError(res.error || 'Gagal mengubah status publikasi acara.');
        return;
      }

      setEvents((prev) =>
        prev.map((item) => (item.id === evt.id ? { ...item, status: newStatus } : item))
      );
      setSuccessMessage(
        newStatus === 'published'
          ? 'Acara berhasil dipublikasikan dan tayang di website publik.'
          : 'Acara dialihkan ke status Draf.'
      );
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingRecord) return;
    setActionError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await deleteEventAction(deletingRecord.id);

      if (!res.success) {
        setActionError(res.error || 'Gagal menghapus acara.');
        setDeletingRecord(null);
        return;
      }

      setEvents((prev) => prev.filter((item) => item.id !== deletingRecord.id));
      setSuccessMessage(dealershipCopy.adminEvents.deleteSuccess);
      setDeletingRecord(null);
    });
  };

  const [referenceTime] = useState(() => Date.now());

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.location?.name &&
          evt.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (evt.location?.city && evt.location.city.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'draft' && evt.status !== 'draft') return false;
      if (statusFilter === 'published' && evt.status !== 'published') return false;

      const eventEndMs = new Date(evt.endAt).getTime();
      if (timeFilter === 'upcoming' && eventEndMs < referenceTime) return false;
      if (timeFilter === 'past' && eventEndMs >= referenceTime) return false;

      return true;
    });
  }, [events, searchQuery, statusFilter, timeFilter, referenceTime]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-ink">
            {dealershipCopy.adminEvents.title}
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">{dealershipCopy.adminEvents.subtitle}</p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/events/locations"
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-body hover:text-ink border border-hairline hover:bg-neutral-2/50 transition-colors"
          >
            {dealershipCopy.adminDealerLocations.title} &rarr;
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="font-bold"
          >
            {dealershipCopy.adminEvents.createNew}
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border-l-4 border-primary text-primary text-xs sm:text-sm font-medium flex items-center justify-between"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-primary hover:opacity-80 font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <Card className="p-4 rounded-none border border-hairline bg-surface">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dealershipCopy.adminEvents.searchPlaceholder}
              aria-label="Cari judul acara"
              className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              aria-label="Filter status publikasi"
              className="px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{dealershipCopy.adminEvents.filterAllStatus}</option>
              <option value="published">{dealershipCopy.adminEvents.filterPublished}</option>
              <option value="draft">{dealershipCopy.adminEvents.filterDraft}</option>
            </select>

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as FilterTime)}
              aria-label="Filter periode waktu"
              className="px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Semua Waktu</option>
              <option value="upcoming">Mendatang / Berlangsung</option>
              <option value="past">Sudah Selesai</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Table of Events */}
      <div className="border border-hairline bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-2/50 border-b border-hairline text-muted uppercase font-semibold tracking-wider">
              <th className="p-3 w-16">{dealershipCopy.adminEvents.tableHeaderPoster}</th>
              <th className="p-3">{dealershipCopy.adminEvents.tableHeaderTitle}</th>
              <th className="p-3">{dealershipCopy.adminEvents.tableHeaderDateTime}</th>
              <th className="p-3">{dealershipCopy.adminEvents.tableHeaderLocation}</th>
              <th className="p-3">{dealershipCopy.adminEvents.tableHeaderStatus}</th>
              <th className="p-3 text-right">{dealershipCopy.adminEvents.tableHeaderActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  {dealershipCopy.adminEvents.emptyState}
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const posterUrl = getStorageImageUrl(evt.imageUrl, '', 'events');
                return (
                  <tr key={evt.id} className="hover:bg-neutral-2/30 transition-colors">
                    {/* Poster thumbnail */}
                    <td className="p-3">
                      {posterUrl ? (
                        <div className="w-12 h-12 relative bg-neutral-2 border border-hairline overflow-hidden">
                          <Image
                            src={posterUrl}
                            alt={evt.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-neutral-2 border border-hairline flex items-center justify-center text-[10px] text-muted">
                          No Pic
                        </div>
                      )}
                    </td>

                    {/* Title & Slug */}
                    <td className="p-3">
                      <div className="font-semibold text-ink">{evt.title}</div>
                      <div className="text-[11px] text-muted font-mono mt-0.5">{evt.slug}</div>
                    </td>

                    {/* Schedule */}
                    <td className="p-3 text-body whitespace-nowrap">
                      {formatJakartaDateRange(evt.startAt, evt.endAt)}
                    </td>

                    {/* Dealer Location */}
                    <td className="p-3 text-body">
                      {evt.location ? (
                        <div>
                          <span className="font-semibold">{evt.location.name}</span>
                          <span className="block text-[11px] text-muted">{evt.location.city}</span>
                        </div>
                      ) : (
                        <span className="text-muted italic">Lokasi belum ditentukan</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      {evt.status === 'published' ? (
                        <Badge variant="success">Dipublikasikan</Badge>
                      ) : (
                        <Badge variant="neutral">Draf</Badge>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(evt)}
                        disabled={isPending}
                        className={`text-[11px] font-semibold underline underline-offset-2 ${
                          evt.status === 'published'
                            ? 'text-muted hover:text-ink'
                            : 'text-emerald-700 hover:text-emerald-900'
                        }`}
                      >
                        {evt.status === 'published'
                          ? dealershipCopy.adminEvents.unpublishButton
                          : dealershipCopy.adminEvents.publishButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(evt)}
                        className="text-[11px] font-semibold text-body hover:text-ink underline underline-offset-2"
                      >
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingRecord(evt)}
                        className="text-[11px] font-semibold text-primary hover:opacity-80 underline underline-offset-2"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Create / Edit Modal Form */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-surface border border-hairline w-full max-w-2xl shadow-xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-hairline">
              <h2 id="event-form-modal-title" className="font-heading font-bold text-base text-ink">
                {editingId
                  ? dealershipCopy.adminEvents.formTitleEdit
                  : dealershipCopy.adminEvents.formTitleCreate}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-muted hover:text-ink font-bold text-lg p-1"
                aria-label="Tutup formulir"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border-l-4 border-primary text-primary text-xs font-medium"
                >
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminEvents.formTitle} <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={dealershipCopy.adminEvents.formTitlePlaceholder}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.title[0]}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminEvents.formSlug} <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder={dealershipCopy.adminEvents.formSlugPlaceholder}
                  className="w-full px-3 py-2 text-xs font-mono border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-muted mt-0.5">
                  {dealershipCopy.adminEvents.formSlugHelp}
                </p>
                {fieldErrors.slug && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.slug[0]}</p>
                )}
              </div>

              {/* Location Select */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminEvents.formLocation} <span className="text-primary">*</span>
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{dealershipCopy.adminEvents.formSelectLocation}</option>
                  {activeLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.city})
                    </option>
                  ))}
                </select>
                {activeLocations.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Belum ada lokasi dealer aktif. Silakan tambahkan lokasi dealer terlebih dahulu.
                  </p>
                )}
                {fieldErrors.locationId && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.locationId[0]}</p>
                )}
              </div>

              {/* Date & Time Pickers (Asia/Jakarta) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date & Time */}
                <div className="space-y-2 p-3 bg-neutral-2/30 border border-hairline">
                  <div className="text-xs font-bold text-ink">Jadwal Mulai (WIB)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted mb-0.5">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-hairline bg-canvas text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-0.5">Waktu</label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-hairline bg-canvas text-ink"
                      />
                    </div>
                  </div>
                </div>

                {/* End Date & Time */}
                <div className="space-y-2 p-3 bg-neutral-2/30 border border-hairline">
                  <div className="text-xs font-bold text-ink">Jadwal Selesai (WIB)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted mb-0.5">Tanggal</label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-hairline bg-canvas text-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-0.5">Waktu</label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-hairline bg-canvas text-ink"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminEvents.formDescription}{' '}
                  <span className="text-primary">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={dealershipCopy.adminEvents.formDescriptionPlaceholder}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {fieldErrors.description && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.description[0]}</p>
                )}
              </div>

              {/* Poster Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminEvents.formPoster}
                </label>
                <p className="text-[11px] text-muted mb-2">
                  {dealershipCopy.adminEvents.formPosterHelp}
                </p>

                {posterUploadError && (
                  <p className="text-[11px] text-primary mb-2">{posterUploadError}</p>
                )}

                <div className="flex items-start space-x-4">
                  {imageUrl ? (
                    <div className="relative w-24 h-24 border border-hairline bg-neutral-2 overflow-hidden shrink-0">
                      <Image
                        src={getStorageImageUrl(imageUrl, '', 'events')}
                        alt="Preview Poster"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl(null)}
                        className="absolute top-1 right-1 bg-ink/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-ink"
                        title={dealershipCopy.adminEvents.removePoster}
                      >
                        &times;
                      </button>
                    </div>
                  ) : null}

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={isUploadingPoster || isPending}
                      className="block w-full text-xs text-body file:mr-3 file:py-1.5 file:px-3 file:border file:border-hairline file:text-xs file:font-semibold file:bg-surface hover:file:bg-neutral-2 file:text-ink cursor-pointer"
                    />
                    {isUploadingPoster && (
                      <p className="text-[11px] text-muted mt-1 animate-pulse">
                        {dealershipCopy.adminEvents.uploadingPoster}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminEvents.formStatus}
                </label>
                <div className="flex items-center space-x-4 text-xs font-medium">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="event-status"
                      value="draft"
                      checked={status === 'draft'}
                      onChange={() => setStatus('draft')}
                      className="accent-primary"
                    />
                    <span>Draf (Hanya Admin)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="event-status"
                      value="published"
                      checked={status === 'published'}
                      onChange={() => setStatus('published')}
                      className="accent-primary"
                    />
                    <span className="text-emerald-700 font-bold">Dipublikasikan (Publik)</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending || isUploadingPoster}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending || isUploadingPoster}
                  className="font-bold"
                >
                  {isPending
                    ? dealershipCopy.adminEvents.savingButton
                    : dealershipCopy.adminEvents.saveButton}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deletingRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface border border-hairline w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 id="delete-event-modal-title" className="font-heading font-bold text-base text-ink">
              {dealershipCopy.adminEvents.deleteConfirmTitle}
            </h3>
            <p className="text-xs text-body leading-relaxed">
              {dealershipCopy.adminEvents.deleteConfirmMessage}
            </p>
            <div className="p-3 bg-neutral-2/50 border border-hairline text-xs font-medium text-ink">
              <strong>{deletingRecord.title}</strong>
              <span className="block text-[11px] text-muted font-mono mt-0.5">
                {deletingRecord.slug}
              </span>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingRecord(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="bg-primary text-on-primary font-bold hover:bg-primary/90"
              >
                {isPending ? 'Menghapus...' : dealershipCopy.adminEvents.deleteButton}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
