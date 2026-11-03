import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { dealershipCopy } from '@/content/copy/id';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getPublishedModels } from '@/lib/catalog/queries';
import {
  getAdminPriceEntries,
  getAdminPromotions,
  getAdminHeroBanners,
  getAdminNewInquiriesCount,
} from '@/lib/admin/queries';
import { formatRupiah } from '@/lib/formatters';

export const metadata = {
  title: 'Dasbor Administrator — Honda Satrya Dealer Group',
  description: 'Dasbor ringkasan aktivitas dan operasional showroom Honda Satrya Dealer Group.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  // Load real data from established queries in parallel
  const [publishedModels, priceEntries, promotions, banners, newInquiriesCount] = await Promise.all(
    [
      getPublishedModels(),
      getAdminPriceEntries(),
      getAdminPromotions(),
      getAdminHeroBanners(),
      getAdminNewInquiriesCount(),
    ]
  );

  const now = new Date();
  const nowIso = now.toISOString();
  const today = nowIso.split('T')[0];

  // 1. Business Overview Metrics
  const publishedModelsCount = publishedModels.length;

  const activePrices = priceEntries.filter(
    (p) => p.isPublished && p.validFrom <= today && (!p.validUntil || p.validUntil >= today)
  );
  const activePricesCount = activePrices.length;

  const activePromotions = promotions.filter(
    (p) => p.status === 'published' && p.startsAt <= nowIso && p.endsAt >= nowIso
  );
  const activePromotionsCount = activePromotions.length;

  // 2. Needs Attention Calculations
  // Published models that do NOT have any currently active price entry
  const modelsWithoutPrices = publishedModels.filter((model) => {
    const hasActivePrice = activePrices.some(
      (p) => p.modelId === model.id || p.modelSlug === model.slug
    );
    return !hasActivePrice;
  });

  // Promotions ending within the next 7 days
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endingSoonPromos = promotions.filter((p) => {
    if (p.status !== 'published') return false;
    const endsAt = new Date(p.endsAt);
    return endsAt >= now && endsAt <= inSevenDays;
  });

  // Draft items awaiting publication
  const draftPrices = priceEntries.filter((p) => !p.isPublished);
  const draftPromos = promotions.filter((p) => p.status === 'draft');
  const draftBanners = banners.filter((b) => b.status === 'draft');
  const totalDraftCount = draftPrices.length + draftPromos.length + draftBanners.length;

  // 3. Recent Activity Feed (sourced from real price, promotion, and banner updates)
  interface ActivityItem {
    id: string;
    type: 'Harga' | 'Promo' | 'Spanduk';
    title: string;
    subtitle: string;
    status: string;
    statusVariant: 'success' | 'neutral' | 'warning';
    updatedAt: string;
    href: string;
  }

  const recentActivities: ActivityItem[] = [
    ...priceEntries.map((p) => ({
      id: `price-${p.id}`,
      type: 'Harga' as const,
      title: `${p.modelName} (${p.variantName})`,
      subtitle: `${p.priceType.toUpperCase()} ${p.city || 'Semua Kota'} — ${formatRupiah(p.amountIdr)}`,
      status: p.isPublished ? 'Aktif' : 'Draf',
      statusVariant: (p.isPublished ? 'success' : 'neutral') as 'success' | 'neutral',
      updatedAt: p.updatedAt || p.createdAt,
      href: '/admin/harga',
    })),
    ...promotions.map((p) => ({
      id: `promo-${p.id}`,
      type: 'Promo' as const,
      title: p.title,
      subtitle: p.summary,
      status: p.status === 'published' ? 'Aktif' : p.status === 'draft' ? 'Draf' : 'Arsip',
      statusVariant: (p.status === 'published'
        ? 'success'
        : p.status === 'draft'
          ? 'warning'
          : 'neutral') as 'success' | 'warning' | 'neutral',
      updatedAt: p.updatedAt || p.createdAt,
      href: '/admin/promo',
    })),
    ...banners.map((b) => ({
      id: `banner-${b.id}`,
      type: 'Spanduk' as const,
      title: b.title,
      subtitle: b.subtitle || 'Spanduk Beranda',
      status: b.status === 'published' ? 'Aktif' : b.status === 'draft' ? 'Draf' : 'Arsip',
      statusVariant: (b.status === 'published'
        ? 'success'
        : b.status === 'draft'
          ? 'warning'
          : 'neutral') as 'success' | 'warning' | 'neutral',
      updatedAt: b.updatedAt || b.createdAt,
      href: '/admin/banner',
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Subtle Indonesian Date Display
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const adminName = session.profile.displayName || 'Admin';

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* 1. Header Section */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminDashboard.greeting}, {adminName}
          </h1>
          <p className="mt-1 text-sm text-body">{dealershipCopy.adminDashboard.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <time dateTime={today} className="text-xs text-muted font-medium">
            {formattedDate}
          </time>
          <Badge variant="neutral" size="sm">
            {session.profile.role === 'admin' ? 'Administrator' : session.profile.role}
          </Badge>
        </div>
      </section>

      {/* 2. Business Overview Summary Cards */}
      <section aria-labelledby="section-overview">
        <h2 id="section-overview" className="sr-only">
          Ringkasan Bisnis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Model Motor */}
          <Card padding="md" className="border-t-4 border-t-ink space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {dealershipCopy.adminDashboard.metrics.motorcycleModels}
              </span>
              <span className="p-1.5 bg-neutral-2 text-ink rounded-none" aria-hidden="true">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-ink font-heading">
                {publishedModelsCount}
              </p>
              <p className="mt-1 text-xs text-body leading-relaxed">
                {dealershipCopy.adminDashboard.metrics.motorcycleModelsDesc}
              </p>
            </div>
          </Card>

          {/* Card 2: Harga Aktif */}
          <Card padding="md" className="border-t-4 border-t-primary space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {dealershipCopy.adminDashboard.metrics.activePrices}
              </span>
              <span className="p-1.5 bg-primary/10 text-primary rounded-none" aria-hidden="true">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-ink font-heading">
                {activePricesCount}
              </p>
              <p className="mt-1 text-xs text-body leading-relaxed">
                {dealershipCopy.adminDashboard.metrics.activePricesDesc}
              </p>
            </div>
          </Card>

          {/* Card 3: Promo Aktif */}
          <Card padding="md" className="border-t-4 border-t-emerald-600 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {dealershipCopy.adminDashboard.metrics.activePromos}
              </span>
              <span
                className="p-1.5 bg-emerald-50 text-emerald-700 rounded-none"
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                  />
                </svg>
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-ink font-heading">
                {activePromotionsCount}
              </p>
              <p className="mt-1 text-xs text-body leading-relaxed">
                {dealershipCopy.adminDashboard.metrics.activePromosDesc}
              </p>
            </div>
          </Card>

          {/* Card 4: Inquiry Baru */}
          <Card padding="md" className="border-t-4 border-t-blue-600 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {dealershipCopy.adminDashboard.metrics.newInquiries}
              </span>
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-none" aria-hidden="true">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </span>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-ink font-heading">
                {newInquiriesCount !== null ? newInquiriesCount : '—'}
              </p>
              <p className="mt-1 text-xs text-body leading-relaxed">
                {dealershipCopy.adminDashboard.metrics.newInquiriesDesc}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. Quick Actions */}
      <section aria-labelledby="section-quick-actions" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2
              id="section-quick-actions"
              className="text-lg font-bold tracking-tight text-ink font-heading"
            >
              {dealershipCopy.adminDashboard.quickActions.title}
            </h2>
            <p className="text-xs text-body">
              {dealershipCopy.adminDashboard.quickActions.subtitle}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-muted">Pratinjau Publik:</span>
            <Link href="/motor" className="text-ink hover:text-primary font-medium underline">
              Katalog
            </Link>
            <span className="text-hairline">|</span>
            <Link href="/harga" className="text-ink hover:text-primary font-medium underline">
              Daftar Harga
            </Link>
            <span className="text-hairline">|</span>
            <Link href="/promo" className="text-ink hover:text-primary font-medium underline">
              Promo
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Action 1: Kelola Harga OTR */}
          <Link href="/admin/harga" className="group block focus:outline-none">
            <Card
              padding="md"
              className="h-full border border-hairline group-hover:border-primary group-focus:ring-2 group-focus:ring-primary transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Tarif & Wilayah
                  </span>
                  <span
                    className="text-xs font-medium text-primary group-hover:underline"
                    aria-hidden="true"
                  >
                    Buka Modul &rarr;
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                  {dealershipCopy.adminDashboard.quickActions.addPriceTitle}
                </h3>
                <p className="text-xs text-body leading-relaxed">
                  {dealershipCopy.adminDashboard.quickActions.addPriceDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-hairline mt-4">
                <span className="text-[11px] font-semibold text-primary group-hover:underline">
                  Buka Pengelolaan Harga &rarr;
                </span>
              </div>
            </Card>
          </Link>

          {/* Action 2: Kelola Promosi */}
          <Link href="/admin/promo" className="group block focus:outline-none">
            <Card
              padding="md"
              className="h-full border border-hairline group-hover:border-primary group-focus:ring-2 group-focus:ring-primary transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Program Diskon
                  </span>
                  <span
                    className="text-xs font-medium text-primary group-hover:underline"
                    aria-hidden="true"
                  >
                    Buka Modul &rarr;
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                  {dealershipCopy.adminDashboard.quickActions.createPromoTitle}
                </h3>
                <p className="text-xs text-body leading-relaxed">
                  {dealershipCopy.adminDashboard.quickActions.createPromoDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-hairline mt-4">
                <span className="text-[11px] font-semibold text-primary group-hover:underline">
                  Buka Pengelolaan Promo &rarr;
                </span>
              </div>
            </Card>
          </Link>

          {/* Action 3: Kelola Spanduk Hero */}
          <Link href="/admin/banner" className="group block focus:outline-none">
            <Card
              padding="md"
              className="h-full border border-hairline group-hover:border-primary group-focus:ring-2 group-focus:ring-primary transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Tampilan Beranda
                  </span>
                  <span
                    className="text-xs font-medium text-primary group-hover:underline"
                    aria-hidden="true"
                  >
                    Buka Modul &rarr;
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                  {dealershipCopy.adminDashboard.quickActions.manageBannersTitle}
                </h3>
                <p className="text-xs text-body leading-relaxed">
                  {dealershipCopy.adminDashboard.quickActions.manageBannersDesc}
                </p>
              </div>
              <div className="pt-4 border-t border-hairline mt-4">
                <span className="text-[11px] font-semibold text-primary group-hover:underline">
                  Buka Pengelolaan Spanduk &rarr;
                </span>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* 4. Needs Attention Section */}
      <section aria-labelledby="section-attention" className="space-y-4">
        <div>
          <h2
            id="section-attention"
            className="text-lg font-bold tracking-tight text-ink font-heading"
          >
            {dealershipCopy.adminDashboard.needsAttention.title}
          </h2>
          <p className="text-xs text-body">
            {dealershipCopy.adminDashboard.needsAttention.subtitle}
          </p>
        </div>

        {modelsWithoutPrices.length === 0 &&
        endingSoonPromos.length === 0 &&
        totalDraftCount === 0 ? (
          <Card padding="md" className="border-l-4 border-l-emerald-600 bg-canvas">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" aria-hidden="true" />
              <p className="text-sm font-medium text-ink">
                {dealershipCopy.adminDashboard.needsAttention.allClear}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attention Item 1: Published models without active price */}
            <Card
              padding="md"
              className={`space-y-3 ${
                modelsWithoutPrices.length > 0
                  ? 'border-l-4 border-l-primary bg-canvas'
                  : 'border-l-4 border-l-emerald-600 bg-canvas opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Katalog Tanpa Harga
                </span>
                <Badge variant={modelsWithoutPrices.length > 0 ? 'primary' : 'success'} size="sm">
                  {modelsWithoutPrices.length > 0
                    ? `${modelsWithoutPrices.length} Model`
                    : 'Lengkap'}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-ink">
                {dealershipCopy.adminDashboard.needsAttention.modelsWithoutPrice}
              </h3>
              {modelsWithoutPrices.length > 0 ? (
                <>
                  <p className="text-xs text-body leading-relaxed">
                    {modelsWithoutPrices.length}{' '}
                    {dealershipCopy.adminDashboard.needsAttention.modelsWithoutPriceDesc}:
                  </p>
                  <ul className="text-xs text-body space-y-1 list-disc list-inside font-medium">
                    {modelsWithoutPrices.slice(0, 3).map((m) => (
                      <li key={m.id} className="truncate">
                        {m.name}
                      </li>
                    ))}
                    {modelsWithoutPrices.length > 3 && (
                      <li className="text-muted">
                        +{modelsWithoutPrices.length - 3} model lainnya
                      </li>
                    )}
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/admin/harga"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center"
                    >
                      Tambahkan Harga Sekarang &rarr;
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-body">
                  Seluruh model motor aktif telah dilengkapi harga berlaku.
                </p>
              )}
            </Card>

            {/* Attention Item 2: Promotions Ending Soon */}
            <Card
              padding="md"
              className={`space-y-3 ${
                endingSoonPromos.length > 0
                  ? 'border-l-4 border-l-amber-500 bg-canvas'
                  : 'border-l-4 border-l-emerald-600 bg-canvas opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Masa Berlaku Promo
                </span>
                <Badge variant={endingSoonPromos.length > 0 ? 'warning' : 'success'} size="sm">
                  {endingSoonPromos.length > 0 ? `${endingSoonPromos.length} Promo` : 'Aman'}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-ink">
                {dealershipCopy.adminDashboard.needsAttention.promosEndingSoon}
              </h3>
              {endingSoonPromos.length > 0 ? (
                <>
                  <p className="text-xs text-body leading-relaxed">
                    {endingSoonPromos.length}{' '}
                    {dealershipCopy.adminDashboard.needsAttention.promosEndingSoonDesc}:
                  </p>
                  <ul className="text-xs text-body space-y-1 font-medium">
                    {endingSoonPromos.slice(0, 3).map((p) => (
                      <li key={p.id} className="truncate">
                        &bull; {p.title} (s/d {new Date(p.endsAt).toLocaleDateString('id-ID')})
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/admin/promo"
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center"
                    >
                      Tinjau Program Promo &rarr;
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-xs text-body">
                  Tidak ada program promosi aktif yang berakhir dalam 7 hari ke depan.
                </p>
              )}
            </Card>

            {/* Attention Item 3: Draft Content */}
            <Card
              padding="md"
              className={`space-y-3 ${
                totalDraftCount > 0
                  ? 'border-l-4 border-l-ink bg-canvas'
                  : 'border-l-4 border-l-emerald-600 bg-canvas opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Publikasi Konten
                </span>
                <Badge variant={totalDraftCount > 0 ? 'neutral' : 'success'} size="sm">
                  {totalDraftCount > 0 ? `${totalDraftCount} Item` : 'Terbit'}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-ink">
                {dealershipCopy.adminDashboard.needsAttention.draftContent}
              </h3>
              {totalDraftCount > 0 ? (
                <>
                  <p className="text-xs text-body leading-relaxed">
                    Terdapat entri yang masih dalam tahap perancangan:
                  </p>
                  <ul className="text-xs text-body space-y-1 font-medium">
                    {draftPrices.length > 0 && (
                      <li>&bull; {draftPrices.length} entri harga belum dipublikasikan</li>
                    )}
                    {draftPromos.length > 0 && (
                      <li>&bull; {draftPromos.length} program promo berstatus draf</li>
                    )}
                    {draftBanners.length > 0 && (
                      <li>&bull; {draftBanners.length} spanduk hero belum tayang</li>
                    )}
                  </ul>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-ink">
                    {draftPrices.length > 0 && (
                      <Link href="/admin/harga" className="hover:underline text-primary">
                        Buka Harga &rarr;
                      </Link>
                    )}
                    {draftPromos.length > 0 && (
                      <Link href="/admin/promo" className="hover:underline text-primary">
                        Buka Promo &rarr;
                      </Link>
                    )}
                    {draftBanners.length > 0 && (
                      <Link href="/admin/banner" className="hover:underline text-primary">
                        Buka Spanduk &rarr;
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-body">
                  Seluruh entri harga, promosi, dan spanduk telah dipublikasikan.
                </p>
              )}
            </Card>
          </div>
        )}
      </section>

      {/* 5. Recent Activity Section */}
      <section aria-labelledby="section-recent-activity" className="space-y-4">
        <div>
          <h2
            id="section-recent-activity"
            className="text-lg font-bold tracking-tight text-ink font-heading"
          >
            {dealershipCopy.adminDashboard.recentActivity.title}
          </h2>
          <p className="text-xs text-body">
            {dealershipCopy.adminDashboard.recentActivity.subtitle}
          </p>
        </div>

        {recentActivities.length === 0 ? (
          <Card padding="md" className="text-center py-8">
            <p className="text-sm font-semibold text-ink">
              {dealershipCopy.adminDashboard.recentActivity.emptyTitle}
            </p>
            <p className="text-xs text-muted mt-1">
              {dealershipCopy.adminDashboard.recentActivity.emptyDesc}
            </p>
          </Card>
        ) : (
          <Card padding="none" className="border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-neutral-2/60 text-muted font-semibold uppercase tracking-wider">
                    <th scope="col" className="px-4 py-3">
                      {dealershipCopy.adminDashboard.recentActivity.tableHeaderType}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {dealershipCopy.adminDashboard.recentActivity.tableHeaderItem}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {dealershipCopy.adminDashboard.recentActivity.tableHeaderStatus}
                    </th>
                    <th scope="col" className="px-4 py-3">
                      {dealershipCopy.adminDashboard.recentActivity.tableHeaderDate}
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {recentActivities.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-2/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">
                        <Badge
                          variant={
                            item.type === 'Harga'
                              ? 'primary'
                              : item.type === 'Promo'
                                ? 'neutral'
                                : 'neutral'
                          }
                          size="sm"
                        >
                          {item.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink line-clamp-1">{item.title}</p>
                        <p className="text-muted text-[11px] line-clamp-1">{item.subtitle}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={item.statusVariant} size="sm">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {new Date(item.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={item.href}
                          className="font-semibold text-primary hover:underline"
                        >
                          Kelola &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
