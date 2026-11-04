'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import type { InquiryModelOption } from '@/types/inquiries';
import { submitInquiryAction } from '@/lib/inquiries/actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeIndonesianPhone, formatRupiah } from '@/lib/formatters';

interface InquiryFormProps {
  modelOptions: InquiryModelOption[];
  dealerWhatsApp?: string;
  privacyNotice?: string | null;
}

export function InquiryForm({
  modelOptions,
  dealerWhatsApp = '6281234567890',
  privacyNotice,
}: InquiryFormProps) {
  const searchParams = useSearchParams();

  // Match preselected parameters from search params without triggering cascading effect renders
  const matchedInitial = useMemo(() => {
    const modelParam = searchParams.get('model');
    const variantParam = searchParams.get('variant');
    const colorParam = searchParams.get('color');

    if (!modelParam) return null;

    const matchedModel = modelOptions.find(
      (m) =>
        m.slug.toLowerCase() === modelParam.toLowerCase() ||
        m.id === modelParam ||
        m.name.toLowerCase().includes(modelParam.toLowerCase())
    );

    if (!matchedModel) return null;

    let matchedVariantId = '';
    let matchedColorId = '';

    if (variantParam) {
      const matchedVariant = matchedModel.variants.find(
        (v) =>
          v.name.toLowerCase() === variantParam.toLowerCase() ||
          v.id === variantParam ||
          (v.code && v.code.toLowerCase() === variantParam.toLowerCase())
      );

      if (matchedVariant) {
        matchedVariantId = matchedVariant.id;

        if (colorParam) {
          const matchedColor = matchedVariant.colors.find(
            (c) => c.name.toLowerCase() === colorParam.toLowerCase() || c.id === colorParam
          );
          if (matchedColor) {
            matchedColorId = matchedColor.id;
          }
        }
      }
    }

    return {
      modelId: matchedModel.id,
      variantId: matchedVariantId,
      colorId: matchedColorId,
    };
  }, [searchParams, modelOptions]);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Sidoarjo');
  const [district, setDistrict] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    () => matchedInitial?.modelId || ''
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    () => matchedInitial?.variantId || ''
  );
  const [selectedColorId, setSelectedColorId] = useState<string>(
    () => matchedInitial?.colorId || ''
  );
  const [message, setMessage] = useState('');
  const [consentPrivacy, setConsentPrivacy] = useState(false);

  // Status & UI State
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    reference: string;
    modelName: string;
    variantName: string;
    colorName: string;
  } | null>(null);

  // Derived active model, variants, and colors
  const activeModel = modelOptions.find((m) => m.id === selectedModelId);
  const availableVariants = activeModel?.variants || [];
  const activeVariant = availableVariants.find((v) => v.id === selectedVariantId);
  const availableColors = activeVariant?.colors || [];
  const activeColor = availableColors.find((c) => c.id === selectedColorId);

  // Handle Model Selection Change
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedVariantId('');
    setSelectedColorId('');
  };

  // Handle Variant Selection Change
  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setSelectedColorId('');
  };

  // Client-Side Validation before Server Dispatch
  const validateClient = (): boolean => {
    const errors: Record<string, string[]> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = ['Nama lengkap minimal 2 karakter.'];
    }

    const cleanedPhone = whatsappNumber.replace(/[\s\-().]/g, '');
    const phoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/;
    if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
      errors.whatsappNumber = [
        'Nomor WhatsApp tidak valid. Masukkan nomor ponsel aktif (contoh: 081234567890).',
      ];
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = ['Format alamat email tidak valid.'];
    }

    if (!city.trim() || city.trim().length < 2) {
      errors.city = ['Kota / Kabupaten domisili wajib diisi.'];
    }

    if (message.trim().length > 1000) {
      errors.message = ['Pesan pertanyaan maksimal 1000 karakter.'];
    }

    if (!consentPrivacy) {
      errors.consentPrivacy = [
        'Persetujuan kebijakan privasi wajib dicentang untuk mengirim pertanyaan.',
      ];
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClient()) {
      return;
    }

    startTransition(async () => {
      const payload = {
        fullName: fullName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim() || null,
        city: city.trim(),
        district: district.trim() || null,
        modelId: selectedModelId || null,
        variantId: selectedVariantId || null,
        colorId: selectedColorId || null,
        modelNameSnapshot: activeModel?.name || null,
        variantNameSnapshot: activeVariant?.name || null,
        colorNameSnapshot: activeColor?.name || null,
        priceSnapshotIdr: activeVariant?.priceIdr ?? null,
        message: message.trim() || null,
        consentPrivacy,
        sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/hubungi',
      };

      const result = await submitInquiryAction(payload);

      if (!result.success) {
        setServerError(result.error || dealershipCopy.common.serverError);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      setSubmissionSuccess({
        reference: result.leadReference || 'INQ-SUCCESS',
        modelName: activeModel?.name || 'Pertanyaan Umum',
        variantName: activeVariant?.name || '-',
        colorName: activeColor?.name || '-',
      });
    });
  };

  // Generate WhatsApp Handoff URL after Successful Submission
  const getSuccessWhatsAppUrl = () => {
    if (!submissionSuccess) return '';
    const normPhone = normalizeIndonesianPhone(dealerWhatsApp);

    let messageText = `Hi, saya baru mengirim pertanyaan melalui website Honda Satrya Dealer Group. Referensi: [${submissionSuccess.reference}].`;
    if (submissionSuccess.modelName !== 'Pertanyaan Umum') {
      messageText += ` Saya tertarik dengan motor ${submissionSuccess.modelName}`;
      if (submissionSuccess.variantName !== '-') {
        messageText += ` tipe ${submissionSuccess.variantName}`;
      }
      if (submissionSuccess.colorName !== '-') {
        messageText += ` warna ${submissionSuccess.colorName}`;
      }
      messageText += '.';
    }
    messageText += ' Mohon informasi ketersediaan unit dan simulasi pembelian untuk wilayah saya.';

    return `https://wa.me/${normPhone}?text=${encodeURIComponent(messageText)}`;
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
    setFullName('');
    setWhatsappNumber('');
    setEmail('');
    setDistrict('');
    setMessage('');
    setConsentPrivacy(false);
    setFieldErrors({});
    setServerError(null);
  };

  // Success Confirmation Screen
  if (submissionSuccess) {
    const waUrl = getSuccessWhatsAppUrl();

    return (
      <Card variant="canvas" padding="lg" className="border-t-4 border-t-primary shadow-xs">
        <div className="text-center py-6 sm:py-8 space-y-5 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-status-success/10 text-status-success mx-auto flex items-center justify-center rounded-full">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <Badge variant="primary" size="sm">
              Terkirim
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink font-heading tracking-tight">
              {dealershipCopy.inquiry.successTitle}
            </h2>
            <p className="text-sm text-body leading-relaxed">
              {dealershipCopy.inquiry.successMessage}
            </p>
          </div>

          {/* Reference Box */}
          <div className="p-4 bg-neutral-2 border border-hairline rounded-none text-left space-y-1.5">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
              {dealershipCopy.inquiry.referencePrefix}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold font-mono text-ink tracking-wider">
                {submissionSuccess.reference}
              </span>
              <Badge variant="neutral" size="sm">
                Status: Baru
              </Badge>
            </div>
            {submissionSuccess.modelName !== 'Pertanyaan Umum' && (
              <p className="text-xs text-muted pt-1 border-t border-hairline mt-2">
                Motor: <strong className="text-ink">{submissionSuccess.modelName}</strong>
                {submissionSuccess.variantName !== '-' && ` (${submissionSuccess.variantName})`}
              </p>
            )}
          </div>

          {/* WhatsApp Direct Action */}
          <div className="space-y-3 pt-2">
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button variant="primary" fullWidth size="lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                {dealershipCopy.inquiry.whatsappHandoffCta}
              </Button>
            </a>

            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-muted hover:text-ink transition-colors font-medium underline"
            >
              Kirim Pertanyaan Lain
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Active form view
  return (
    <Card variant="canvas" padding="lg" className="border-t-4 border-t-primary">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-heading">
          {dealershipCopy.inquiry.title}
        </h2>
        <p className="mt-1 text-sm text-body leading-relaxed">{dealershipCopy.inquiry.subtitle}</p>
      </div>

      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 p-4 border border-red-200 bg-red-50 text-status-error text-sm rounded-none flex items-start justify-between"
        >
          <span>{serverError}</span>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-status-error font-bold ml-3 hover:underline text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Row 1: Full Name & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="inquiry-full-name"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5 font-heading"
            >
              {dealershipCopy.inquiry.fullNameLabel} <span className="text-primary">*</span>
            </label>
            <input
              id="inquiry-full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={dealershipCopy.inquiry.fullNamePlaceholder}
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'error-fullName' : undefined}
              className={`w-full px-3.5 py-2.5 bg-canvas border text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                fieldErrors.fullName ? 'border-status-error' : 'border-hairline hover:border-ink'
              }`}
            />
            {fieldErrors.fullName && (
              <p id="error-fullName" className="mt-1 text-xs text-status-error">
                {fieldErrors.fullName[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="inquiry-whatsapp"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5 font-heading"
            >
              {dealershipCopy.inquiry.whatsappLabel} <span className="text-primary">*</span>
            </label>
            <input
              id="inquiry-whatsapp"
              type="tel"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder={dealershipCopy.inquiry.whatsappPlaceholder}
              aria-invalid={Boolean(fieldErrors.whatsappNumber)}
              aria-describedby={fieldErrors.whatsappNumber ? 'error-whatsappNumber' : undefined}
              className={`w-full px-3.5 py-2.5 bg-canvas border text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                fieldErrors.whatsappNumber
                  ? 'border-status-error'
                  : 'border-hairline hover:border-ink'
              }`}
            />
            {fieldErrors.whatsappNumber && (
              <p id="error-whatsappNumber" className="mt-1 text-xs text-status-error">
                {fieldErrors.whatsappNumber[0]}
              </p>
            )}
          </div>
        </div>

        {/* Row 2: Email & City */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="inquiry-email"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5 font-heading"
            >
              {dealershipCopy.inquiry.emailLabel}
            </label>
            <input
              id="inquiry-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={dealershipCopy.inquiry.emailPlaceholder}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'error-email' : undefined}
              className={`w-full px-3.5 py-2.5 bg-canvas border text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                fieldErrors.email ? 'border-status-error' : 'border-hairline hover:border-ink'
              }`}
            />
            {fieldErrors.email && (
              <p id="error-email" className="mt-1 text-xs text-status-error">
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="inquiry-city"
              className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5 font-heading"
            >
              {dealershipCopy.inquiry.cityLabel} <span className="text-primary">*</span>
            </label>
            <input
              id="inquiry-city"
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={dealershipCopy.inquiry.cityPlaceholder}
              aria-invalid={Boolean(fieldErrors.city)}
              aria-describedby={fieldErrors.city ? 'error-city' : undefined}
              className={`w-full px-3.5 py-2.5 bg-canvas border text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                fieldErrors.city ? 'border-status-error' : 'border-hairline hover:border-ink'
              }`}
            />
            {fieldErrors.city && (
              <p id="error-city" className="mt-1 text-xs text-status-error">
                {fieldErrors.city[0]}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: District / Kecamatan (Optional) */}
        <div>
          <label
            htmlFor="inquiry-district"
            className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5 font-heading"
          >
            Kecamatan (Opsional)
          </label>
          <input
            id="inquiry-district"
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Contoh: Gedangan / Waru / Candi"
            aria-invalid={Boolean(fieldErrors.district)}
            aria-describedby={fieldErrors.district ? 'error-district' : undefined}
            className={`w-full px-3.5 py-2.5 bg-canvas border text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
              fieldErrors.district ? 'border-status-error' : 'border-hairline hover:border-ink'
            }`}
          />
          {fieldErrors.district && (
            <p id="error-district" className="mt-1 text-xs text-status-error">
              {fieldErrors.district[0]}
            </p>
          )}
        </div>

        {/* Row 4: Motorcycle Selection (Model, Variant, Color) */}
        <div className="p-4 bg-neutral-2/40 border border-hairline space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink font-heading">
              Unit Motor yang Diminati (Opsional)
            </span>
            {activeModel && (
              <button
                type="button"
                onClick={() => handleModelChange('')}
                className="text-xs text-primary hover:underline"
              >
                Atur Ulang Pilihan
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Model Select */}
            <div>
              <label htmlFor="inquiry-model" className="block text-xs font-medium text-muted mb-1">
                {dealershipCopy.inquiry.modelLabel}
              </label>
              <select
                id="inquiry-model"
                value={selectedModelId}
                onChange={(e) => handleModelChange(e.target.value)}
                aria-invalid={Boolean(fieldErrors.modelId)}
                aria-describedby={fieldErrors.modelId ? 'error-modelId' : undefined}
                className={`w-full px-3 py-2 bg-canvas border text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.modelId ? 'border-status-error' : 'border-hairline'
                }`}
              >
                <option value="">— Pertanyaan Umum / Belum Memilih —</option>
                {modelOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {fieldErrors.modelId && (
                <p id="error-modelId" className="mt-1 text-xs text-status-error">
                  {fieldErrors.modelId[0]}
                </p>
              )}
            </div>

            {/* Variant Select */}
            <div>
              <label
                htmlFor="inquiry-variant"
                className="block text-xs font-medium text-muted mb-1"
              >
                {dealershipCopy.inquiry.variantLabel}
              </label>
              <select
                id="inquiry-variant"
                disabled={!selectedModelId || availableVariants.length === 0}
                value={selectedVariantId}
                onChange={(e) => handleVariantChange(e.target.value)}
                aria-invalid={Boolean(fieldErrors.variantId)}
                aria-describedby={fieldErrors.variantId ? 'error-variantId' : undefined}
                className={`w-full px-3 py-2 bg-canvas border text-xs sm:text-sm text-ink disabled:opacity-50 disabled:bg-neutral-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.variantId ? 'border-status-error' : 'border-hairline'
                }`}
              >
                <option value="">
                  {!selectedModelId
                    ? 'Pilih model dahulu'
                    : availableVariants.length === 0
                      ? 'Tidak ada varian'
                      : '— Pilih Tipe / Varian —'}
                </option>
                {availableVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.priceIdr ? `(${formatRupiah(v.priceIdr)})` : ''}
                  </option>
                ))}
              </select>
              {fieldErrors.variantId && (
                <p id="error-variantId" className="mt-1 text-xs text-status-error">
                  {fieldErrors.variantId[0]}
                </p>
              )}
            </div>

            {/* Color Select */}
            <div>
              <label htmlFor="inquiry-color" className="block text-xs font-medium text-muted mb-1">
                {dealershipCopy.inquiry.colorLabel}
              </label>
              <select
                id="inquiry-color"
                disabled={!selectedVariantId || availableColors.length === 0}
                value={selectedColorId}
                onChange={(e) => setSelectedColorId(e.target.value)}
                aria-invalid={Boolean(fieldErrors.colorId)}
                aria-describedby={fieldErrors.colorId ? 'error-colorId' : undefined}
                className={`w-full px-3 py-2 bg-canvas border text-xs sm:text-sm text-ink disabled:opacity-50 disabled:bg-neutral-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.colorId ? 'border-status-error' : 'border-hairline'
                }`}
              >
                <option value="">
                  {!selectedVariantId
                    ? 'Pilih varian dahulu'
                    : availableColors.length === 0
                      ? 'Tidak ada warna'
                      : '— Pilih Warna Resmi —'}
                </option>
                {availableColors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.colorId && (
                <p id="error-colorId" className="mt-1 text-xs text-status-error">
                  {fieldErrors.colorId[0]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Message */}
        <div>
          <label
            htmlFor="inquiry-message"
            className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5 font-heading"
          >
            {dealershipCopy.inquiry.messageLabel}
          </label>
          <textarea
            id="inquiry-message"
            rows={3}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={dealershipCopy.inquiry.messagePlaceholder}
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? 'error-message' : undefined}
            className={`w-full px-3.5 py-2.5 bg-canvas border text-sm text-ink placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
              fieldErrors.message ? 'border-status-error' : 'border-hairline hover:border-ink'
            }`}
          />
          {fieldErrors.message && (
            <p id="error-message" className="mt-1 text-xs text-status-error">
              {fieldErrors.message[0]}
            </p>
          )}
        </div>

        {/* Row 6: Privacy Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.target.checked)}
              aria-invalid={Boolean(fieldErrors.consentPrivacy)}
              aria-describedby={fieldErrors.consentPrivacy ? 'error-consentPrivacy' : undefined}
              className="mt-1 h-4 w-4 rounded-none border-hairline text-primary focus:ring-primary"
            />
            <span className="text-xs text-body leading-relaxed">
              {dealershipCopy.inquiry.privacyConsent} <span className="text-primary">*</span>
            </span>
          </label>
          {privacyNotice && (
            <details className="mt-2 ml-7 text-[11px] text-muted">
              <summary className="cursor-pointer hover:text-ink font-medium select-none">
                Baca Ringkasan Kebijakan Privasi & Ketentuan
              </summary>
              <div className="mt-2 p-3 bg-neutral-2/50 border border-hairline text-body leading-relaxed whitespace-pre-wrap">
                {privacyNotice}
              </div>
            </details>
          )}
          {fieldErrors.consentPrivacy && (
            <p id="error-consentPrivacy" className="mt-1.5 text-xs text-status-error ml-7">
              {fieldErrors.consentPrivacy[0]}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isPending}>
            {isPending
              ? dealershipCopy.inquiry.submittingButton
              : dealershipCopy.inquiry.submitButton}
          </Button>
        </div>
      </form>
    </Card>
  );
}
