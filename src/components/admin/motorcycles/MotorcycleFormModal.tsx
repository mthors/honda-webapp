'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { createClient } from '@/lib/supabase/client';
import type {
  AdminCategoryOption,
  AdminColorOption,
  AdminMotorcycleDetail,
  CreateMotorcycleModelInput,
  VariantInput,
  ImageInput,
  ModelStatus,
  ImageRole,
} from '@/types/motorcycle';
import {
  createMotorcycleModelAction,
  updateMotorcycleModelAction,
} from '@/lib/motorcycles/actions';

interface MotorcycleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: AdminCategoryOption[];
  colors: AdminColorOption[];
  modelDetail?: AdminMotorcycleDetail | null;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function MotorcycleFormModal({
  isOpen,
  onClose,
  onSaved,
  categories,
  colors,
  modelDetail,
}: MotorcycleFormModalProps) {
  const isEditing = Boolean(modelDetail);

  // Tabs: 'general' | 'variants' | 'images'
  const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'images'>('general');

  // General fields initialized directly from modelDetail prop
  const [name, setName] = useState(modelDetail?.name || '');
  const [slug, setSlug] = useState(modelDetail?.slug || '');
  const [isSlugManual, setIsSlugManual] = useState(Boolean(modelDetail));
  const [categoryId, setCategoryId] = useState(modelDetail?.categoryId || categories[0]?.id || '');
  const [engineCc, setEngineCc] = useState<string>(
    modelDetail?.engineCc ? String(modelDetail.engineCc) : ''
  );
  const [transmission, setTransmission] = useState(
    modelDetail?.transmission || (modelDetail ? '' : 'Otomatis, V-Matic')
  );
  const [shortDescription, setShortDescription] = useState(modelDetail?.shortDescription || '');
  const [description, setDescription] = useState(modelDetail?.description || '');
  const [status, setStatus] = useState<ModelStatus>(modelDetail?.status || 'draft');
  const [isFeatured, setIsFeatured] = useState(modelDetail?.isFeatured || false);
  const [isNew, setIsNew] = useState(modelDetail?.isNew ?? true);
  const [seoTitle, setSeoTitle] = useState(modelDetail?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(modelDetail?.seoDescription || '');

  // Variants list
  const [variants, setVariants] = useState<VariantInput[]>(() => {
    if (modelDetail && modelDetail.variants.length > 0) {
      return modelDetail.variants.map((v) => ({
        id: v.id,
        name: v.name,
        code: v.code || '',
        description: v.description || '',
        sortOrder: v.sortOrder,
        status: v.status,
        colorIds: v.colorIds,
      }));
    }
    return [{ name: 'Standard', code: '', description: '', sortOrder: 1, status: 'active', colorIds: [] }];
  });

  // Images list
  const [images, setImages] = useState<ImageInput[]>(() => {
    if (modelDetail && modelDetail.images.length > 0) {
      return modelDetail.images.map((img) => ({
        id: img.id,
        storagePath: img.storagePath,
        altText: img.altText,
        imageRole: img.imageRole,
        sortOrder: img.sortOrder,
      }));
    }
    return [
      {
        storagePath: '/images/motorcycle-placeholder.svg',
        altText: 'Foto Tampak Depan',
        imageRole: 'card',
        sortOrder: 1,
      },
    ];
  });

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      setSlug(toSlug(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManual(true);
    setSlug(val.toLowerCase().replace(/\s+/g, '-'));
  };

  // Variant operations
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: `Varian ${prev.length + 1}`,
        code: '',
        description: '',
        sortOrder: prev.length + 1,
        status: 'active',
        colorIds: [],
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateVariant = (index: number, updates: Partial<VariantInput>) => {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, ...updates } : v))
    );
  };

  const toggleVariantColor = (vIndex: number, colorId: string) => {
    setVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== vIndex) return v;
        const exists = v.colorIds.includes(colorId);
        const nextColors = exists
          ? v.colorIds.filter((id) => id !== colorId)
          : [...v.colorIds, colorId];
        return { ...v, colorIds: nextColors };
      })
    );
  };

  // Image operations
  const addImage = () => {
    setImages((prev) => [
      ...prev,
      {
        storagePath: '',
        altText: name ? `${name} Tampak Samping` : 'Foto Motor',
        imageRole: prev.length === 0 ? 'card' : 'gallery',
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateImage = (index: number, updates: Partial<ImageInput>) => {
    setImages((prev) =>
      prev.map((img, idx) => (idx === index ? { ...img, ...updates } : img))
    );
  };

  // File upload to Supabase Storage 'motorcycles' bucket
  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 5 MB.');
      return;
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setErrorMessage('Format gambar harus berupa JPG, PNG, atau WebP.');
      return;
    }

    try {
      setUploadingImageIndex(index);
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const cleanSlug = slug || 'model';
      const fileName = `${cleanSlug}-${Date.now()}-${index + 1}.${ext}`;

      const { data, error } = await supabase.storage
        .from('motorcycles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        setErrorMessage(`Upload gagal: ${error.message}`);
      } else if (data) {
        updateImage(index, { storagePath: data.path });
      }
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage('Terjadi kesalahan saat mengunggah gambar ke Storage.');
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const parsedEngineCc = engineCc.trim() ? parseInt(engineCc.trim(), 10) : null;

    const payload: CreateMotorcycleModelInput = {
      name: name.trim(),
      slug: slug.trim(),
      categoryId,
      shortDescription: shortDescription.trim() || null,
      description: description.trim() || null,
      engineCc: parsedEngineCc,
      transmission: transmission.trim() || null,
      isFeatured,
      isNew,
      status,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      variants,
      images: images.filter((img) => img.storagePath.trim() !== ''),
    };

    let result;
    if (isEditing && modelDetail) {
      result = await updateMotorcycleModelAction({
        ...payload,
        id: modelDetail.id,
      });
    } else {
      result = await createMotorcycleModelAction(payload);
    }

    setIsSubmitting(false);

    if (result.success) {
      onSaved();
      onClose();
    } else {
      setErrorMessage(result.error || 'Gagal menyimpan data model motor.');
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
    }
  };

  const copy = dealershipCopy.adminMotorcycles;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="relative w-full max-w-4xl bg-surface border border-hairline shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] rounded-none overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-hairline bg-surface shrink-0">
          <div>
            <h2 id="modal-headline" className="text-base font-bold text-ink font-heading">
              {isEditing ? copy.formTitleEdit : copy.formTitleCreate}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isEditing ? `ID: ${modelDetail?.id}` : 'Lengkapi detail spesifikasi, varian, dan foto motor.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink hover:bg-neutral-2 p-1.5 rounded-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Tutup formulir"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-neutral-2/40 px-4 sm:px-6 gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'general'
                ? 'border-primary text-primary bg-surface font-bold shadow-2xs'
                : 'border-transparent text-muted hover:text-ink hover:bg-neutral-2/60'
            }`}
          >
            {copy.sectionGeneral}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'variants'
                ? 'border-primary text-primary bg-surface font-bold shadow-2xs'
                : 'border-transparent text-muted hover:text-ink hover:bg-neutral-2/60'
            }`}
          >
            <span>{copy.sectionVariants}</span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === 'variants'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-neutral-2 text-muted'
              }`}
            >
              {variants.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center space-x-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'images'
                ? 'border-primary text-primary bg-surface font-bold shadow-2xs'
                : 'border-transparent text-muted hover:text-ink hover:bg-neutral-2/60'
            }`}
          >
            <span>{copy.sectionImages}</span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                activeTab === 'images'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-neutral-2 text-muted'
              }`}
            >
              {images.length}
            </span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-status-error/10 border-l-4 border-status-error text-status-error text-xs">
            <p className="font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-surface">
            {/* =================================================================
                TAB 1: GENERAL INFORMASI
               ================================================================= */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="model-name" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.nameLabel} <span className="text-status-error">*</span>
                    </label>
                    <input
                      id="model-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={copy.namePlaceholder}
                      className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-[11px] text-status-error">{fieldErrors.name.join(', ')}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div>
                    <label htmlFor="model-slug" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.slugLabel} <span className="text-status-error">*</span>
                    </label>
                    <input
                      id="model-slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder={copy.slugPlaceholder}
                      className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono transition-colors"
                    />
                    <p className="mt-1 text-[10px] text-muted">{copy.slugHelp}</p>
                    {fieldErrors.slug && (
                      <p className="mt-1 text-[11px] text-status-error">{fieldErrors.slug.join(', ')}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="model-category" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.categoryLabel} <span className="text-status-error">*</span>
                    </label>
                    <select
                      id="model-category"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.categoryId && (
                      <p className="mt-1 text-[11px] text-status-error">{fieldErrors.categoryId.join(', ')}</p>
                    )}
                  </div>

                  {/* Engine CC */}
                  <div>
                    <label htmlFor="model-cc" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.engineCcLabel}
                    </label>
                    <input
                      id="model-cc"
                      type="number"
                      min={1}
                      value={engineCc}
                      onChange={(e) => setEngineCc(e.target.value)}
                      placeholder={copy.engineCcPlaceholder}
                      className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Transmission */}
                  <div>
                    <label htmlFor="model-transmission" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.transmissionLabel}
                    </label>
                    <input
                      id="model-transmission"
                      type="text"
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      placeholder={copy.transmissionPlaceholder}
                      className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Status */}
                  <div className="sm:col-span-2">
                    <label htmlFor="model-status" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.statusLabel}
                    </label>
                    <select
                      id="model-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ModelStatus)}
                      className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                      <option value="draft">{copy.statusDraft} (Hanya Admin)</option>
                      <option value="published">{copy.statusPublished} (Tampil Publik)</option>
                      <option value="archived">{copy.statusArchived} (Sembunyikan dari Publik)</option>
                    </select>
                    <p className="mt-1 text-[10px] text-muted">{copy.statusHelp}</p>
                  </div>

                  {/* Featured and New toggles */}
                  <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center space-x-2 text-xs font-medium text-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="rounded-none border-hairline text-primary focus:ring-2 focus:ring-primary h-4 w-4"
                      />
                      <span>{copy.isFeaturedLabel}</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-ink cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isNew}
                        onChange={(e) => setIsNew(e.target.checked)}
                        className="rounded-none border-hairline text-primary focus:ring-2 focus:ring-primary h-4 w-4"
                      />
                      <span>{copy.isNewLabel}</span>
                    </label>
                  </div>

                  {/* Short Description */}
                  <div className="sm:col-span-2">
                    <label htmlFor="model-short-desc" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.shortDescriptionLabel}
                    </label>
                    <textarea
                      id="model-short-desc"
                      rows={2}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder={copy.shortDescriptionPlaceholder}
                      className="w-full p-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Long Description */}
                  <div className="sm:col-span-2">
                    <label htmlFor="model-desc" className="block text-xs font-semibold text-ink mb-1.5">
                      {copy.descriptionLabel}
                    </label>
                    <textarea
                      id="model-desc"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={copy.descriptionPlaceholder}
                      className="w-full p-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                  </div>

                  {/* SEO Section */}
                  <div className="sm:col-span-2 pt-4 border-t border-hairline space-y-3">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">{copy.sectionSeo}</h4>
                    <div>
                      <label htmlFor="model-seo-title" className="block text-xs font-semibold text-ink mb-1">
                        {copy.seoTitleLabel}
                      </label>
                      <input
                        id="model-seo-title"
                        type="text"
                        value={seoTitle}
                        onChange={(e) => setSeoTitle(e.target.value)}
                        placeholder={copy.seoTitlePlaceholder}
                        className="w-full h-9 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="model-seo-desc" className="block text-xs font-semibold text-ink mb-1">
                        {copy.seoDescriptionLabel}
                      </label>
                      <input
                        id="model-seo-desc"
                        type="text"
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder={copy.seoDescriptionPlaceholder}
                        className="w-full h-9 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================
                TAB 2: VARIAN & WARNA
               ================================================================= */}
            {activeTab === 'variants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-ink">{copy.variantsTitle}</h3>
                    <p className="text-[11px] text-muted">{copy.variantsHelp}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    {copy.addVariantButton}
                  </Button>
                </div>

                {variants.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-hairline text-muted text-xs bg-neutral-2/20">
                    Belum ada varian. Klik &quot;{copy.addVariantButton}&quot; untuk menambahkan tipe varian motor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variants.map((v, vIdx) => (
                      <div
                        key={v.id || vIdx}
                        className="p-4 border border-hairline bg-neutral-2/15 rounded-none space-y-3 relative shadow-2xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-hairline">
                          <span className="text-xs font-bold text-ink">
                            Varian #{vIdx + 1}: {v.name || 'Tanpa Nama'}
                          </span>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(vIdx)}
                              className="text-status-error text-xs hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-status-error"
                            >
                              Hapus Varian
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-ink mb-1">
                              {copy.variantNameLabel} *
                            </label>
                            <input
                              type="text"
                              required
                              value={v.name}
                              onChange={(e) => updateVariant(vIdx, { name: e.target.value })}
                              placeholder={copy.variantNamePlaceholder}
                              className="w-full h-8 px-2.5 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-ink mb-1">
                              {copy.variantCodeLabel}
                            </label>
                            <input
                              type="text"
                              value={v.code || ''}
                              onChange={(e) => updateVariant(vIdx, { code: e.target.value })}
                              placeholder={copy.variantCodePlaceholder}
                              className="w-full h-8 px-2.5 text-xs bg-canvas text-ink border border-hairline rounded-none font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-ink mb-1">Status</label>
                            <select
                              value={v.status}
                              onChange={(e) =>
                                updateVariant(vIdx, { status: e.target.value as 'active' | 'inactive' })
                              }
                              className="w-full h-8 px-2.5 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                            >
                              <option value="active">Aktif</option>
                              <option value="inactive">Nonaktif</option>
                            </select>
                          </div>
                        </div>

                        {/* Color checkboxes */}
                        <div className="pt-2">
                          <label className="block text-[11px] font-semibold text-ink mb-1.5">
                            {copy.variantColorsLabel}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {colors.map((c) => {
                              const isChecked = v.colorIds.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => toggleVariantColor(vIdx, c.id)}
                                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs border rounded-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    isChecked
                                      ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                                      : 'border-hairline bg-surface text-body hover:text-ink hover:border-neutral-3'
                                  }`}
                                >
                                  {c.hexCode && (
                                    <span
                                      className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                      style={{ backgroundColor: c.hexCode }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <span>{c.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =================================================================
                TAB 3: FOTO & GALERI
               ================================================================= */}
            {activeTab === 'images' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-ink">{copy.imagesTitle}</h3>
                    <p className="text-[11px] text-muted">{copy.imagesHelp}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addImage}>
                    {copy.addImageButton}
                  </Button>
                </div>

                {images.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-hairline text-muted text-xs bg-neutral-2/20">
                    Belum ada gambar ditambahkan. Klik &quot;{copy.addImageButton}&quot; untuk menambahkan gambar model.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {images.map((img, imgIdx) => {
                      const previewUrl = getStorageImageUrl(img.storagePath);
                      const isUploading = uploadingImageIndex === imgIdx;

                      return (
                        <div
                          key={img.id || imgIdx}
                          className="p-4 border border-hairline bg-neutral-2/15 rounded-none space-y-3 relative shadow-2xs"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-hairline">
                            <span className="text-xs font-bold text-ink">
                              Gambar #{imgIdx + 1} ({img.imageRole === 'card' ? 'Kartu Utama' : img.imageRole})
                            </span>
                            <button
                              type="button"
                              onClick={() => removeImage(imgIdx)}
                              className="text-status-error text-xs hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-status-error"
                            >
                              Hapus Gambar
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
                            {/* Thumbnail Preview */}
                            <div className="sm:col-span-1 aspect-video relative bg-neutral-2 border border-hairline flex items-center justify-center overflow-hidden">
                              {previewUrl ? (
                                <Image
                                  src={previewUrl}
                                  alt={img.altText || 'Preview'}
                                  fill
                                  sizes="200px"
                                  className="object-contain p-1"
                                />
                              ) : (
                                <span className="text-[10px] text-muted text-center p-2">Tanpa Gambar</span>
                              )}
                            </div>

                            {/* Inputs */}
                            <div className="sm:col-span-3 space-y-3">
                              <div>
                                <label className="block text-[11px] font-semibold text-ink mb-1">
                                  {copy.imagePathLabel} *
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    required
                                    value={img.storagePath}
                                    onChange={(e) => updateImage(imgIdx, { storagePath: e.target.value })}
                                    placeholder={copy.imagePathPlaceholder}
                                    className="flex-1 h-8 px-2.5 text-xs bg-canvas text-ink border border-hairline rounded-none font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                  />
                                  <label className="cursor-pointer inline-flex items-center justify-center px-3 h-8 bg-neutral-2 hover:bg-neutral-3 hover:text-on-primary text-ink text-xs font-semibold border border-hairline shrink-0 transition-colors focus-within:ring-2 focus-within:ring-primary">
                                    <span>{isUploading ? 'Mengunggah...' : 'Unggah File'}</span>
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp"
                                      disabled={isUploading}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(imgIdx, file);
                                      }}
                                      className="sr-only"
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-semibold text-ink mb-1">
                                    {copy.imageAltLabel} *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={img.altText}
                                    onChange={(e) => updateImage(imgIdx, { altText: e.target.value })}
                                    placeholder={copy.imageAltPlaceholder}
                                    className="w-full h-8 px-2.5 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-ink mb-1">
                                    {copy.imageRoleLabel}
                                  </label>
                                  <select
                                    value={img.imageRole}
                                    onChange={(e) =>
                                      updateImage(imgIdx, { imageRole: e.target.value as ImageRole })
                                    }
                                    className="w-full h-8 px-2.5 text-xs bg-canvas text-ink border border-hairline rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                                  >
                                    <option value="card">{copy.roleCard}</option>
                                    <option value="hero">{copy.roleHero}</option>
                                    <option value="gallery">{copy.roleGallery}</option>
                                    <option value="color">{copy.roleColor}</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-hairline bg-surface shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <div className="flex items-center space-x-2">
              {activeTab !== 'images' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'general') setActiveTab('variants');
                    else if (activeTab === 'variants') setActiveTab('images');
                  }}
                >
                  Lanjut &rarr;
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Model Motor'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
