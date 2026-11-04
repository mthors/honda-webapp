'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { SiteSettings, DealershipItem } from '@/types/settings';
import { dealershipCopy } from '@/content/copy/id';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { updateSiteSettingsAction } from '@/lib/settings/actions';

interface SettingsManagementViewProps {
  initialSettings: SiteSettings | null;
  dealerships: DealershipItem[];
}

export function SettingsManagementView({
  initialSettings,
  dealerships,
}: SettingsManagementViewProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(initialSettings);

  // Form State
  const [dealerName, setDealerName] = useState(settings?.dealerName || 'Honda Satrya Dealer Group');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsappNumber || '6281234567890');
  const [publicEmail, setPublicEmail] = useState(settings?.publicEmail || 'info@satryagroup.co.id');
  const [consultationHours, setConsultationHours] = useState(
    settings?.openingHours?.consultation_hours || 'Senin - Sabtu: 08:00 - 17:00 WIB'
  );
  const [instagramUrl, setInstagramUrl] = useState(
    settings?.socialLinks?.instagram || 'https://instagram.com/hondasatryagroup'
  );
  const [facebookUrl, setFacebookUrl] = useState(
    settings?.socialLinks?.facebook || 'https://facebook.com/hondasatryagroup'
  );
  const [privacyNotice, setPrivacyNotice] = useState(
    settings?.privacyNotice ||
      'Kebijakan Privasi Honda Satrya Dealer Group: Kami berkomitmen untuk melindungi dan menghargai privasi data pribadi pelanggan sesuai peraturan perundang-undangan yang berlaku di Indonesia.'
  );

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      const res = await updateSiteSettingsAction({
        dealerName,
        whatsappNumber,
        publicEmail: publicEmail.trim() || null,
        consultationHours: consultationHours.trim() || null,
        instagramUrl: instagramUrl.trim() || null,
        facebookUrl: facebookUrl.trim() || null,
        privacyNotice,
      });

      if (!res.success) {
        setFormError(res.error || 'Gagal menyimpan pengaturan.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        return;
      }

      if (res.data) {
        setSettings(res.data);
      }
      setSuccessMessage(dealershipCopy.adminSettings.saveSuccess);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kendala koneksi dengan server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 max-w-5xl">
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminSettings.title}
          </h1>
          <p className="mt-1 text-sm text-body">{dealershipCopy.adminSettings.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/dealerships"
            className="px-3.5 py-1.5 text-xs font-semibold text-ink bg-surface border border-hairline rounded-xs hover:bg-neutral-2 hover:border-ink transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <svg
              className="w-4 h-4 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>{dealershipCopy.adminSettings.manageDealershipsButton}</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
          <Badge variant="primary" size="sm">
            Tingkat Grup
          </Badge>
          {settings?.updatedAt && (
            <span className="text-xs text-muted">
              Diperbarui: {new Date(settings.updatedAt).toLocaleDateString('id-ID')}
            </span>
          )}
        </div>
      </section>

      {/* 2. Group Scope Architectural Callout */}
      <Card padding="md" className="border-l-4 border-l-primary bg-canvas">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-1 bg-primary/10 text-primary shrink-0 mt-0.5" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-ink font-heading">
                {dealershipCopy.adminSettings.scopeNoticeTitle}
              </h2>
              <p className="text-xs text-body leading-relaxed">
                {dealershipCopy.adminSettings.scopeNoticeDesc}
              </p>
            </div>
          </div>
          <Link
            href="/admin/dealerships"
            className="shrink-0 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-xs hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Buka Manajemen Dealer</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </Card>

      {/* 3. Alerts */}
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

      {/* 4. Group Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg" className="space-y-6 border border-hairline">
          <h2 className="text-base font-bold text-ink font-heading border-b border-hairline pb-3">
            Identitas & Kontak Sentral Grup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dealer Group Name */}
            <div className="space-y-1.5">
              <label htmlFor="group-name" className="block text-xs font-semibold text-ink">
                {dealershipCopy.adminSettings.dealerNameLabel}{' '}
                <span className="text-primary">*</span>
              </label>
              <input
                id="group-name"
                type="text"
                value={dealerName}
                onChange={(e) => setDealerName(e.target.value)}
                placeholder={dealershipCopy.adminSettings.dealerNamePlaceholder}
                required
                className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {fieldErrors.dealerName && (
                <p className="text-[11px] text-primary">{fieldErrors.dealerName[0]}</p>
              )}
            </div>

            {/* Central WhatsApp Number */}
            <div className="space-y-1.5">
              <label htmlFor="group-whatsapp" className="block text-xs font-semibold text-ink">
                {dealershipCopy.adminSettings.whatsappLabel} <span className="text-primary">*</span>
              </label>
              <input
                id="group-whatsapp"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={dealershipCopy.adminSettings.whatsappPlaceholder}
                required
                className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
              <p className="text-[11px] text-muted leading-tight">
                {dealershipCopy.adminSettings.whatsappHelp}
              </p>
              {fieldErrors.whatsappNumber && (
                <p className="text-[11px] text-primary">{fieldErrors.whatsappNumber[0]}</p>
              )}
            </div>

            {/* Central Public Email */}
            <div className="space-y-1.5">
              <label htmlFor="group-email" className="block text-xs font-semibold text-ink">
                {dealershipCopy.adminSettings.emailLabel}
              </label>
              <input
                id="group-email"
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                placeholder={dealershipCopy.adminSettings.emailPlaceholder}
                className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              />
              {fieldErrors.publicEmail && (
                <p className="text-[11px] text-primary">{fieldErrors.publicEmail[0]}</p>
              )}
            </div>

            {/* Central Consultation Hours */}
            <div className="space-y-1.5">
              <label htmlFor="group-hours" className="block text-xs font-semibold text-ink">
                {dealershipCopy.adminSettings.consultationHoursLabel}
              </label>
              <input
                id="group-hours"
                type="text"
                value={consultationHours}
                onChange={(e) => setConsultationHours(e.target.value)}
                placeholder={dealershipCopy.adminSettings.consultationHoursPlaceholder}
                className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary"
              />
              {fieldErrors.consultationHours && (
                <p className="text-[11px] text-primary">{fieldErrors.consultationHours[0]}</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="pt-4 border-t border-hairline space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-heading">
              Media Sosial Resmi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="group-ig" className="block text-xs font-semibold text-ink">
                  {dealershipCopy.adminSettings.socialInstagramLabel}
                </label>
                <input
                  id="group-ig"
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder={dealershipCopy.adminSettings.socialInstagramPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
                {fieldErrors.instagramUrl && (
                  <p className="text-[11px] text-primary">{fieldErrors.instagramUrl[0]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="group-fb" className="block text-xs font-semibold text-ink">
                  {dealershipCopy.adminSettings.socialFacebookLabel}
                </label>
                <input
                  id="group-fb"
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder={dealershipCopy.adminSettings.socialFacebookPlaceholder}
                  className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                />
                {fieldErrors.facebookUrl && (
                  <p className="text-[11px] text-primary">{fieldErrors.facebookUrl[0]}</p>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="pt-4 border-t border-hairline space-y-1.5">
            <label htmlFor="group-privacy" className="block text-xs font-semibold text-ink">
              {dealershipCopy.adminSettings.privacyNoticeLabel}{' '}
              <span className="text-primary">*</span>
            </label>
            <textarea
              id="group-privacy"
              rows={4}
              value={privacyNotice}
              onChange={(e) => setPrivacyNotice(e.target.value)}
              required
              className="w-full p-3 text-xs bg-canvas text-ink border border-hairline rounded-xs focus:ring-1 focus:ring-primary focus:border-primary leading-relaxed"
            />
            <p className="text-[11px] text-muted">
              {dealershipCopy.adminSettings.privacyNoticeHelp}
            </p>
            {fieldErrors.privacyNotice && (
              <p className="text-[11px] text-primary">{fieldErrors.privacyNotice[0]}</p>
            )}
          </div>

          {/* Submit Affordance */}
          <div className="pt-4 border-t border-hairline flex items-center justify-end">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? dealershipCopy.adminSettings.savingButton
                : dealershipCopy.adminSettings.saveButton}
            </Button>
          </div>
        </Card>
      </form>

      {/* 5. Separate Dealership Showrooms Section */}
      <section className="space-y-4 pt-4 border-t border-hairline">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink font-heading">
              {dealershipCopy.adminSettings.dealershipsSectionTitle}
            </h2>
            <p className="text-xs text-body">
              {dealershipCopy.adminSettings.dealershipsSectionSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dealerships"
              className="px-3.5 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 rounded-xs hover:bg-primary/20 transition-colors inline-flex items-center gap-1.5"
            >
              <span>{dealershipCopy.adminSettings.manageDealershipsButton}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <Badge variant="warning" size="sm">
              {dealershipCopy.adminSettings.syntheticBadge}
            </Badge>
          </div>
        </div>

        {/* Demo Notice Banner */}
        <div className="p-3 bg-neutral-2 border border-hairline text-xs text-body leading-relaxed flex items-start gap-2.5">
          <span className="text-amber-600 font-bold shrink-0">&bull;</span>
          <span>{dealershipCopy.adminSettings.syntheticNotice}</span>
        </div>

        {/* Dealerships Table */}
        <Card padding="none" className="border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="bg-neutral-2/70 border-b border-hairline font-bold uppercase tracking-wider text-muted font-heading">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nama Showroom Dealer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Kota / Wilayah
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Alamat Fisik
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tipe Rekaman
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline bg-canvas">
                {dealerships.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      Belum ada entitas dealer terdaftar.
                    </td>
                  </tr>
                ) : (
                  dealerships.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-2/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">
                        {d.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-ink">{d.city}</span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {d.address || (
                          <span className="italic text-muted/80">
                            {dealershipCopy.adminSettings.fieldUnset}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {d.isSynthetic ? (
                          <Badge variant="warning" size="sm">
                            Demo Sintetis
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Resmi Terverifikasi
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Badge variant={d.isActive ? 'success' : 'neutral'} size="sm">
                          {d.isActive
                            ? dealershipCopy.adminSettings.statusActive
                            : dealershipCopy.adminSettings.statusInactive}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
