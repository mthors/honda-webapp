'use client';

import React, { useState, useTransition } from 'react';
import type { AdminHeroBannerItem } from '@/lib/admin/queries';
import { upsertHeroBannerAction } from '@/lib/admin/actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface BannerManagementViewProps {
  initialBanners: AdminHeroBannerItem[];
}

export function BannerManagementView({ initialBanners }: BannerManagementViewProps) {
  const [banners, setBanners] = useState<AdminHeroBannerItem[]>(initialBanners);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [desktopImagePath, setDesktopImagePath] = useState('');
  const [mobileImagePath, setMobileImagePath] = useState('');
  const [altText, setAltText] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');

  // Status & Feedback State
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setDesktopImagePath('');
    setMobileImagePath('');
    setAltText('');
    setCtaLabel('');
    setCtaUrl('');
    setStartsAt('');
    setEndsAt('');
    setSortOrder(banners.length > 0 ? Math.max(...banners.map((b) => b.sortOrder)) + 1 : 0);
    setStatus('draft');
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (banner: AdminHeroBannerItem) => {
    setEditingId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setDesktopImagePath(banner.desktopImagePath);
    setMobileImagePath(banner.mobileImagePath || '');
    setAltText(banner.altText);
    setCtaLabel(banner.ctaLabel || '');
    setCtaUrl(banner.ctaUrl || '');
    setStartsAt(banner.startsAt ? new Date(banner.startsAt).toISOString().slice(0, 16) : '');
    setEndsAt(banner.endsAt ? new Date(banner.endsAt).toISOString().slice(0, 16) : '');
    setSortOrder(banner.sortOrder);
    setStatus(banner.status);
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

    if (!title.trim() || title.trim().length < 3) {
      setFormError('Judul spanduk minimal 3 karakter.');
      return;
    }

    if (!desktopImagePath.trim()) {
      setFormError('Jalur gambar desktop wajib diisi.');
      return;
    }

    if (!altText.trim() || altText.trim().length < 3) {
      setFormError('Teks aksesibilitas (alt text) minimal 3 karakter.');
      return;
    }

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setFormError('Waktu berakhir tayang harus setelah waktu mulai tayang.');
      return;
    }

    startTransition(async () => {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        desktopImagePath: desktopImagePath.trim(),
        mobileImagePath: mobileImagePath.trim() || null,
        altText: altText.trim(),
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        sortOrder: Number(sortOrder) || 0,
        status,
      };

      const res = await upsertHeroBannerAction(payload);

      if (!res.success) {
        setFormError(res.error || 'Gagal menyimpan data spanduk hero.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        return;
      }

      setSuccessMessage(dealershipCopy.adminBanners.saveSuccess);
      setIsEditing(false);

      const updatedRow: AdminHeroBannerItem = {
        id: (res.data as { id: string })?.id || editingId || 'temp-id',
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        desktopImagePath: desktopImagePath.trim(),
        mobileImagePath: mobileImagePath.trim() || null,
        altText: altText.trim(),
        ctaLabel: ctaLabel.trim() || null,
        ctaUrl: ctaUrl.trim() || null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        sortOrder: Number(sortOrder) || 0,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        setBanners((prev) => prev.map((item) => (item.id === editingId ? updatedRow : item)));
      } else {
        setBanners((prev) => [...prev, updatedRow].sort((a, b) => a.sortOrder - b.sortOrder));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminBanners.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {dealershipCopy.adminBanners.subtitle}
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
              + {dealershipCopy.adminBanners.addNewButton}
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
                ? dealershipCopy.adminBanners.formTitleEdit
                : dealershipCopy.adminBanners.formTitleCreate}
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
                  htmlFor="banner-title"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.titleLabel}
                </label>
                <input
                  id="banner-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={dealershipCopy.adminBanners.titlePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.title.join(', ')}
                  </p>
                )}
              </div>

              {/* Subtitle */}
              <div>
                <label
                  htmlFor="banner-subtitle"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.subtitleLabel}
                </label>
                <input
                  id="banner-subtitle"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder={dealershipCopy.adminBanners.subtitlePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Desktop Image Path */}
              <div>
                <label
                  htmlFor="banner-desktop-image"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.desktopImageLabel}
                </label>
                <input
                  id="banner-desktop-image"
                  type="text"
                  value={desktopImagePath}
                  onChange={(e) => setDesktopImagePath(e.target.value)}
                  placeholder={dealershipCopy.adminBanners.desktopImagePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
                {fieldErrors.desktopImagePath && (
                  <p className="mt-1 text-[11px] text-status-error">
                    {fieldErrors.desktopImagePath.join(', ')}
                  </p>
                )}
              </div>

              {/* Mobile Image Path */}
              <div>
                <label
                  htmlFor="banner-mobile-image"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.mobileImageLabel}
                </label>
                <input
                  id="banner-mobile-image"
                  type="text"
                  value={mobileImagePath}
                  onChange={(e) => setMobileImagePath(e.target.value)}
                  placeholder={dealershipCopy.adminBanners.mobileImagePlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
              </div>
            </div>

            {/* Alt Text */}
            <div>
              <label
                htmlFor="banner-alt-text"
                className="block text-xs font-semibold text-ink mb-1.5"
              >
                {dealershipCopy.adminBanners.altTextLabel}
              </label>
              <input
                id="banner-alt-text"
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={dealershipCopy.adminBanners.altTextPlaceholder}
                className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <p className="mt-1 text-[10px] text-muted">
                Wajib diisi demi aksesibilitas pembaca layar (screen reader).
              </p>
              {fieldErrors.altText && (
                <p className="mt-1 text-[11px] text-status-error">
                  {fieldErrors.altText.join(', ')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CTA Label */}
              <div>
                <label
                  htmlFor="banner-cta-label"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.ctaLabelLabel}
                </label>
                <input
                  id="banner-cta-label"
                  type="text"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder={dealershipCopy.adminBanners.ctaLabelPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* CTA URL */}
              <div>
                <label
                  htmlFor="banner-cta-url"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.ctaUrlLabel}
                </label>
                <input
                  id="banner-cta-url"
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder={dealershipCopy.adminBanners.ctaUrlPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Starts At */}
              <div>
                <label
                  htmlFor="banner-starts-at"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.startsAtLabel}
                </label>
                <input
                  id="banner-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Ends At */}
              <div>
                <label
                  htmlFor="banner-ends-at"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.endsAtLabel}
                </label>
                <input
                  id="banner-ends-at"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label
                  htmlFor="banner-sort-order"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.sortOrderLabel}
                </label>
                <input
                  id="banner-sort-order"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="banner-status"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  {dealershipCopy.adminBanners.statusLabel}
                </label>
                <select
                  id="banner-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="draft">Draf (Tidak Tampil)</option>
                  <option value="published">Publikasi (Aktif)</option>
                  <option value="archived">Diarsipkan</option>
                </select>
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

      {/* Banners Table */}
      <div className="border border-hairline bg-surface rounded-none overflow-hidden">
        {banners.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-semibold text-ink">
              {dealershipCopy.adminBanners.emptyTitle}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {dealershipCopy.adminBanners.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-hairline bg-neutral-2/40 text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminBanners.tableHeaderTitle}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminBanners.tableHeaderOrder}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminBanners.tableHeaderSchedule}
                  </th>
                  <th className="py-3 px-4 font-semibold">
                    {dealershipCopy.adminBanners.tableHeaderStatus}
                  </th>
                  <th className="py-3 px-4 font-semibold text-right">
                    {dealershipCopy.adminBanners.tableHeaderActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-neutral-2/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-ink">
                      <div>
                        <span className="font-semibold">{banner.title}</span>
                        {banner.subtitle && (
                          <span className="block text-[11px] text-muted">{banner.subtitle}</span>
                        )}
                        <span className="block text-[10px] font-mono text-muted truncate max-w-xs">
                          {banner.desktopImagePath}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-ink">
                      #{banner.sortOrder}
                    </td>
                    <td className="py-3.5 px-4 text-muted text-[11px]">
                      {banner.startsAt || banner.endsAt ? (
                        <>
                          <span>
                            {banner.startsAt
                              ? new Date(banner.startsAt).toLocaleDateString('id-ID')
                              : 'Kapan saja'}
                          </span>
                          <span className="block text-muted">
                            s/d{' '}
                            {banner.endsAt
                              ? new Date(banner.endsAt).toLocaleDateString('id-ID')
                              : 'Seterusnya'}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted italic">Selalu Aktif</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {banner.status === 'published' ? (
                        <Badge variant="success" size="sm">
                          Dipublikasikan
                        </Badge>
                      ) : banner.status === 'draft' ? (
                        <Badge variant="neutral" size="sm">
                          Draf
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm">
                          Diarsipkan
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(banner)}
                        className="text-xs px-2.5 py-1 min-h-[36px]"
                      >
                        {dealershipCopy.adminBanners.editButton}
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
