'use client';

import React, { useState, useTransition } from 'react';
import type { AdminPriceEntryItem, AdminModelOption } from '@/lib/admin/queries';
import { upsertPriceAction } from '@/lib/admin/actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface PriceManagementViewProps {
  initialEntries: AdminPriceEntryItem[];
  modelOptions: AdminModelOption[];
}

export function PriceManagementView({ initialEntries, modelOptions }: PriceManagementViewProps) {
  const [entries, setEntries] = useState<AdminPriceEntryItem[]>(initialEntries);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [variantId, setVariantId] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [priceType, setPriceType] = useState<'otr' | 'cash' | 'promo'>('otr');
  const [amountIdr, setAmountIdr] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [sourceNote, setSourceNote] = useState<string>('');

  // Status & Feedback State
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Selected model's available variants
  const activeModel = modelOptions.find((m) => m.id === selectedModelId);
  const availableVariants = activeModel?.variants || [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedModelId(modelOptions[0]?.id || '');
    setVariantId(modelOptions[0]?.variants[0]?.id || '');
    setCity('Sidoarjo');
    setPriceType('otr');
    setAmountIdr('');
    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidUntil('');
    setIsPublished(false); // Unverified/new prices must default to unpublished
    setSourceNote('');
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (entry: AdminPriceEntryItem) => {
    setEditingId(entry.id);
    setSelectedModelId(entry.modelId);
    setVariantId(entry.variantId);
    setCity(entry.city || '');
    setPriceType(entry.priceType);
    setAmountIdr(String(entry.amountIdr));
    setValidFrom(entry.validFrom);
    setValidUntil(entry.validUntil || '');
    setIsPublished(entry.isPublished);
    setSourceNote(entry.sourceNote || '');
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModelId = e.target.value;
    setSelectedModelId(newModelId);
    const model = modelOptions.find((m) => m.id === newModelId);
    if (model && model.variants.length > 0) {
      setVariantId(model.variants[0].id);
    } else {
      setVariantId('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const numericAmount = Number(amountIdr.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Nominal harga harus lebih besar dari 0.');
      return;
    }

    if (!variantId) {
      setFormError('Pilih varian sepeda motor.');
      return;
    }

    if (!validFrom) {
      setFormError('Tanggal mulai berlaku wajib diisi.');
      return;
    }

    startTransition(async () => {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        variantId,
        city: city.trim() || null,
        priceType,
        amountIdr: numericAmount,
        validFrom,
        validUntil: validUntil.trim() ? validUntil.trim() : null,
        isPublished,
        sourceNote: sourceNote.trim() || null,
      };

      const res = await upsertPriceAction(payload);

      if (!res.success) {
        setFormError(res.error || 'Gagal menyimpan data harga.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        return;
      }

      setSuccessMessage(dealershipCopy.adminPricing.saveSuccess);
      setIsEditing(false);

      // Optimistically update list
      const savedVariant = modelOptions
        .flatMap((m) =>
          m.variants.map((v) => ({ ...v, modelName: m.name, modelSlug: m.slug, modelId: m.id }))
        )
        .find((v) => v.id === variantId);

      const updatedRow: AdminPriceEntryItem = {
        id: (res.data as { id: string })?.id || editingId || 'temp-id',
        variantId,
        variantName: savedVariant?.name || 'Varian Motor',
        variantCode: savedVariant?.code || null,
        modelId: savedVariant?.modelId || '',
        modelName: savedVariant?.modelName || 'Model Motor',
        modelSlug: savedVariant?.modelSlug || '',
        city: city.trim() || null,
        priceType,
        amountIdr: numericAmount,
        validFrom,
        validUntil: validUntil.trim() ? validUntil.trim() : null,
        isPublished,
        sourceNote: sourceNote.trim() || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        setEntries((prev) => prev.map((item) => (item.id === editingId ? updatedRow : item)));
      } else {
        setEntries((prev) => [updatedRow, ...prev]);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminPricing.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {dealershipCopy.adminPricing.subtitle}
          </p>
        </div>
        <div>
          {!isEditing && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto"
            >
              + {dealershipCopy.adminPricing.addNewButton}
            </Button>
          )}
        </div>
      </div>

      {/* Global Success / Alert Banner */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 rounded-xs border border-green-200 bg-green-50 text-status-success text-xs sm:text-sm flex items-center justify-between"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-status-success hover:underline ml-4 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Editing / Creation Form Modal or Drawer */}
      {isEditing && (
        <Card className="p-6 border border-hairline bg-surface space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h2 className="text-base font-semibold text-ink">
              {editingId
                ? dealershipCopy.adminPricing.formTitleEdit
                : dealershipCopy.adminPricing.formTitleCreate}
            </h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-muted hover:text-ink transition-colors"
            >
              Tutup &times;
            </button>
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-xs border border-red-200 bg-red-50 text-status-error text-xs"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Motorcycle Model Selector */}
              <div>
                <label
                  htmlFor="price-model-select"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPricing.modelSelectLabel}
                </label>
                <select
                  id="price-model-select"
                  value={selectedModelId}
                  onChange={handleModelChange}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {modelOptions.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Selector */}
              <div>
                <label
                  htmlFor="price-variant-select"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPricing.variantSelectLabel}
                </label>
                <select
                  id="price-variant-select"
                  value={variantId}
                  onChange={(e) => setVariantId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {availableVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} {variant.code ? `(${variant.code})` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrors.variantId && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.variantId.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* City Input */}
              <div>
                <label htmlFor="price-city" className="block text-xs font-semibold text-ink mb-1.5">
                  {dealershipCopy.adminPricing.cityLabel}
                </label>
                <input
                  id="price-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={dealershipCopy.adminPricing.cityPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-[10px] text-muted">
                  Perbandingan kota bersifat case-insensitive dan konsisten dinormalisasi.
                </p>
              </div>

              {/* Price Type */}
              <div>
                <label htmlFor="price-type" className="block text-xs font-semibold text-ink mb-1.5">
                  {dealershipCopy.adminPricing.priceTypeLabel}
                </label>
                <select
                  id="price-type"
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as 'otr' | 'cash' | 'promo')}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="otr">OTR (On The Road)</option>
                  <option value="cash">Cash / Tunai</option>
                  <option value="promo">Promo Khusus</option>
                </select>
              </div>

              {/* Amount IDR */}
              <div>
                <label
                  htmlFor="price-amount"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPricing.amountLabel}
                </label>
                <input
                  id="price-amount"
                  type="number"
                  min="1"
                  step="1000"
                  value={amountIdr}
                  onChange={(e) => setAmountIdr(e.target.value)}
                  placeholder={dealershipCopy.adminPricing.amountPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.amountIdr && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.amountIdr.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valid From */}
              <div>
                <label
                  htmlFor="price-valid-from"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPricing.validFromLabel}
                </label>
                <input
                  id="price-valid-from"
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.validFrom && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.validFrom.join(', ')}
                  </p>
                )}
              </div>

              {/* Valid Until */}
              <div>
                <label
                  htmlFor="price-valid-until"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPricing.validUntilLabel}
                </label>
                <input
                  id="price-valid-until"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                <p className="mt-1 text-[10px] text-muted">
                  Kosongkan jika berlaku tanpa batas waktu (terbuka).
                </p>
                {fieldErrors.validUntil && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.validUntil.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Source Note */}
            <div>
              <label
                htmlFor="price-source-note"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                {dealershipCopy.adminPricing.sourceNoteLabel}
              </label>
              <input
                id="price-source-note"
                type="text"
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder={dealershipCopy.adminPricing.sourceNotePlaceholder}
                className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Publication Checkbox */}
            <div className="pt-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-xs border-hairline text-primary focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-semibold text-ink">
                    {dealershipCopy.adminPricing.isPublishedLabel}
                  </span>
                  <p className="text-[11px] text-muted">
                    {dealershipCopy.adminPricing.publishedHint}
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-hairline">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isPending}
              >
                {dealershipCopy.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending ? 'Menyimpan...' : dealershipCopy.common.save}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Price Entries Table */}
      <div className="border border-hairline bg-surface rounded-none overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-semibold text-ink">
              {dealershipCopy.adminPricing.emptyTitle}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {dealershipCopy.adminPricing.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-hairline bg-neutral-2/40 text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPricing.tableHeaderModel}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPricing.tableHeaderCity}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPricing.tableHeaderPriceType}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPricing.tableHeaderAmount}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPricing.tableHeaderPeriod}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPricing.tableHeaderStatus}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {dealershipCopy.adminPricing.tableHeaderActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-2/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-ink">
                      <div>
                        <span>{entry.modelName}</span>
                        <span className="block text-[11px] text-muted">
                          {entry.variantName} {entry.variantCode ? `(${entry.variantCode})` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-body">
                      {entry.city || <span className="text-muted italic">Nasional</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[11px] font-semibold text-body bg-neutral-2 px-1.5 py-0.5 rounded-xs">
                        {entry.priceType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink">
                      Rp {entry.amountIdr.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      <span>{entry.validFrom}</span>
                      <span className="block text-muted">
                        s/d {entry.validUntil || 'Seterusnya'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {entry.isPublished ? (
                        <Badge variant="success" size="sm">
                          Dipublikasikan
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Draf / Non-Publik
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(entry)}
                        className="text-xs px-2.5 py-1 min-h-[36px]"
                      >
                        {dealershipCopy.adminPricing.editButton}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
