'use client';

import React, { useState, useTransition } from 'react';
import type { AdminPromotionItem, AdminModelOption } from '@/lib/admin/queries';
import { upsertPromotionAction } from '@/lib/admin/actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface PromotionManagementViewProps {
  initialPromotions: AdminPromotionItem[];
  modelOptions: AdminModelOption[];
}

export function PromotionManagementView({
  initialPromotions,
  modelOptions,
}: PromotionManagementViewProps) {
  const [promotions, setPromotions] = useState<AdminPromotionItem[]>(initialPromotions);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  // Status & Feedback State
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setSummary('');
    setDetails('');
    setImagePath('');
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);
    setStartsAt(now.toISOString().slice(0, 16));
    setEndsAt(oneMonthLater.toISOString().slice(0, 16));
    setTerms('');
    setStatus('draft');
    setCtaLabel('');
    setCtaUrl('');
    setSelectedModelIds([]);
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (promo: AdminPromotionItem) => {
    setEditingId(promo.id);
    setTitle(promo.title);
    setSlug(promo.slug);
    setSummary(promo.summary);
    setDetails(promo.details || '');
    setImagePath(promo.imagePath || '');
    setStartsAt(promo.startsAt ? new Date(promo.startsAt).toISOString().slice(0, 16) : '');
    setEndsAt(promo.endsAt ? new Date(promo.endsAt).toISOString().slice(0, 16) : '');
    setTerms(promo.terms || '');
    setStatus(promo.status);
    setCtaLabel(promo.ctaLabel || '');
    setCtaUrl(promo.ctaUrl || '');
    setSelectedModelIds(promo.linkedModels.map((m) => m.id));
    setFormError(null);
    setFieldErrors({});
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

  const toggleModelSelection = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Judul promo minimal 3 karakter.');
      return;
    }

    if (!slug.trim() || slug.trim().length < 3) {
      setFormError('Slug promo minimal 3 karakter.');
      return;
    }

    if (!summary.trim() || summary.trim().length < 10) {
      setFormError('Ringkasan promo minimal 10 karakter.');
      return;
    }

    if (!startsAt || !endsAt) {
      setFormError('Jadwal mulai dan berakhir wajib diisi.');
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError('Waktu berakhir promo harus setelah waktu mulai.');
      return;
    }

    startTransition(async () => {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        summary: summary.trim(),
        details: details.trim() || null,
        imagePath: imagePath.trim() || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        terms: terms.trim() || null,
        status,
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        modelIds: selectedModelIds,
      };

      const res = await upsertPromotionAction(payload);

      if (!res.success) {
        setFormError(res.error || 'Gagal menyimpan data promosi.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        return;
      }

      setSuccessMessage(dealershipCopy.adminPromotions.saveSuccess);
      setIsEditing(false);

      const linkedModelsData = modelOptions
        .filter((m) => selectedModelIds.includes(m.id))
        .map((m) => ({ id: m.id, name: m.name, slug: m.slug }));

      const updatedRow: AdminPromotionItem = {
        id: (res.data as { id: string })?.id || editingId || 'temp-id',
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        summary: summary.trim(),
        details: details.trim() || null,
        imagePath: imagePath.trim() || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        terms: terms.trim() || null,
        status,
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        linkedModels: linkedModelsData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        setPromotions((prev) => prev.map((item) => (item.id === editingId ? updatedRow : item)));
      } else {
        setPromotions((prev) => [updatedRow, ...prev]);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminPromotions.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {dealershipCopy.adminPromotions.subtitle}
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
              + {dealershipCopy.adminPromotions.addNewButton}
            </Button>
          )}
        </div>
      </div>

      {/* Global Success Banner */}
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

      {/* Editing / Creation Form */}
      {isEditing && (
        <Card className="p-6 border border-hairline bg-surface space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-hairline">
            <h2 className="text-base font-semibold text-ink">
              {editingId
                ? dealershipCopy.adminPromotions.formTitleEdit
                : dealershipCopy.adminPromotions.formTitleCreate}
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
              {/* Title */}
              <div>
                <label
                  htmlFor="promo-title"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.titleLabel}
                </label>
                <input
                  id="promo-title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={dealershipCopy.adminPromotions.titlePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.title.join(', ')}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="promo-slug" className="block text-xs font-semibold text-ink mb-1.5">
                  {dealershipCopy.adminPromotions.slugLabel}
                </label>
                <input
                  id="promo-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={dealershipCopy.adminPromotions.slugPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
                <p className="mt-1 text-[10px] text-muted">
                  Hanya huruf kecil, angka, dan tanda hubung (-).
                </p>
                {fieldErrors.slug && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.slug.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label
                htmlFor="promo-summary"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                {dealershipCopy.adminPromotions.summaryLabel}
              </label>
              <textarea
                id="promo-summary"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={dealershipCopy.adminPromotions.summaryPlaceholder}
                className="w-full px-3 py-2 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {fieldErrors.summary && (
                <p className="mt-1 text-[11px] text-status-error">
                  {fieldErrors.summary.join(', ')}
                </p>
              )}
            </div>

            {/* Details */}
            <div>
              <label
                htmlFor="promo-details"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                {dealershipCopy.adminPromotions.detailsLabel}
              </label>
              <textarea
                id="promo-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={dealershipCopy.adminPromotions.detailsPlaceholder}
                className="w-full px-3 py-2 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Image Path */}
              <div>
                <label
                  htmlFor="promo-image"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.imagePathLabel}
                </label>
                <input
                  id="promo-image"
                  type="text"
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder={dealershipCopy.adminPromotions.imagePathPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
              </div>

              {/* Starts At */}
              <div>
                <label
                  htmlFor="promo-starts-at"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.startsAtLabel}
                </label>
                <input
                  id="promo-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Ends At */}
              <div>
                <label
                  htmlFor="promo-ends-at"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.endsAtLabel}
                </label>
                <input
                  id="promo-ends-at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.endsAt && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.endsAt.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Terms */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="promo-terms"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.termsLabel}
                </label>
                <textarea
                  id="promo-terms"
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder={dealershipCopy.adminPromotions.termsPlaceholder}
                  className="w-full px-3 py-2 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="promo-status"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.statusLabel}
                </label>
                <select
                  id="promo-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="draft">Draf (Tidak Ditampilkan)</option>
                  <option value="published">Publikasi (Aktif Sesuai Jadwal)</option>
                  <option value="archived">Diarsipkan (Berakhir)</option>
                </select>
                <p className="mt-1 text-[10px] text-muted">
                  Draf tidak ditampilkan di katalog publik.
                </p>
              </div>
            </div>

            {/* Model Associations */}
            <div>
              <span className="block text-xs font-semibold text-ink mb-2">
                {dealershipCopy.adminPromotions.modelsLabel}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xs border border-hairline bg-canvas">
                {modelOptions.map((model) => {
                  const isChecked = selectedModelIds.includes(model.id);
                  return (
                    <label
                      key={model.id}
                      className="flex items-center space-x-2 text-xs text-ink cursor-pointer hover:text-primary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleModelSelection(model.id)}
                        className="h-4 w-4 rounded-xs border-hairline text-primary focus:ring-primary"
                      />
                      <span className="truncate">{model.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* CTA optional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label
                  htmlFor="promo-cta-label"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.ctaLabelLabel}
                </label>
                <input
                  id="promo-cta-label"
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder={dealershipCopy.adminPromotions.ctaLabelPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="promo-cta-url"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminPromotions.ctaUrlLabel}
                </label>
                <input
                  id="promo-cta-url"
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder={dealershipCopy.adminPromotions.ctaUrlPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
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

      {/* Promotions Table */}
      <div className="border border-hairline bg-surface rounded-none overflow-hidden">
        {promotions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-semibold text-ink">
              {dealershipCopy.adminPromotions.emptyTitle}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {dealershipCopy.adminPromotions.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-hairline bg-neutral-2/40 text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPromotions.tableHeaderTitle}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPromotions.tableHeaderSchedule}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPromotions.tableHeaderStatus}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminPromotions.tableHeaderModels}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {dealershipCopy.adminPromotions.tableHeaderActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-neutral-2/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-ink">
                      <div>
                        <span className="font-semibold">{promo.title}</span>
                        <span className="block text-[11px] font-mono text-muted">
                          /{promo.slug}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      <span>{new Date(promo.startsAt).toLocaleDateString('id-ID')}</span>
                      <span className="block text-muted">
                        s/d {new Date(promo.endsAt).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {promo.status === 'published' ? (
                        <Badge variant="success" size="sm">
                          Dipublikasikan
                        </Badge>
                      ) : promo.status === 'draft' ? (
                        <Badge variant="neutral" size="sm">
                          Draf
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm">
                          Diarsipkan
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-body">
                      {promo.linkedModels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {promo.linkedModels.map((m) => (
                            <span
                              key={m.id}
                              className="text-[10px] bg-neutral-2 px-1.5 py-0.5 rounded-xs"
                            >
                              {m.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted italic">Semua Model</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(promo)}
                        className="text-xs px-2.5 py-1 min-h-[36px]"
                      >
                        {dealershipCopy.adminPromotions.editButton}
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
