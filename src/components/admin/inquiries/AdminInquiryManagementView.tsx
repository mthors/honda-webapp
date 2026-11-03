'use client';

import React, { useState, useMemo } from 'react';
import type { AdminLeadItem } from '@/types/inquiries';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatRupiah, normalizeIndonesianPhone } from '@/lib/formatters';
import { getIndonesianLeadStatusLabel } from '@/lib/inquiries/export';

interface AdminInquiryManagementViewProps {
  initialLeads: AdminLeadItem[];
}

export function AdminInquiryManagementView({ initialLeads }: AdminInquiryManagementViewProps) {
  const leads = initialLeads;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<AdminLeadItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Derive distinct cities from current leads
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    for (const lead of leads) {
      if (lead.city) {
        citySet.add(lead.city.trim());
      }
    }
    return Array.from(citySet).sort();
  }, [leads]);

  // Client-Side filtered results
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      // Status match
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // City match
      if (selectedCity !== 'all' && item.city.toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }

      // Search match
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.fullName.toLowerCase().includes(query);
        const matchesRef = item.leadReference.toLowerCase().includes(query);
        const matchesPhone = item.whatsappNumber.toLowerCase().includes(query);
        const matchesCity = item.city.toLowerCase().includes(query);
        const matchesModel = (item.modelNameSnapshot || '').toLowerCase().includes(query);

        if (!matchesName && !matchesRef && !matchesPhone && !matchesCity && !matchesModel) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedStatus, selectedCity, searchQuery]);

  // Counts
  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === 'new').length;

  // Handle Excel Export
  const handleExportExcel = () => {
    setIsExporting(true);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedCity !== 'all') params.set('city', selectedCity);

    const exportUrl = `/api/admin/leads/export?${params.toString()}`;

    // Trigger browser download via hidden link
    const link = document.createElement('a');
    link.href = exportUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  };

  const getStatusBadgeVariant = (status: string): 'primary' | 'neutral' | 'success' | 'warning' => {
    switch (status) {
      case 'new':
        return 'primary';
      case 'converted':
        return 'success';
      case 'contacted':
      case 'qualified':
      case 'follow_up':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const formatDateDisplay = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink font-heading">
              {dealershipCopy.adminLeads.title}
            </h1>
            <Badge variant="primary" size="sm">
              {newCount} {dealershipCopy.adminLeads.newInquiriesBadge}
            </Badge>
            <Badge variant="neutral" size="sm">
              {totalCount} Total
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted">{dealershipCopy.adminLeads.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExporting || filteredLeads.length === 0}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
            </svg>
            {isExporting
              ? dealershipCopy.adminLeads.exportingButton
              : dealershipCopy.adminLeads.exportButton}
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="sm:col-span-6 lg:col-span-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dealershipCopy.adminLeads.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg
              className="w-4 h-4 text-muted absolute left-3 top-2.5"
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-muted hover:text-ink"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 lg:col-span-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-canvas border border-hairline text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{dealershipCopy.adminLeads.allStatuses}</option>
            <option value="new">{dealershipCopy.adminLeads.statusNew}</option>
            <option value="contacted">{dealershipCopy.adminLeads.statusContacted}</option>
            <option value="qualified">{dealershipCopy.adminLeads.statusQualified}</option>
            <option value="follow_up">{dealershipCopy.adminLeads.statusFollowUp}</option>
            <option value="converted">{dealershipCopy.adminLeads.statusConverted}</option>
            <option value="not_interested">{dealershipCopy.adminLeads.statusNotInterested}</option>
            <option value="unreachable">{dealershipCopy.adminLeads.statusUnreachable}</option>
          </select>
        </div>

        {/* City Filter */}
        <div className="sm:col-span-3 lg:col-span-3">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-3 py-2 bg-canvas border border-hairline text-xs sm:text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Semua Wilayah</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Inquiries Table */}
      <Card padding="none" className="border border-hairline overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <h3 className="text-sm font-semibold text-ink">
              {dealershipCopy.adminLeads.emptyTitle}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {dealershipCopy.adminLeads.emptyDescription}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="bg-neutral-2/70 border-b border-hairline font-bold uppercase tracking-wider text-muted font-heading">
                <tr>
                  <th scope="col" className="px-4 py-3.5">
                    {dealershipCopy.adminLeads.tableHeaderRef}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {dealershipCopy.adminLeads.tableHeaderDate}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {dealershipCopy.adminLeads.tableHeaderCustomer}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {dealershipCopy.adminLeads.tableHeaderLocation}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {dealershipCopy.adminLeads.tableHeaderModel}
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    {dealershipCopy.adminLeads.tableHeaderStatus}
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    {dealershipCopy.adminLeads.tableHeaderActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline bg-canvas">
                {filteredLeads.map((item) => {
                  const waNumber = normalizeIndonesianPhone(item.whatsappNumber);
                  const waUrl = `https://wa.me/${waNumber}`;

                  return (
                    <tr key={item.id} className="hover:bg-neutral-2/40 transition-colors">
                      {/* Ref */}
                      <td className="px-4 py-3 font-mono font-bold text-ink whitespace-nowrap">
                        {item.leadReference}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatDateDisplay(item.createdAt)}
                      </td>

                      {/* Customer & Contact */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{item.fullName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-mono text-[11px]"
                            title="Buka Chat WhatsApp"
                          >
                            {item.whatsappNumber} ↗
                          </a>
                          {item.email && (
                            <span className="text-muted text-[11px] truncate max-w-[140px]">
                              • {item.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-ink">{item.city}</span>
                        {item.district && (
                          <span className="block text-muted text-[11px]">Kec. {item.district}</span>
                        )}
                      </td>

                      {/* Motorcycle */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">
                          {item.modelNameSnapshot || 'Pertanyaan Umum'}
                        </div>
                        <div className="text-muted text-[11px]">
                          {item.variantNameSnapshot ? `${item.variantNameSnapshot}` : ''}
                          {item.colorNameSnapshot ? ` • ${item.colorNameSnapshot}` : ''}
                        </div>
                        {item.priceSnapshotIdr && (
                          <span className="text-[11px] text-body block font-mono">
                            {formatRupiah(item.priceSnapshotIdr)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
                          {getIndonesianLeadStatusLabel(item.status)}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLead(item)}
                        >
                          {dealershipCopy.adminLeads.detailButton}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 4. Inquiry Detail Modal / Drawer */}
      {selectedLead && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-detail-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-canvas border border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-hairline flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted font-heading">
                  {selectedLead.leadReference}
                </span>
                <h2
                  id="inquiry-detail-modal-title"
                  className="text-xl font-bold text-ink font-heading"
                >
                  {dealershipCopy.adminLeads.detailModalTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="text-muted hover:text-ink text-xl font-bold px-2 py-1"
                aria-label="Tutup dialog"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              {/* Customer Info Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-heading">
                  {dealershipCopy.adminLeads.detailCustomerTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-2/40 p-4 border border-hairline">
                  <div>
                    <span className="text-xs text-muted block">Nama Lengkap</span>
                    <strong className="text-ink">{selectedLead.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Nomor WhatsApp</span>
                    <a
                      href={`https://wa.me/${normalizeIndonesianPhone(selectedLead.whatsappNumber)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold"
                    >
                      {selectedLead.whatsappNumber} ↗
                    </a>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Email</span>
                    <span className="text-ink">{selectedLead.email || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Domisili</span>
                    <span className="text-ink font-semibold">
                      {selectedLead.city}
                      {selectedLead.district ? ` (Kec. ${selectedLead.district})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motorcycle Details Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-heading">
                  {dealershipCopy.adminLeads.detailMotorcycleTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-2/40 p-4 border border-hairline">
                  <div>
                    <span className="text-xs text-muted block">Model Motor</span>
                    <strong className="text-ink">
                      {selectedLead.modelNameSnapshot || 'Pertanyaan Umum'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Varian / Tipe</span>
                    <span className="text-ink">{selectedLead.variantNameSnapshot || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Warna Pilihan</span>
                    <span className="text-ink">{selectedLead.colorNameSnapshot || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted block">Estimasi Harga OTR</span>
                    <span className="text-ink font-bold font-mono">
                      {selectedLead.priceSnapshotIdr
                        ? formatRupiah(selectedLead.priceSnapshotIdr)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Section */}
              {selectedLead.message && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-heading">
                    Pesan Pertanyaan Pelanggan
                  </h3>
                  <div className="p-4 bg-canvas border border-hairline text-ink leading-relaxed whitespace-pre-wrap text-xs">
                    {selectedLead.message}
                  </div>
                </div>
              )}

              {/* Metadata & Privacy Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-heading">
                  {dealershipCopy.adminLeads.detailPrivacyTitle}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-2/30 p-3 border border-hairline">
                  <div>
                    <span className="text-muted block">Waktu Pengajuan</span>
                    <span className="text-ink">{formatDateDisplay(selectedLead.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted block">Persetujuan Privasi</span>
                    <span className="text-ink">
                      {formatDateDisplay(selectedLead.consentPrivacyAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Halaman Sumber</span>
                    <span className="text-ink font-mono">
                      {selectedLead.sourcePage || '/hubungi'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Status Saat Ini</span>
                    <Badge variant={getStatusBadgeVariant(selectedLead.status)} size="sm">
                      {getIndonesianLeadStatusLabel(selectedLead.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-2/50 border-t border-hairline flex items-center justify-between">
              <a
                href={`https://wa.me/${normalizeIndonesianPhone(selectedLead.whatsappNumber)}?text=${encodeURIComponent(
                  `Halo ${selectedLead.fullName}, kami dari Honda Satrya Dealer Group menindaklanjuti pertanyaan Anda terkait ${selectedLead.modelNameSnapshot || 'motor Honda'} (Referensi: ${selectedLead.leadReference}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="sm">
                  Hubungi Pelanggan via WhatsApp
                </Button>
              </a>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedLead(null)}
              >
                {dealershipCopy.adminLeads.closeDetail}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
