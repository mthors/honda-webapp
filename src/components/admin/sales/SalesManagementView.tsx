'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Image from 'next/image';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { createClient } from '@/lib/supabase/client';
import { formatIndonesianPhone } from '@/lib/formatters';
import type { DealershipItem } from '@/types/dealership';
import type {
  ProvinceItem,
  RegencyItem,
  DealershipServiceAreaItem,
  SalesRepresentativeItem,
} from '@/types/sales';
import {
  createSalesRepresentativeAction,
  updateSalesRepresentativeAction,
  toggleSalesRepresentativeActiveAction,
  deleteSalesRepresentativeAction,
  createServiceAreaAction,
  batchAssignServiceAreasAction,
  toggleServiceAreaActiveAction,
  deleteServiceAreaAction,
} from '@/lib/sales/actions';

interface SalesManagementViewProps {
  initialDealerships: DealershipItem[];
  initialProvinces: ProvinceItem[];
  initialRegencies: RegencyItem[];
  initialServiceAreas: DealershipServiceAreaItem[];
  initialSalesReps: SalesRepresentativeItem[];
}

type ActiveTab = 'sales' | 'service-areas';
type StatusFilter = 'all' | 'active' | 'inactive';

export function SalesManagementView({
  initialDealerships,
  initialProvinces,
  initialRegencies,
  initialServiceAreas,
  initialSalesReps,
}: SalesManagementViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('sales');

  // Master Data State
  const [dealerships] = useState<DealershipItem[]>(initialDealerships);
  const [provinces] = useState<ProvinceItem[]>(initialProvinces);
  const [regencies] = useState<RegencyItem[]>(initialRegencies);
  const [serviceAreas, setServiceAreas] =
    useState<DealershipServiceAreaItem[]>(initialServiceAreas);
  const [salesReps, setSalesReps] = useState<SalesRepresentativeItem[]>(initialSalesReps);

  // Global Feedback & Transition State
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // --------------------------------------------------------------------------
  // Tab 1: Sales Representatives State
  // --------------------------------------------------------------------------
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesDealerFilter, setSalesDealerFilter] = useState('all');
  const [salesStatusFilter, setSalesStatusFilter] = useState<StatusFilter>('all');

  // Sales Modal State
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [editingSalesRepId, setEditingSalesRepId] = useState<string | null>(null);
  const [salesFormDealershipId, setSalesFormDealershipId] = useState('');
  const [salesFormName, setSalesFormName] = useState('');
  const [salesFormPosition, setSalesFormPosition] = useState('');
  const [salesFormWhatsApp, setSalesFormWhatsApp] = useState('');
  const [salesFormPhotoUrl, setSalesFormPhotoUrl] = useState<string | null>(null);
  const [salesFormIsActive, setSalesFormIsActive] = useState(true);
  const [salesFormSortOrder, setSalesFormSortOrder] = useState(0);
  const [salesFormError, setSalesFormError] = useState<string | null>(null);
  const [salesFieldErrors, setSalesFieldErrors] = useState<Record<string, string[]>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Sales Delete Confirmation State
  const [deletingSalesRep, setDeletingSalesRep] = useState<SalesRepresentativeItem | null>(null);

  // --------------------------------------------------------------------------
  // Tab 2: Service Areas State
  // --------------------------------------------------------------------------
  const [areaDealerFilter, setAreaDealerFilter] = useState('all');
  const [areaRegencyFilter, setAreaRegencyFilter] = useState('all');
  const [areaStatusFilter, setAreaStatusFilter] = useState<StatusFilter>('all');

  // Area Modal State
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaFormDealershipId, setAreaFormDealershipId] = useState('');
  const [areaFormRegencyIds, setAreaFormRegencyIds] = useState<string[]>([]);
  const [areaFormError, setAreaFormError] = useState<string | null>(null);

  // Area Delete Confirmation State
  const [deletingArea, setDeletingArea] = useState<DealershipServiceAreaItem | null>(null);

  const t = dealershipCopy.adminSales;

  // --------------------------------------------------------------------------
  // Handlers: Sales Representatives
  // --------------------------------------------------------------------------
  const handleOpenCreateSales = () => {
    setEditingSalesRepId(null);
    setSalesFormDealershipId(dealerships[0]?.id || '');
    setSalesFormName('');
    setSalesFormPosition('');
    setSalesFormWhatsApp('');
    setSalesFormPhotoUrl(null);
    setSalesFormIsActive(true);
    setSalesFormSortOrder(salesReps.length + 1);
    setSalesFormError(null);
    setSalesFieldErrors({});
    setPhotoUploadError(null);
    setIsSalesModalOpen(true);
  };

  const handleOpenEditSales = (rep: SalesRepresentativeItem) => {
    setEditingSalesRepId(rep.id);
    setSalesFormDealershipId(rep.dealershipId);
    setSalesFormName(rep.name);
    setSalesFormPosition(rep.position || '');
    setSalesFormWhatsApp(rep.whatsappNumber);
    setSalesFormPhotoUrl(rep.photoUrl || null);
    setSalesFormIsActive(rep.isActive);
    setSalesFormSortOrder(rep.sortOrder);
    setSalesFormError(null);
    setSalesFieldErrors({});
    setPhotoUploadError(null);
    setIsSalesModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setPhotoUploadError('Ukuran file foto maksimal 3MB.');
      return;
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(file.type)) {
      setPhotoUploadError('Format file harus berupa JPG, PNG, atau WebP.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setPhotoUploadError(null);

      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const cleanName = salesFormName
        ? salesFormName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 25)
        : 'sales-rep';
      const fileName = `${cleanName}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage.from('sales-reps').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) {
        setPhotoUploadError(`Upload foto gagal: ${error.message}`);
      } else if (data) {
        setSalesFormPhotoUrl(data.path);
      }
    } catch (err) {
      console.error('Photo upload exception:', err);
      setPhotoUploadError('Terjadi kendala saat mengunggah foto profil.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setSalesFormPhotoUrl(null);
    setPhotoUploadError(null);
  };

  const handleSubmitSales = (e: React.FormEvent) => {
    e.preventDefault();
    setSalesFormError(null);
    setSalesFieldErrors({});
    setGlobalSuccess(null);
    setGlobalError(null);

    startTransition(async () => {
      if (editingSalesRepId) {
        const res = await updateSalesRepresentativeAction({
          id: editingSalesRepId,
          dealershipId: salesFormDealershipId,
          name: salesFormName,
          position: salesFormPosition || null,
          whatsappNumber: salesFormWhatsApp,
          photoUrl: salesFormPhotoUrl,
          isActive: salesFormIsActive,
          sortOrder: salesFormSortOrder,
        });

        if (!res.success) {
          setSalesFormError(res.error || 'Terjadi kesalahan saat memperbarui sales.');
          if (res.fieldErrors) setSalesFieldErrors(res.fieldErrors);
          return;
        }

        const updatedData = res.data;
        setSalesReps((prev) => prev.map((s) => (s.id === editingSalesRepId ? updatedData : s)));
        setGlobalSuccess(t.salesReps.saveSuccess);
        setIsSalesModalOpen(false);
      } else {
        const res = await createSalesRepresentativeAction({
          dealershipId: salesFormDealershipId,
          name: salesFormName,
          position: salesFormPosition || null,
          whatsappNumber: salesFormWhatsApp,
          photoUrl: salesFormPhotoUrl,
          isActive: salesFormIsActive,
          sortOrder: salesFormSortOrder,
        });

        if (!res.success) {
          setSalesFormError(res.error || 'Terjadi kesalahan saat menambahkan sales.');
          if (res.fieldErrors) setSalesFieldErrors(res.fieldErrors);
          return;
        }

        const newData = res.data;
        setSalesReps((prev) => [newData, ...prev]);
        setGlobalSuccess(t.salesReps.saveSuccess);
        setIsSalesModalOpen(false);
      }
    });
  };

  const handleToggleSalesActive = (rep: SalesRepresentativeItem) => {
    setGlobalSuccess(null);
    setGlobalError(null);

    startTransition(async () => {
      const res = await toggleSalesRepresentativeActiveAction(rep.id, !rep.isActive);
      if (!res.success) {
        setGlobalError(res.error || 'Gagal mengubah status aktif sales representative');
        return;
      }

      setSalesReps((prev) =>
        prev.map((s) => (s.id === rep.id ? { ...s, isActive: !rep.isActive } : s))
      );
      setGlobalSuccess(t.salesReps.statusChangeSuccess);
    });
  };

  const handleConfirmDeleteSales = () => {
    if (!deletingSalesRep) return;
    setGlobalSuccess(null);
    setGlobalError(null);

    startTransition(async () => {
      const res = await deleteSalesRepresentativeAction(deletingSalesRep.id);
      if (!res.success) {
        setGlobalError(res.error || 'Gagal menghapus sales representative');
        setDeletingSalesRep(null);
        return;
      }

      setSalesReps((prev) => prev.filter((s) => s.id !== deletingSalesRep.id));
      setGlobalSuccess(t.salesReps.deleteSuccess);
      setDeletingSalesRep(null);
    });
  };

  // --------------------------------------------------------------------------
  // Handlers: Service Areas
  // --------------------------------------------------------------------------
  const handleOpenCreateArea = () => {
    setAreaFormDealershipId(dealerships[0]?.id || '');
    setAreaFormRegencyIds([]);
    setAreaFormError(null);
    setIsAreaModalOpen(true);
  };

  const handleToggleRegencyCheckbox = (regencyId: string) => {
    setAreaFormRegencyIds((prev) =>
      prev.includes(regencyId) ? prev.filter((id) => id !== regencyId) : [...prev, regencyId]
    );
  };

  const handleSubmitArea = (e: React.FormEvent) => {
    e.preventDefault();
    setAreaFormError(null);
    setGlobalSuccess(null);
    setGlobalError(null);

    if (areaFormRegencyIds.length === 0) {
      setAreaFormError('Pilih minimal satu wilayah kabupaten/kota untuk ditugaskan.');
      return;
    }

    startTransition(async () => {
      if (areaFormRegencyIds.length === 1) {
        const res = await createServiceAreaAction({
          dealershipId: areaFormDealershipId,
          regencyId: areaFormRegencyIds[0],
          isActive: true,
        });

        if (!res.success) {
          setAreaFormError(res.error || 'Terjadi kesalahan saat memetakan wilayah.');
          return;
        }

        const newArea = res.data;
        setServiceAreas((prev) => [newArea, ...prev]);
        setGlobalSuccess(t.serviceAreas.saveSuccess);
        setIsAreaModalOpen(false);
      } else {
        const res = await batchAssignServiceAreasAction({
          dealershipId: areaFormDealershipId,
          regencyIds: areaFormRegencyIds,
        });

        if (!res.success) {
          setAreaFormError(res.error || 'Terjadi kesalahan saat memetakan wilayah secara massal.');
          return;
        }

        const addedCount = res.data?.addedCount ?? areaFormRegencyIds.length;

        // Re-construct state items for local reactive update
        const targetDealer = dealerships.find((d) => d.id === areaFormDealershipId);
        const newItems: DealershipServiceAreaItem[] = areaFormRegencyIds.map((regId) => {
          const reg = regencies.find((r) => r.id === regId);
          return {
            id: `temp-${Date.now()}-${regId}`,
            dealershipId: areaFormDealershipId,
            regencyId: regId,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            dealership: targetDealer || null,
            regency: reg || null,
          };
        });

        // Filter out existing duplicates from local view
        const existingKeys = new Set(
          serviceAreas.map((sa) => `${sa.dealershipId}_${sa.regencyId}`)
        );
        const nonDuplicateNewItems = newItems.filter(
          (item) => !existingKeys.has(`${item.dealershipId}_${item.regencyId}`)
        );

        setServiceAreas((prev) => [...nonDuplicateNewItems, ...prev]);
        setGlobalSuccess(`Berhasil menugaskan ${addedCount} wilayah layanan ke cabang dealer.`);
        setIsAreaModalOpen(false);
      }
    });
  };

  const handleToggleAreaActive = (area: DealershipServiceAreaItem) => {
    setGlobalSuccess(null);
    setGlobalError(null);

    startTransition(async () => {
      const res = await toggleServiceAreaActiveAction(area.id, !area.isActive);
      if (!res.success) {
        setGlobalError(res.error || 'Gagal memperbarui status wilayah layanan');
        return;
      }

      setServiceAreas((prev) =>
        prev.map((a) => (a.id === area.id ? { ...a, isActive: !area.isActive } : a))
      );
      setGlobalSuccess(t.serviceAreas.statusChangeSuccess);
    });
  };

  const handleConfirmDeleteArea = () => {
    if (!deletingArea) return;
    setGlobalSuccess(null);
    setGlobalError(null);

    startTransition(async () => {
      const res = await deleteServiceAreaAction(deletingArea.id);
      if (!res.success) {
        setGlobalError(res.error || 'Gagal menghapus pemetaan wilayah layanan');
        setDeletingArea(null);
        return;
      }

      setServiceAreas((prev) => prev.filter((a) => a.id !== deletingArea.id));
      setGlobalSuccess(t.serviceAreas.deleteSuccess);
      setDeletingArea(null);
    });
  };

  // --------------------------------------------------------------------------
  // Filtered Lists & Summaries
  // --------------------------------------------------------------------------
  const filteredSalesReps = useMemo(() => {
    return salesReps.filter((rep) => {
      if (salesDealerFilter !== 'all' && rep.dealershipId !== salesDealerFilter) return false;
      if (salesStatusFilter === 'active' && !rep.isActive) return false;
      if (salesStatusFilter === 'inactive' && rep.isActive) return false;
      if (salesSearchQuery.trim()) {
        const q = salesSearchQuery.toLowerCase();
        const matchName = rep.name.toLowerCase().includes(q);
        const matchPos = rep.position?.toLowerCase().includes(q) ?? false;
        const matchPhone = rep.whatsappNumber.includes(q);
        if (!matchName && !matchPos && !matchPhone) return false;
      }
      return true;
    });
  }, [salesReps, salesDealerFilter, salesStatusFilter, salesSearchQuery]);

  const filteredServiceAreas = useMemo(() => {
    return serviceAreas.filter((area) => {
      if (areaDealerFilter !== 'all' && area.dealershipId !== areaDealerFilter) return false;
      if (areaRegencyFilter !== 'all' && area.regencyId !== areaRegencyFilter) return false;
      if (areaStatusFilter === 'active' && !area.isActive) return false;
      if (areaStatusFilter === 'inactive' && area.isActive) return false;
      return true;
    });
  }, [serviceAreas, areaDealerFilter, areaRegencyFilter, areaStatusFilter]);

  // Statistics
  const activeSalesCount = salesReps.filter((r) => r.isActive).length;
  const connectedDealersInSales = new Set(salesReps.map((r) => r.dealershipId)).size;
  const coveredRegenciesCount = new Set(serviceAreas.map((sa) => sa.regencyId)).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t.title}</h1>
          <p className="text-sm text-muted mt-1">{t.subtitle}</p>
        </div>

        {/* Action Button depending on Active Tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'sales' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreateSales}
              disabled={dealerships.length === 0}
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t.salesReps.createNew}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreateArea}
              disabled={dealerships.length === 0 || regencies.length === 0}
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {t.serviceAreas.createNew}
            </Button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {globalSuccess && (
        <div
          role="status"
          className="p-4 bg-green-50 border-l-4 border-status-success text-status-success text-sm flex items-center justify-between"
        >
          <span>{globalSuccess}</span>
          <button
            type="button"
            onClick={() => setGlobalSuccess(null)}
            className="text-status-success hover:text-green-900 text-xs font-semibold uppercase ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {globalError && (
        <div
          role="alert"
          className="p-4 bg-red-50 border-l-4 border-status-error text-status-error text-sm flex items-center justify-between"
        >
          <span>{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="text-status-error hover:text-red-900 text-xs font-semibold uppercase ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-hairline">
        <button
          type="button"
          onClick={() => {
            setActiveTab('sales');
            setGlobalError(null);
            setGlobalSuccess(null);
          }}
          className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {t.tabs.salesReps}
          <span className="text-xs bg-neutral-2 px-2 py-0.5 rounded-full text-body font-mono">
            {salesReps.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('service-areas');
            setGlobalError(null);
            setGlobalSuccess(null);
          }}
          className={`py-3 px-6 text-sm font-semibold transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'service-areas'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {t.tabs.serviceAreas}
          <span className="text-xs bg-neutral-2 px-2 py-0.5 rounded-full text-body font-mono">
            {serviceAreas.length}
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: TENAGA PENJUAL (SALES) */}
      {/* =================================================================== */}
      {activeTab === 'sales' && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-muted block uppercase tracking-wider font-semibold">
                Total Tenaga Penjual
              </span>
              <span className="text-2xl font-bold text-ink mt-1 block">{salesReps.length}</span>
            </Card>
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-status-success block uppercase tracking-wider font-semibold">
                Sales Aktif
              </span>
              <span className="text-2xl font-bold text-status-success mt-1 block">
                {activeSalesCount}
              </span>
            </Card>
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-muted block uppercase tracking-wider font-semibold">
                Sales Nonaktif
              </span>
              <span className="text-2xl font-bold text-muted mt-1 block">
                {salesReps.length - activeSalesCount}
              </span>
            </Card>
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-body block uppercase tracking-wider font-semibold">
                Dealer Terhubung
              </span>
              <span className="text-2xl font-bold text-ink mt-1 block">
                {connectedDealersInSales} / {dealerships.length}
              </span>
            </Card>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-canvas p-3 border border-hairline">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t.salesReps.searchPlaceholder}
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full text-sm pl-9 pr-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                />
                <svg
                  className="w-4 h-4 text-muted absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <select
                value={salesDealerFilter}
                onChange={(e) => setSalesDealerFilter(e.target.value)}
                className="text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                aria-label="Filter berdasarkan cabang dealer"
              >
                <option value="all">{t.salesReps.filterDealershipAll}</option>
                {dealerships.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.city})
                  </option>
                ))}
              </select>

              <select
                value={salesStatusFilter}
                onChange={(e) => setSalesStatusFilter(e.target.value as StatusFilter)}
                className="text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                aria-label="Filter berdasarkan status keaktifan sales"
              >
                <option value="all">{t.salesReps.filterStatusAll}</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Sales Representatives Table */}
          {filteredSalesReps.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-hairline bg-canvas">
              <svg
                className="w-12 h-12 text-muted mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-body font-semibold">{t.salesReps.emptyState}</p>
              <p className="text-xs text-muted mt-1">
                {salesSearchQuery || salesDealerFilter !== 'all' || salesStatusFilter !== 'all'
                  ? 'Tidak ada tenaga penjual yang cocok dengan kriteria filter saat ini.'
                  : 'Klik tombol "Tambah Tenaga Penjual" untuk mendaftarkan sales per cabang dealer.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-hairline bg-canvas">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-1 text-xs uppercase tracking-wider text-muted border-b border-hairline">
                  <tr>
                    <th scope="col" className="py-3 px-4">
                      Sales
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Cabang Dealer
                    </th>
                    <th scope="col" className="py-3 px-4">
                      WhatsApp
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Urutan
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Status
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredSalesReps.map((rep) => {
                    const dealer =
                      rep.dealership || dealerships.find((d) => d.id === rep.dealershipId);
                    const photoSrc = rep.photoUrl
                      ? getStorageImageUrl(rep.photoUrl, '', 'sales-reps')
                      : null;

                    return (
                      <tr key={rep.id} className="hover:bg-surface transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-2 overflow-hidden shrink-0 border border-hairline flex items-center justify-center">
                              {photoSrc ? (
                                <Image
                                  src={photoSrc}
                                  alt={rep.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <svg
                                  className="w-5 h-5 text-muted"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-ink block">{rep.name}</span>
                              <span className="text-xs text-muted block">
                                {rep.position || 'Sales Consultant'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-ink block">
                            {dealer?.name || 'Cabang Tidak Ditemukan'}
                          </span>
                          <span className="text-xs text-muted block">{dealer?.city || '-'}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>{formatIndonesianPhone(rep.whatsappNumber)}</span>
                            <a
                              href={`https://wa.me/${rep.whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-status-success hover:underline text-[11px] font-sans font-medium"
                              title="Buka percakapan WhatsApp"
                            >
                              Uji WA &rarr;
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs">{rep.sortOrder}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={rep.isActive ? 'success' : 'neutral'} size="sm">
                            {rep.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSalesActive(rep)}
                              disabled={isPending}
                              className="text-xs text-body hover:text-primary transition-colors disabled:opacity-50"
                            >
                              {rep.isActive
                                ? t.salesReps.deactivateButton
                                : t.salesReps.activateButton}
                            </button>
                            <span className="text-hairline">|</span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSales(rep)}
                              disabled={isPending}
                              className="text-xs text-body hover:text-primary font-medium transition-colors disabled:opacity-50"
                            >
                              Ubah
                            </button>
                            <span className="text-hairline">|</span>
                            <button
                              type="button"
                              onClick={() => setDeletingSalesRep(rep)}
                              disabled={isPending}
                              className="text-xs text-status-error hover:text-red-800 transition-colors disabled:opacity-50"
                            >
                              Hapus
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
      )}

      {/* =================================================================== */}
      {/* TAB 2: WILAYAH LAYANAN (SERVICE AREAS) */}
      {/* =================================================================== */}
      {activeTab === 'service-areas' && (
        <div className="space-y-5">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-muted block uppercase tracking-wider font-semibold">
                Total Pemetaan Wilayah
              </span>
              <span className="text-2xl font-bold text-ink mt-1 block">{serviceAreas.length}</span>
            </Card>
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-status-success block uppercase tracking-wider font-semibold">
                Kabupaten / Kota Tercakup
              </span>
              <span className="text-2xl font-bold text-status-success mt-1 block">
                {coveredRegenciesCount} / {regencies.length}
              </span>
            </Card>
            <Card className="p-4 bg-canvas border border-hairline rounded-none">
              <span className="text-xs text-body block uppercase tracking-wider font-semibold">
                Dealer Terpetakan
              </span>
              <span className="text-2xl font-bold text-ink mt-1 block">
                {new Set(serviceAreas.map((sa) => sa.dealershipId)).size} / {dealerships.length}
              </span>
            </Card>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-canvas p-3 border border-hairline">
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <select
                value={areaDealerFilter}
                onChange={(e) => setAreaDealerFilter(e.target.value)}
                className="text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                aria-label="Filter berdasarkan cabang dealer"
              >
                <option value="all">{t.serviceAreas.filterDealershipAll}</option>
                {dealerships.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.city})
                  </option>
                ))}
              </select>

              <select
                value={areaRegencyFilter}
                onChange={(e) => setAreaRegencyFilter(e.target.value)}
                className="text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                aria-label="Filter berdasarkan kabupaten/kota"
              >
                <option value="all">{t.serviceAreas.filterRegencyAll}</option>
                {regencies.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type === 'kota' ? 'Kota' : 'Kabupaten'})
                  </option>
                ))}
              </select>

              <select
                value={areaStatusFilter}
                onChange={(e) => setAreaStatusFilter(e.target.value as StatusFilter)}
                className="text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                aria-label="Filter berdasarkan status keaktifan layanan"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Service Areas Table */}
          {filteredServiceAreas.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-hairline bg-canvas">
              <svg
                className="w-12 h-12 text-muted mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <p className="text-body font-semibold">{t.serviceAreas.emptyState}</p>
              <p className="text-xs text-muted mt-1">
                {areaDealerFilter !== 'all' ||
                areaRegencyFilter !== 'all' ||
                areaStatusFilter !== 'all'
                  ? 'Tidak ada wilayah layanan yang sesuai dengan filter.'
                  : 'Klik "Tambah Cakupan Wilayah" untuk memetakan cabang dealer ke kabupaten/kota yang dilayani.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-hairline bg-canvas">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-1 text-xs uppercase tracking-wider text-muted border-b border-hairline">
                  <tr>
                    <th scope="col" className="py-3 px-4">
                      Cabang Dealer
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Wilayah Layanan (Kab/Kota)
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Tipe Wilayah
                    </th>
                    <th scope="col" className="py-3 px-4 text-center">
                      Status
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredServiceAreas.map((area) => {
                    const dealer =
                      area.dealership || dealerships.find((d) => d.id === area.dealershipId);
                    const regency = area.regency || regencies.find((r) => r.id === area.regencyId);

                    return (
                      <tr key={area.id} className="hover:bg-surface transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-ink block">
                            {dealer?.name || 'Dealer Tidak Ditemukan'}
                          </span>
                          <span className="text-xs text-muted block">
                            Kota Dealer: {dealer?.city || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-ink">
                          {regency?.name || area.regencyId}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="neutral" size="sm">
                            {regency?.type === 'kota' ? 'Kota' : 'Kabupaten'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={area.isActive ? 'success' : 'neutral'} size="sm">
                            {area.isActive ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleAreaActive(area)}
                              disabled={isPending}
                              className="text-xs text-body hover:text-primary transition-colors disabled:opacity-50"
                            >
                              {area.isActive
                                ? t.serviceAreas.deactivateButton
                                : t.serviceAreas.activateButton}
                            </button>
                            <span className="text-hairline">|</span>
                            <button
                              type="button"
                              onClick={() => setDeletingArea(area)}
                              disabled={isPending}
                              className="text-xs text-status-error hover:text-red-800 transition-colors disabled:opacity-50"
                            >
                              Hapus
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
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT SALES REPRESENTATIVE */}
      {/* =================================================================== */}
      {isSalesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sales-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-canvas border border-hairline w-full max-w-lg shadow-xl p-6 rounded-none my-8">
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
              <h2 id="sales-modal-title" className="text-lg font-bold text-ink">
                {editingSalesRepId ? t.salesReps.formTitleEdit : t.salesReps.formTitleCreate}
              </h2>
              <button
                type="button"
                onClick={() => setIsSalesModalOpen(false)}
                className="text-muted hover:text-ink text-sm font-semibold"
                aria-label="Tutup formulir"
              >
                &times;
              </button>
            </div>

            {salesFormError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 text-status-error text-xs border border-red-200"
              >
                {salesFormError}
              </div>
            )}

            <form onSubmit={handleSubmitSales} className="space-y-4">
              {/* Dealership Select */}
              <div>
                <label
                  htmlFor="sales-dealership"
                  className="block text-xs font-semibold text-body mb-1"
                >
                  {t.salesReps.dealershipLabel} <span className="text-primary">*</span>
                </label>
                <select
                  id="sales-dealership"
                  value={salesFormDealershipId}
                  onChange={(e) => setSalesFormDealershipId(e.target.value)}
                  required
                  className="w-full text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                >
                  {dealerships.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.city})
                    </option>
                  ))}
                </select>
                {salesFieldErrors.dealershipId && (
                  <p className="text-xs text-status-error mt-1">
                    {salesFieldErrors.dealershipId[0]}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="sales-name" className="block text-xs font-semibold text-body mb-1">
                  {t.salesReps.nameLabel} <span className="text-primary">*</span>
                </label>
                <input
                  id="sales-name"
                  type="text"
                  required
                  placeholder={t.salesReps.namePlaceholder}
                  value={salesFormName}
                  onChange={(e) => setSalesFormName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                />
                {salesFieldErrors.name && (
                  <p className="text-xs text-status-error mt-1">{salesFieldErrors.name[0]}</p>
                )}
              </div>

              {/* Position */}
              <div>
                <label
                  htmlFor="sales-position"
                  className="block text-xs font-semibold text-body mb-1"
                >
                  {t.salesReps.positionLabel}
                </label>
                <input
                  id="sales-position"
                  type="text"
                  placeholder={t.salesReps.positionPlaceholder}
                  value={salesFormPosition}
                  onChange={(e) => setSalesFormPosition(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                />
              </div>

              {/* WhatsApp Number */}
              <div>
                <label
                  htmlFor="sales-whatsapp"
                  className="block text-xs font-semibold text-body mb-1"
                >
                  {t.salesReps.whatsappLabel} <span className="text-primary">*</span>
                </label>
                <input
                  id="sales-whatsapp"
                  type="text"
                  required
                  placeholder={t.salesReps.whatsappPlaceholder}
                  value={salesFormWhatsApp}
                  onChange={(e) => setSalesFormWhatsApp(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink font-mono"
                />
                <p className="text-[11px] text-muted mt-1">{t.salesReps.whatsappHelp}</p>
                {salesFieldErrors.whatsappNumber && (
                  <p className="text-xs text-status-error mt-1">
                    {salesFieldErrors.whatsappNumber[0]}
                  </p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-body mb-1">
                  {t.salesReps.photoLabel}
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-14 h-14 rounded-full bg-neutral-2 overflow-hidden shrink-0 border border-hairline flex items-center justify-center">
                    {salesFormPhotoUrl ? (
                      <Image
                        src={getStorageImageUrl(salesFormPhotoUrl, '', 'sales-reps')}
                        alt="Preview Foto"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <svg className="w-7 h-7 text-muted" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      id="sales-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="text-xs text-body file:mr-2 file:py-1 file:px-3 file:border-0 file:text-xs file:font-semibold file:bg-neutral-2 file:text-body hover:file:bg-neutral-3"
                    />
                    <p className="text-[11px] text-muted">{t.salesReps.photoHelp}</p>
                    {isUploadingPhoto && (
                      <p className="text-xs text-primary">{t.salesReps.uploadingPhoto}</p>
                    )}
                    {photoUploadError && (
                      <p className="text-xs text-status-error">{photoUploadError}</p>
                    )}
                    {salesFormPhotoUrl && !isUploadingPhoto && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-xs text-status-error hover:underline block"
                      >
                        {t.salesReps.removePhoto}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    htmlFor="sales-sort-order"
                    className="block text-xs font-semibold text-body mb-1"
                  >
                    {t.salesReps.sortOrderLabel}
                  </label>
                  <input
                    id="sales-sort-order"
                    type="number"
                    min="0"
                    value={salesFormSortOrder}
                    onChange={(e) => setSalesFormSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                  />
                  <p className="text-[11px] text-muted mt-1">{t.salesReps.sortOrderHelp}</p>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={salesFormIsActive}
                      onChange={(e) => setSalesFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-primary rounded-none border-hairline focus:ring-primary"
                    />
                    <span className="text-xs font-semibold text-body">
                      {t.salesReps.isActiveLabel}
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSalesModalOpen(false)}
                  disabled={isPending || isUploadingPhoto}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending || isUploadingPhoto}
                >
                  {isPending ? t.salesReps.savingButton : t.salesReps.saveButton}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ASSIGN SERVICE AREA (SINGLE / BATCH) */}
      {/* =================================================================== */}
      {isAreaModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="area-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-canvas border border-hairline w-full max-w-lg shadow-xl p-6 rounded-none my-8">
            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-5">
              <h2 id="area-modal-title" className="text-lg font-bold text-ink">
                {t.serviceAreas.formTitleCreate}
              </h2>
              <button
                type="button"
                onClick={() => setIsAreaModalOpen(false)}
                className="text-muted hover:text-ink text-sm font-semibold"
                aria-label="Tutup formulir"
              >
                &times;
              </button>
            </div>

            {areaFormError && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 text-status-error text-xs border border-red-200"
              >
                {areaFormError}
              </div>
            )}

            <form onSubmit={handleSubmitArea} className="space-y-4">
              {/* Dealership Select */}
              <div>
                <label
                  htmlFor="area-dealership"
                  className="block text-xs font-semibold text-body mb-1"
                >
                  {t.serviceAreas.dealershipLabel} <span className="text-primary">*</span>
                </label>
                <select
                  id="area-dealership"
                  value={areaFormDealershipId}
                  onChange={(e) => setAreaFormDealershipId(e.target.value)}
                  required
                  className="w-full text-sm px-3 py-2 border border-hairline bg-surface rounded-none focus:outline-none focus:border-primary text-ink"
                >
                  {dealerships.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Regencies Selection List (Batch) */}
              <div>
                <label className="block text-xs font-semibold text-body mb-1">
                  {t.serviceAreas.batchSelectLabel} <span className="text-primary">*</span>
                  {provinces[0] && (
                    <span className="text-muted font-normal ml-1">
                      (Provinsi {provinces[0].name})
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-muted mb-2">
                  Centang satu atau beberapa wilayah kabupaten/kota yang dapat dilayani oleh cabang
                  dealer ini.
                </p>

                <div className="max-h-60 overflow-y-auto border border-hairline p-3 space-y-2 bg-surface">
                  {regencies.map((reg) => {
                    const isChecked = areaFormRegencyIds.includes(reg.id);
                    // Check if already mapped for this dealership
                    const isAlreadyAssigned = serviceAreas.some(
                      (sa) => sa.dealershipId === areaFormDealershipId && sa.regencyId === reg.id
                    );

                    return (
                      <label
                        key={reg.id}
                        className={`flex items-center justify-between p-2 text-xs border transition-colors cursor-pointer ${
                          isChecked
                            ? 'border-primary bg-primary/5'
                            : 'border-hairline hover:bg-neutral-1'
                        } ${isAlreadyAssigned ? 'opacity-60 bg-neutral-1' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRegencyCheckbox(reg.id)}
                            className="w-4 h-4 text-primary rounded-none border-hairline focus:ring-primary"
                          />
                          <span className="font-medium text-ink">
                            {reg.name} ({reg.type === 'kota' ? 'Kota' : 'Kabupaten'})
                          </span>
                        </div>
                        {isAlreadyAssigned && (
                          <span className="text-[10px] text-muted italic">Sudah terpetakan</span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted">
                  <span>{areaFormRegencyIds.length} wilayah terpilih</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setAreaFormRegencyIds(regencies.map((r) => r.id))}
                      className="text-primary hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setAreaFormRegencyIds([])}
                      className="text-muted hover:underline"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAreaModalOpen(false)}
                  disabled={isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending || areaFormRegencyIds.length === 0}
                >
                  {isPending ? t.serviceAreas.savingButton : t.serviceAreas.saveButton}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DELETE CONFIRMATION (SALES REPRESENTATIVE) */}
      {/* =================================================================== */}
      {deletingSalesRep && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-sales-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-canvas border border-hairline w-full max-w-md p-6 rounded-none shadow-xl">
            <h3 id="delete-sales-title" className="text-base font-bold text-ink">
              {t.salesReps.deleteConfirmTitle}
            </h3>
            <p className="text-sm text-body mt-2">
              Apakah Anda yakin ingin menghapus sales representative{' '}
              <strong className="text-ink">{deletingSalesRep.name}</strong> dari cabang{' '}
              <strong>{deletingSalesRep.dealership?.name || 'dealer'}</strong>?
            </p>
            <p className="text-xs text-muted mt-2">{t.salesReps.deleteConfirmMessage}</p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingSalesRep(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-status-error hover:bg-red-700 focus:ring-status-error"
                onClick={handleConfirmDeleteSales}
                disabled={isPending}
              >
                {isPending ? 'Menghapus...' : 'Ya, Hapus Sales'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: DELETE CONFIRMATION (SERVICE AREA) */}
      {/* =================================================================== */}
      {deletingArea && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-area-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div className="bg-canvas border border-hairline w-full max-w-md p-6 rounded-none shadow-xl">
            <h3 id="delete-area-title" className="text-base font-bold text-ink">
              {t.serviceAreas.deleteConfirmTitle}
            </h3>
            <p className="text-sm text-body mt-2">
              Hapus pemetaan wilayah layanan{' '}
              <strong className="text-ink">
                {deletingArea.regency?.name || deletingArea.regencyId}
              </strong>{' '}
              untuk cabang{' '}
              <strong className="text-ink">{deletingArea.dealership?.name || 'dealer'}</strong>?
            </p>
            <p className="text-xs text-muted mt-2">{t.serviceAreas.deleteConfirmMessage}</p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingArea(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="bg-status-error hover:bg-red-700 focus:ring-status-error"
                onClick={handleConfirmDeleteArea}
                disabled={isPending}
              >
                {isPending ? 'Menghapus...' : 'Ya, Hapus Pemetaan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
