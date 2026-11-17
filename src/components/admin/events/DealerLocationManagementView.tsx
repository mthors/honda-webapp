'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import type { DealerLocationItem } from '@/types/events';
import {
  createDealerLocationAction,
  updateDealerLocationAction,
  toggleDealerLocationActiveAction,
  deleteDealerLocationAction,
} from '@/lib/events/dealer-locations-actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface DealerLocationManagementViewProps {
  initialLocations: DealerLocationItem[];
}

type FilterStatus = 'all' | 'active' | 'inactive';

export function DealerLocationManagementView({
  initialLocations,
}: DealerLocationManagementViewProps) {
  const [locations, setLocations] = useState<DealerLocationItem[]>(initialLocations);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Deletion Confirmation Modal State
  const [deletingRecord, setDeletingRecord] = useState<DealerLocationItem | null>(null);

  // Feedback & Transition State
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setCity('');
    setAddress('');
    setPhone('');
    setIsActive(true);
    setFormError(null);
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (loc: DealerLocationItem) => {
    setEditingId(loc.id);
    setName(loc.name);
    setCity(loc.city);
    setAddress(loc.address);
    setPhone(loc.phone || '');
    setIsActive(loc.isActive);
    setFormError(null);
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setActionError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await updateDealerLocationAction({
            id: editingId,
            name,
            city,
            address,
            phone: phone.trim() || null,
            isActive,
          });

          if (!res.success) {
            setFormError(res.error || 'Gagal memperbarui lokasi dealer.');
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            return;
          }

          if (res.data) {
            setLocations((prev) =>
              prev.map((loc) => (loc.id === editingId ? (res.data as DealerLocationItem) : loc))
            );
          }
          setSuccessMessage(dealershipCopy.adminDealerLocations.saveSuccess);
          setIsEditing(false);
        } else {
          const res = await createDealerLocationAction({
            name,
            city,
            address,
            phone: phone.trim() || null,
            isActive,
          });

          if (!res.success) {
            setFormError(res.error || 'Gagal menambahkan lokasi dealer.');
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            return;
          }

          if (res.data) {
            setLocations((prev) => [...prev, res.data as DealerLocationItem]);
          }
          setSuccessMessage(dealershipCopy.adminDealerLocations.saveSuccess);
          setIsEditing(false);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Terjadi kendala saat menyimpan data.');
      }
    });
  };

  const handleToggleActive = (loc: DealerLocationItem) => {
    setActionError(null);
    setSuccessMessage(null);
    const newStatus = !loc.isActive;

    startTransition(async () => {
      const res = await toggleDealerLocationActiveAction({
        id: loc.id,
        isActive: newStatus,
      });

      if (!res.success) {
        setActionError(res.error || 'Gagal mengubah status lokasi dealer.');
        return;
      }

      setLocations((prev) =>
        prev.map((item) => (item.id === loc.id ? { ...item, isActive: newStatus } : item))
      );
      setSuccessMessage(dealershipCopy.adminDealerLocations.statusChangeSuccess);
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingRecord) return;
    setActionError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await deleteDealerLocationAction(deletingRecord.id);

      if (!res.success) {
        setActionError(res.error || 'Gagal menghapus lokasi dealer.');
        setDeletingRecord(null);
        return;
      }

      setLocations((prev) => prev.filter((item) => item.id !== deletingRecord.id));
      setSuccessMessage(dealershipCopy.adminDealerLocations.deleteSuccess);
      setDeletingRecord(null);
    });
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.address.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return loc.isActive;
      if (statusFilter === 'inactive') return !loc.isActive;
      return true;
    });
  }, [locations, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-ink">
            {dealershipCopy.adminDealerLocations.title}
          </h1>
          <p className="text-xs sm:text-sm text-body mt-1">
            {dealershipCopy.adminDealerLocations.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/events"
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-body hover:text-ink border border-hairline hover:bg-neutral-2/50 transition-colors"
          >
            &larr; {dealershipCopy.adminEvents.title}
          </Link>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            className="font-bold"
          >
            {dealershipCopy.adminDealerLocations.createNew}
          </Button>
        </div>
      </div>

      {/* Global Action / Error Messages */}
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
              placeholder="Cari nama dealer, kota, atau alamat..."
              aria-label="Cari lokasi dealer"
              className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              aria-label="Filter status lokasi"
              className="px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{dealershipCopy.adminDealerLocations.filterAll}</option>
              <option value="active">{dealershipCopy.adminDealerLocations.filterActive}</option>
              <option value="inactive">{dealershipCopy.adminDealerLocations.filterInactive}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* 3. Table of Dealer Locations */}
      <div className="border border-hairline bg-surface overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-2/50 border-b border-hairline text-muted uppercase font-semibold tracking-wider">
              <th className="p-3">{dealershipCopy.adminDealerLocations.tableHeaderName}</th>
              <th className="p-3">{dealershipCopy.adminDealerLocations.tableHeaderCity}</th>
              <th className="p-3">{dealershipCopy.adminDealerLocations.tableHeaderAddress}</th>
              <th className="p-3">{dealershipCopy.adminDealerLocations.tableHeaderPhone}</th>
              <th className="p-3">{dealershipCopy.adminDealerLocations.tableHeaderStatus}</th>
              <th className="p-3 text-right">
                {dealershipCopy.adminDealerLocations.tableHeaderActions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  {dealershipCopy.adminDealerLocations.emptyState}
                </td>
              </tr>
            ) : (
              filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-neutral-2/30 transition-colors">
                  <td className="p-3 font-semibold text-ink">
                    {loc.name}
                    {loc.name.includes('Demo') && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] bg-neutral-2 text-muted border border-hairline font-normal">
                        Placeholder
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-body">{loc.city}</td>
                  <td className="p-3 text-body max-w-xs truncate">{loc.address}</td>
                  <td className="p-3 text-muted">{loc.phone || '—'}</td>
                  <td className="p-3">
                    {loc.isActive ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="neutral">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(loc)}
                      disabled={isPending}
                      className={`text-[11px] font-semibold underline underline-offset-2 ${
                        loc.isActive
                          ? 'text-muted hover:text-ink'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      {loc.isActive
                        ? dealershipCopy.adminDealerLocations.deactivateButton
                        : dealershipCopy.adminDealerLocations.activateButton}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(loc)}
                      className="text-[11px] font-semibold text-body hover:text-ink underline underline-offset-2"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRecord(loc)}
                      className="text-[11px] font-semibold text-primary hover:opacity-80 underline underline-offset-2"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Create / Edit Modal Form */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-form-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-surface border border-hairline w-full max-w-lg shadow-xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-hairline">
              <h2
                id="location-form-modal-title"
                className="font-heading font-bold text-base text-ink"
              >
                {editingId
                  ? dealershipCopy.adminDealerLocations.formTitleEdit
                  : dealershipCopy.adminDealerLocations.formTitleCreate}
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

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminDealerLocations.nameLabel}{' '}
                  <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dealershipCopy.adminDealerLocations.namePlaceholder}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.name[0]}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminDealerLocations.cityLabel}{' '}
                  <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={dealershipCopy.adminDealerLocations.cityPlaceholder}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {fieldErrors.city && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.city[0]}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminDealerLocations.addressLabel}{' '}
                  <span className="text-primary">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={dealershipCopy.adminDealerLocations.addressPlaceholder}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {fieldErrors.address && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.address[0]}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {dealershipCopy.adminDealerLocations.phoneLabel}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={dealershipCopy.adminDealerLocations.phonePlaceholder}
                  className="w-full px-3 py-2 text-xs border border-hairline bg-canvas text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {fieldErrors.phone && (
                  <p className="text-[11px] text-primary mt-1">{fieldErrors.phone[0]}</p>
                )}
              </div>

              {/* IsActive */}
              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>{dealershipCopy.adminDealerLocations.isActiveLabel}</span>
                </label>
                <p className="text-[11px] text-muted mt-0.5">
                  {dealershipCopy.adminDealerLocations.isActiveHelp}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-hairline">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending}
                  className="font-bold"
                >
                  {isPending
                    ? dealershipCopy.adminDealerLocations.savingButton
                    : dealershipCopy.adminDealerLocations.saveButton}
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
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs"
        >
          <div className="bg-surface border border-hairline w-full max-w-md p-6 shadow-xl space-y-4">
            <h3 id="delete-modal-title" className="font-heading font-bold text-base text-ink">
              {dealershipCopy.adminDealerLocations.deleteConfirmTitle}
            </h3>
            <p className="text-xs text-body leading-relaxed">
              {dealershipCopy.adminDealerLocations.deleteConfirmMessage}
            </p>
            <div className="p-3 bg-neutral-2/50 border border-hairline text-xs font-medium text-ink">
              <strong>{deletingRecord.name}</strong> ({deletingRecord.city})
            </div>
            <p className="text-[11px] text-muted">
              {dealershipCopy.adminDealerLocations.deletePreventedReferenced}
            </p>
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
                {isPending ? 'Menghapus...' : dealershipCopy.adminDealerLocations.deleteButton}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
