'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getStorageImageUrl } from '@/lib/catalog/image';
import type {
  AdminMotorcycleItem,
  AdminMotorcycleDetail,
  AdminCategoryOption,
  AdminColorOption,
  ModelStatus,
} from '@/types/motorcycle';
import {
  toggleMotorcycleModelStatusAction,
  deleteMotorcycleModelAction,
  getMotorcycleModelDetailAction,
} from '@/lib/motorcycles/actions';
import { MotorcycleFormModal } from './MotorcycleFormModal';

interface MotorcycleManagementViewProps {
  initialModels: AdminMotorcycleItem[];
  categories: AdminCategoryOption[];
  colors: AdminColorOption[];
}

export function MotorcycleManagementView({
  initialModels,
  categories,
  colors,
}: MotorcycleManagementViewProps) {
  const router = useRouter();
  const copy = dealershipCopy.adminMotorcycles;
  const [, startTransition] = useTransition();

  const [prevInitialModels, setPrevInitialModels] = useState(initialModels);
  const [models, setModels] = useState<AdminMotorcycleItem[]>(initialModels);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Adjust state during rendering when initialModels changes from server revalidation
  if (initialModels !== prevInitialModels) {
    setPrevInitialModels(initialModels);
    setModels(initialModels);
  }

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingModelDetail, setEditingModelDetail] = useState<AdminMotorcycleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<AdminMotorcycleItem | null>(null);
  const [deleteBlockedError, setDeleteBlockedError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Alert message
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Filtered models
  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(query);
        const matchesSlug = m.slug.toLowerCase().includes(query);
        if (!matchesName && !matchesSlug) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && m.categoryId !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [models, searchQuery, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = models.length;
    const published = models.filter((m) => m.status === 'published').length;
    const draft = models.filter((m) => m.status === 'draft').length;
    const archived = models.filter((m) => m.status === 'archived').length;
    return { total, published, draft, archived };
  }, [models]);

  const handleOpenCreate = () => {
    setEditingModelDetail(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = async (model: AdminMotorcycleItem) => {
    try {
      setIsLoadingDetail(true);
      const res = await getMotorcycleModelDetailAction(model.id);
      if (res.success && res.data) {
        setEditingModelDetail(res.data);
        setIsFormModalOpen(true);
      } else {
        setToastMessage({ type: 'error', text: res.error || 'Gagal memuat detail model motor.' });
      }
    } catch (err) {
      console.error('Failed to load model details:', err);
      setToastMessage({ type: 'error', text: 'Gagal memuat detail model motor.' });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusToggle = async (id: string, targetStatus: ModelStatus) => {
    try {
      setTogglingId(id);
      const result = await toggleMotorcycleModelStatusAction(id, targetStatus);
      if (result.success) {
        setModels((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: targetStatus } : m))
        );
        startTransition(() => {
          router.refresh();
          setToastMessage({ type: 'success', text: copy.statusToggleSuccess });
        });
      } else {
        setToastMessage({ type: 'error', text: result.error || 'Gagal mengubah status.' });
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setToastMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeletePrompt = (model: AdminMotorcycleItem) => {
    setDeleteTarget(model);
    setDeleteBlockedError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      setDeleteBlockedError(null);
      const result = await deleteMotorcycleModelAction(deleteTarget.id);

      if (result.success) {
        setModels((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        setDeleteTarget(null);
        startTransition(() => {
          router.refresh();
          setToastMessage({ type: 'success', text: copy.deleteSuccess });
        });
      } else {
        if (result.data?.blocked) {
          setDeleteBlockedError(result.error || copy.deleteBlockedNotice);
        } else {
          setToastMessage({ type: 'error', text: result.error || 'Gagal menghapus model.' });
          setDeleteTarget(null);
        }
      }
    } catch (err) {
      console.error('Error deleting model:', err);
      setToastMessage({ type: 'error', text: 'Terjadi kesalahan sistem saat menghapus model.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveBlocked = async () => {
    if (!deleteTarget) return;
    await handleStatusToggle(deleteTarget.id, 'archived');
    setDeleteTarget(null);
  };

  const handleFormSaved = () => {
    startTransition(() => {
      router.refresh();
      setToastMessage({ type: 'success', text: copy.saveSuccess });
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`p-4 border text-xs flex items-center justify-between transition-all ${
            toastMessage.type === 'success'
              ? 'bg-status-success/10 border-status-success text-status-success'
              : 'bg-status-error/10 border-status-error text-status-error'
          }`}
          role="status"
        >
          <span>{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-muted hover:text-ink ml-4 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header and Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading tracking-tight">
            {copy.title}
          </h1>
          <p className="text-xs text-muted mt-1">{copy.subtitle}</p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          className="self-start sm:self-auto"
        >
          {copy.addNewButton}
        </Button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-surface border border-hairline">
          <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Total Model</p>
          <p className="text-lg font-bold text-ink mt-0.5">{stats.total}</p>
        </div>
        <div className="p-3 bg-surface border border-hairline">
          <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Tayang (Publik)</p>
          <p className="text-lg font-bold text-status-success mt-0.5">{stats.published}</p>
        </div>
        <div className="p-3 bg-surface border border-hairline">
          <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Draf</p>
          <p className="text-lg font-bold text-ink mt-0.5">{stats.draft}</p>
        </div>
        <div className="p-3 bg-surface border border-hairline">
          <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Diarsipkan</p>
          <p className="text-lg font-bold text-muted mt-0.5">{stats.archived}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 bg-surface border border-hairline flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="w-full h-10 pl-9 pr-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <svg
            className="w-4 h-4 text-muted absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:ring-1 focus:ring-primary focus:border-primary"
            aria-label="Filter kategori motor"
          >
            <option value="all">{copy.filterCategoryAll}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 text-xs bg-canvas text-ink border border-hairline rounded-none focus:ring-1 focus:ring-primary focus:border-primary"
            aria-label="Filter status motor"
          >
            <option value="all">{copy.filterStatusAll}</option>
            <option value="published">{copy.statusPublished}</option>
            <option value="draft">{copy.statusDraft}</option>
            <option value="archived">{copy.statusArchived}</option>
          </select>
        </div>
      </div>

      {/* Motorcycle Models Table */}
      <div className="border border-hairline bg-surface overflow-hidden">
        {filteredModels.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="w-12 h-12 mx-auto text-muted mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-sm font-bold text-ink">{copy.emptyTitle}</h3>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">{copy.emptyDescription}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-1 border-b border-hairline uppercase text-[11px] font-semibold text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    {copy.tableHeaderModel}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {copy.tableHeaderSpecs}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {copy.tableHeaderVariants}
                  </th>
                  <th scope="col" className="px-4 py-3">
                    {copy.tableHeaderStatus}
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    {copy.tableHeaderActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredModels.map((model) => {
                  const imageUrl = getStorageImageUrl(model.primaryImage?.storagePath);
                  const isToggling = togglingId === model.id;

                  return (
                    <tr key={model.id} className="hover:bg-neutral-1/50 transition-colors">
                      {/* Model Thumbnail & Identity */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-10 bg-neutral-2 border border-hairline relative shrink-0 overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={model.primaryImage?.altText || model.name}
                              fill
                              sizes="56px"
                              className="object-contain p-0.5"
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-bold text-ink text-xs">{model.name}</span>
                              {model.isFeatured && (
                                <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                  {copy.featuredBadge}
                                </span>
                              )}
                              {model.isNew && (
                                <span className="inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase bg-status-success/10 text-status-success border border-status-success/20">
                                  {copy.newBadge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted flex items-center space-x-1 mt-0.5">
                              <span className="font-mono text-neutral-4">{model.slug}</span>
                              <span>&bull;</span>
                              <span className="font-medium text-body">{model.categoryName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-4 py-3.5 text-body">
                        <div>{model.engineCc ? `${model.engineCc} cc` : '—'}</div>
                        <div className="text-[11px] text-muted truncate max-w-[150px]">
                          {model.transmission || '—'}
                        </div>
                      </td>

                      {/* Variants & Images */}
                      <td className="px-4 py-3.5 text-body">
                        <div>
                          <span className="font-semibold">{model.variantCount}</span> varian
                        </div>
                        <div className="text-[11px] text-muted">
                          {model.imageCount} gambar
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {model.status === 'published' && (
                          <Badge variant="success" size="sm">
                            {copy.statusPublished}
                          </Badge>
                        )}
                        {model.status === 'draft' && (
                          <Badge variant="neutral" size="sm">
                            {copy.statusDraft}
                          </Badge>
                        )}
                        {model.status === 'archived' && (
                          <Badge variant="error" size="sm">
                            {copy.statusArchived}
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-2">
                          {/* Quick Toggle Action */}
                          {model.status === 'published' ? (
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleStatusToggle(model.id, 'draft')}
                              className="text-[11px] text-muted hover:text-ink underline disabled:opacity-50"
                              title={copy.actionUnpublish}
                            >
                              {copy.actionUnpublish}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleStatusToggle(model.id, 'published')}
                              className="text-[11px] text-status-success hover:underline font-semibold disabled:opacity-50"
                              title={copy.actionPublish}
                            >
                              {copy.actionPublish}
                            </button>
                          )}

                          <span className="text-hairline">|</span>

                          {/* Edit Action */}
                          <button
                            type="button"
                            disabled={isLoadingDetail}
                            onClick={() => handleOpenEdit(model)}
                            className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            {copy.editButton}
                          </button>

                          <span className="text-hairline">|</span>

                          {/* Delete Prompt */}
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(model)}
                            className="text-xs font-medium text-status-error hover:underline"
                          >
                            {copy.deleteButton}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <MotorcycleFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSaved={handleFormSaved}
          categories={categories}
          colors={colors}
          modelDetail={editingModelDetail}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md bg-surface border border-hairline p-6 shadow-xl rounded-none space-y-4">
            <h3 id="delete-dialog-title" className="text-sm font-bold text-ink font-heading">
              {copy.confirmDeleteTitle}
            </h3>

            {deleteBlockedError ? (
              <div className="p-3 bg-status-error/10 border-l-4 border-status-error text-status-error text-xs space-y-2">
                <p className="font-semibold">Penghapusan Diblokir</p>
                <p>{deleteBlockedError}</p>
              </div>
            ) : (
              <p className="text-xs text-body leading-relaxed">
                {copy.confirmDeleteMessage}{' '}
                <span className="font-bold text-ink">&quot;{deleteTarget.name}&quot;</span>?
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>

              {deleteBlockedError ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleArchiveBlocked}
                >
                  {copy.actionArchiveInstead}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-status-error hover:bg-status-error/90 border-status-error text-white"
                >
                  {isDeleting ? 'Menghapus...' : copy.actionDeleteConfirm}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
