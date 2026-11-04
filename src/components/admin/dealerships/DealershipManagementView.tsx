'use client';

import React, { useState, useTransition, useMemo } from 'react';
import type { DealershipItem } from '@/types/dealership';
import {
  createDealershipAction,
  updateDealershipAction,
  toggleDealershipActiveAction,
  deleteDealershipAction,
} from '@/lib/dealerships/actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface DealershipManagementViewProps {
  initialDealerships: DealershipItem[];
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'synthetic';

export function DealershipManagementView({ initialDealerships }: DealershipManagementViewProps) {
  const [dealerships, setDealerships] = useState<DealershipItem[]>(initialDealerships);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [isSynthetic, setIsSynthetic] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Deletion Confirmation Modal State
  const [deletingRecord, setDeletingRecord] = useState<DealershipItem | null>(null);

  // Feedback & Transition State
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setCity('');
    setAddress('');
    setPhone('');
    setWhatsappNumber('');
    setOpeningHours('');
    setIsSynthetic(false);
    setIsActive(true);
    setSortOrder(dealerships.length > 0 ? Math.max(...dealerships.map((d) => d.sortOrder)) + 1 : 1);
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (dealer: DealershipItem) => {
    setEditingId(dealer.id);
    setName(dealer.name);
    setCode(dealer.code);
    setCity(dealer.city);
    setAddress(dealer.address || '');
    setPhone(dealer.phone || '');
    setWhatsappNumber(dealer.whatsappNumber || '');
    setOpeningHours(dealer.openingHours || '');
    setIsSynthetic(dealer.isSynthetic);
    setIsActive(dealer.isActive);
    setSortOrder(dealer.sortOrder);
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        if (editingId) {
          const res = await updateDealershipAction({
            id: editingId,
            name,
            code,
            city,
            address: address.trim() || null,
            phone: phone.trim() || null,
            whatsappNumber: whatsappNumber.trim() || null,
            openingHours: openingHours.trim() || null,
            isSynthetic,
            isActive,
            sortOrder,
          });

          if (!res.success) {
            setFormError(res.error || 'Gagal memperbarui dealer.');
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            return;
          }

          if (res.data) {
            setDealerships((prev) =>
              prev.map((d) => (d.id === editingId ? (res.data as DealershipItem) : d))
            );
          }
          setSuccessMessage(dealershipCopy.adminDealerships.updateSuccess);
          setIsEditing(false);
        } else {
          const res = await createDealershipAction({
            name,
            code,
            city,
            address: address.trim() || null,
            phone: phone.trim() || null,
            whatsappNumber: whatsappNumber.trim() || null,
            openingHours: openingHours.trim() || null,
            isSynthetic,
            isActive,
            sortOrder,
          });

          if (!res.success) {
            setFormError(res.error || 'Gagal menambahkan dealer.');
            if (res.fieldErrors) setFieldErrors(res.fieldErrors);
            return;
          }

          if (res.data) {
            setDealerships((prev) => [...prev, res.data as DealershipItem]);
          }
          setSuccessMessage(dealershipCopy.adminDealerships.createSuccess);
          setIsEditing(false);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Terjadi kendala koneksi dengan server.');
      }
    });
  };

  const handleToggleActive = (dealer: DealershipItem) => {
    setFormError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const nextActive = !dealer.isActive;
        const res = await toggleDealershipActiveAction(dealer.id, nextActive);

        if (!res.success) {
          setFormError(res.error || 'Gagal mengubah status aktif dealer.');
          return;
        }

        setDealerships((prev) =>
          prev.map((d) => (d.id === dealer.id ? { ...d, isActive: nextActive } : d))
        );
        setSuccessMessage(
          `Status dealer "${dealer.name}" berhasil diubah menjadi ${nextActive ? 'Aktif' : 'Nonaktif'}.`
        );
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Terjadi kendala koneksi dengan server.');
      }
    });
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    setFormError(null);
    setSuccessMessage(null);

    const recordToDelete = deletingRecord;
    startTransition(async () => {
      try {
        const res = await deleteDealershipAction(recordToDelete.id);
        if (!res.success) {
          setFormError(res.error || 'Gagal menghapus entitas dealer.');
          setDeletingRecord(null);
          return;
        }

        setDealerships((prev) => prev.filter((d) => d.id !== recordToDelete.id));
        setSuccessMessage(`Entitas dealer "${recordToDelete.name}" berhasil dihapus dari sistem.`);
        setDeletingRecord(null);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Terjadi kendala koneksi dengan server.');
        setDeletingRecord(null);
      }
    });
  };

  // Filtered & Searched list
  const filteredDealerships = useMemo(() => {
    return dealerships.filter((d) => {
      // Status filter
      if (statusFilter === 'active' && !d.isActive) return false;
      if (statusFilter === 'inactive' && d.isActive) return false;
      if (statusFilter === 'synthetic' && !d.isSynthetic) return false;

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = d.name.toLowerCase().includes(q);
        const matchCode = d.code.toLowerCase().includes(q);
        const matchCity = d.city.toLowerCase().includes(q);
        return matchName || matchCode || matchCity;
      }
      return true;
    });
  }, [dealerships, statusFilter, searchQuery]);

  return (
    <div className="space-y-8 sm:space-y-10 max-w-6xl">
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminDealerships.title}
          </h1>
          <p className="mt-1 text-sm text-body">{dealershipCopy.adminDealerships.subtitle}</p>
        </div>
        <div>
          {!isEditing && (
            <Button
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>{dealershipCopy.adminDealerships.createNew}</span>
            </Button>
          )}
        </div>
      </section>

      {/* 2. Global Alerts */}
      {successMessage && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between"
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

      {formError && (
        <div
          role="alert"
          className="p-4 bg-primary/10 border border-primary/30 text-primary text-xs font-medium flex items-center justify-between"
        >
          <span>{formError}</span>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-primary hover:text-primary-dark font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Inline Create / Edit Form Card */}
      {isEditing && (
        <Card padding="lg" className="border border-hairline space-y-6 bg-surface shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h2 className="text-base font-bold text-ink font-heading">
              {editingId
                ? dealershipCopy.adminDealerships.formTitleEdit
                : dealershipCopy.adminDealerships.formTitleCreate}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted hover:text-ink transition-colors font-medium"
            >
              Tutup &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dealership Name */}
              <div>
                <label htmlFor="dealer-name" className="block text-xs font-bold text-ink mb-1.5">
                  {dealershipCopy.adminDealerships.nameLabel}{' '}
                  <span className="text-primary">*</span>
                </label>
                <input
                  id="dealer-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dealershipCopy.adminDealerships.namePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-[11px] text-primary">{fieldErrors.name.join(', ')}</p>
                )}
              </div>

              {/* Code */}
              <div>
                <label htmlFor="dealer-code" className="block text-xs font-bold text-ink mb-1.5">
                  {dealershipCopy.adminDealerships.codeLabel}{' '}
                  <span className="text-primary">*</span>
                </label>
                <input
                  id="dealer-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase())}
                  placeholder={dealershipCopy.adminDealerships.codePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
                <p className="mt-1 text-[11px] text-muted">
                  {dealershipCopy.adminDealerships.codeHelp}
                </p>
                {fieldErrors.code && (
                  <p className="mt-1 text-[11px] text-primary">{fieldErrors.code.join(', ')}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="dealer-city" className="block text-xs font-bold text-ink mb-1.5">
                  {dealershipCopy.adminDealerships.cityLabel}{' '}
                  <span className="text-primary">*</span>
                </label>
                <input
                  id="dealer-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={dealershipCopy.adminDealerships.cityPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-[11px] text-primary">{fieldErrors.city.join(', ')}</p>
                )}
              </div>

              {/* Sort Order */}
              <div>
                <label
                  htmlFor="dealer-sort-order"
                  className="block text-xs font-bold text-ink mb-1.5"
                >
                  {dealershipCopy.adminDealerships.sortOrderLabel}
                </label>
                <input
                  id="dealer-sort-order"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.sortOrder && (
                  <p className="mt-1 text-[11px] text-primary">
                    {fieldErrors.sortOrder.join(', ')}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="dealer-address" className="block text-xs font-bold text-ink mb-1.5">
                  {dealershipCopy.adminDealerships.addressLabel}
                </label>
                <input
                  id="dealer-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={dealershipCopy.adminDealerships.addressPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.address && (
                  <p className="mt-1 text-[11px] text-primary">{fieldErrors.address.join(', ')}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="dealer-phone" className="block text-xs font-bold text-ink mb-1.5">
                  {dealershipCopy.adminDealerships.phoneLabel}
                </label>
                <input
                  id="dealer-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={dealershipCopy.adminDealerships.phonePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-[11px] text-primary">{fieldErrors.phone.join(', ')}</p>
                )}
              </div>

              {/* WhatsApp Number */}
              <div>
                <label
                  htmlFor="dealer-whatsapp"
                  className="block text-xs font-bold text-ink mb-1.5"
                >
                  {dealershipCopy.adminDealerships.whatsappLabel}
                </label>
                <input
                  id="dealer-whatsapp"
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder={dealershipCopy.adminDealerships.whatsappPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.whatsappNumber && (
                  <p className="mt-1 text-[11px] text-primary">
                    {fieldErrors.whatsappNumber.join(', ')}
                  </p>
                )}
              </div>

              {/* Opening Hours */}
              <div className="md:col-span-2">
                <label htmlFor="dealer-hours" className="block text-xs font-bold text-ink mb-1.5">
                  {dealershipCopy.adminDealerships.openingHoursLabel}
                </label>
                <input
                  id="dealer-hours"
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder={dealershipCopy.adminDealerships.openingHoursPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.openingHours && (
                  <p className="mt-1 text-[11px] text-primary">
                    {fieldErrors.openingHours.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Checkboxes: Synthetic & Active */}
            <div className="p-4 bg-canvas rounded-xs border border-hairline space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 rounded text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-ink">
                    {dealershipCopy.adminDealerships.isActiveLabel}
                  </span>
                  <p className="text-muted mt-0.5">
                    {dealershipCopy.adminDealerships.isActiveHelp}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-hairline">
                <input
                  type="checkbox"
                  checked={isSynthetic}
                  onChange={(e) => setIsSynthetic(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900">
                    {dealershipCopy.adminDealerships.isSyntheticLabel}
                  </span>
                  <p className="text-muted mt-0.5">
                    {dealershipCopy.adminDealerships.isSyntheticHelp}
                  </p>
                </div>
              </label>
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                {dealershipCopy.common.cancel}
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending
                  ? dealershipCopy.adminDealerships.savingButton
                  : editingId
                    ? dealershipCopy.adminDealerships.saveEditButton
                    : dealershipCopy.adminDealerships.saveCreateButton}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* 4. Controls Bar: Search & Status Filters */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama dealer, kode, atau kota..."
            className="w-full h-9 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-surface text-body border-hairline hover:bg-neutral-2'
            }`}
          >
            {dealershipCopy.adminDealerships.filterAll}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-surface text-body border-hairline hover:bg-neutral-2'
            }`}
          >
            {dealershipCopy.adminDealerships.filterActive}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors whitespace-nowrap ${
              statusFilter === 'inactive'
                ? 'bg-ink text-canvas border-ink'
                : 'bg-surface text-body border-hairline hover:bg-neutral-2'
            }`}
          >
            {dealershipCopy.adminDealerships.filterInactive}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('synthetic')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xs border transition-colors whitespace-nowrap ${
              statusFilter === 'synthetic'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-surface text-body border-hairline hover:bg-neutral-2'
            }`}
          >
            {dealershipCopy.adminDealerships.filterSynthetic}
          </button>
        </div>
      </section>

      {/* 5. Dealerships Table Card */}
      <Card padding="none" className="border border-hairline overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-neutral-2/70 border-b border-hairline font-bold uppercase tracking-wider text-muted font-heading">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Dealer & Kode
                </th>
                <th scope="col" className="px-4 py-3">
                  Kota / Wilayah
                </th>
                <th scope="col" className="px-4 py-3">
                  Kontak Resmi
                </th>
                <th scope="col" className="px-4 py-3">
                  Tipe Data
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline bg-canvas">
              {filteredDealerships.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted">
                    <p className="text-sm font-medium">
                      {dealershipCopy.adminDealerships.emptyState}
                    </p>
                    {searchQuery && (
                      <p className="text-xs text-muted mt-1">
                        Tidak ada dealer yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDealerships.map((d) => (
                  <tr key={d.id} className="hover:bg-neutral-2/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <div>{d.name}</div>
                      <div className="text-[11px] font-mono text-muted mt-0.5">{d.code}</div>
                      {d.address && (
                        <div className="text-[11px] text-body mt-0.5 line-clamp-1">{d.address}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-body whitespace-nowrap">{d.city}</td>
                    <td className="px-4 py-3 text-body">
                      {d.phone || d.whatsappNumber ? (
                        <div className="space-y-0.5">
                          {d.phone && <div>Tel: {d.phone}</div>}
                          {d.whatsappNumber && <div>WA: {d.whatsappNumber}</div>}
                        </div>
                      ) : (
                        <span className="text-muted italic">
                          {dealershipCopy.adminSettings.fieldUnset}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.isSynthetic ? (
                        <Badge variant="warning" size="sm">
                          {dealershipCopy.adminSettings.syntheticBadge}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {dealershipCopy.adminDealerships.verifiedBadge}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Badge variant={d.isActive ? 'success' : 'neutral'} size="sm">
                        {d.isActive
                          ? dealershipCopy.adminSettings.statusActive
                          : dealershipCopy.adminSettings.statusInactive}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(d)}
                          className="px-2.5 py-1 text-xs font-semibold text-body hover:text-ink bg-surface border border-hairline rounded-xs hover:bg-neutral-2 transition-colors"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(d)}
                          disabled={isPending}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-xs border transition-colors ${
                            d.isActive
                              ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {d.isActive
                            ? dealershipCopy.adminDealerships.deactivateButton
                            : dealershipCopy.adminDealerships.activateButton}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecord(d)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-xs hover:bg-primary/20 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Delete Confirmation Dialog */}
      {deletingRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md p-6 bg-surface rounded-sm border border-hairline shadow-lg space-y-4">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-primary/10 text-primary shrink-0 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </span>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-ink font-heading">
                  {dealershipCopy.adminDealerships.deleteConfirmTitle}
                </h3>
                <p className="mt-1 text-xs text-body leading-relaxed">
                  {dealershipCopy.adminDealerships.deleteConfirmMessage}
                </p>
                <div className="mt-2 p-2 bg-neutral-2 border border-hairline rounded-xs text-xs">
                  <span className="font-semibold text-ink">{deletingRecord.name}</span>
                  <div className="text-muted font-mono text-[11px]">{deletingRecord.code}</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingRecord(null)}
                disabled={isPending}
              >
                {dealershipCopy.common.cancel}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending
                  ? dealershipCopy.adminDealerships.deletingButton
                  : dealershipCopy.adminDealerships.deleteButton}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
