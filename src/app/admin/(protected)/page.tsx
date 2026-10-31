import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth/admin';
import { dealershipCopy } from '@/content/copy/id';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const metadata = {
  title: 'Dasbor Administrator — Honda Satrya Dealer Group',
  description: 'Dasbor portal administrasi dealer resmi Honda Satrya Dealer Group.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.adminAuth.dashboardTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">{dealershipCopy.adminAuth.dashboardSubtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="neutral" className="text-xs">
            Sesi Aktif: {session.profile.displayName}
          </Badge>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink mb-4">Modul Manajemen Milestone 4</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/harga" className="group block focus:outline-none">
            <Card className="p-6 space-y-3 h-full border border-hairline group-hover:border-primary/40 group-focus:ring-2 group-focus:ring-primary transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Katalog & Tarif
                </span>
                <span className="text-xs font-medium text-primary group-hover:underline">
                  Buka &rarr;
                </span>
              </div>
              <h3 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">
                {dealershipCopy.adminPricing.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {dealershipCopy.adminPricing.subtitle}
              </p>
            </Card>
          </Link>

          <Link href="/admin/promo" className="group block focus:outline-none">
            <Card className="p-6 space-y-3 h-full border border-hairline group-hover:border-primary/40 group-focus:ring-2 group-focus:ring-primary transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Program Diskon
                </span>
                <span className="text-xs font-medium text-primary group-hover:underline">
                  Buka &rarr;
                </span>
              </div>
              <h3 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">
                {dealershipCopy.adminPromotions.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {dealershipCopy.adminPromotions.subtitle}
              </p>
            </Card>
          </Link>

          <Link href="/admin/banner" className="group block focus:outline-none">
            <Card className="p-6 space-y-3 h-full border border-hairline group-hover:border-primary/40 group-focus:ring-2 group-focus:ring-primary transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Tampilan Beranda
                </span>
                <span className="text-xs font-medium text-primary group-hover:underline">
                  Buka &rarr;
                </span>
              </div>
              <h3 className="text-base font-semibold text-ink group-hover:text-primary transition-colors">
                {dealershipCopy.adminBanners.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {dealershipCopy.adminBanners.subtitle}
              </p>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Autentikasi & Sesi
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-ink">Verifikasi Server Aktif</h3>
          <p className="text-xs text-muted leading-relaxed">
            Sesi administrator terverifikasi melalui data server-side{' '}
            <code className="text-ink font-mono bg-canvas px-1 rounded">staff_profiles</code>.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Integritas Audit
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <h3 className="text-base font-semibold text-ink">Audit Transaksional Atomic</h3>
          <p className="text-xs text-muted leading-relaxed">
            Setiap mutasi harga, promo, dan spanduk dieksekusi bersamaan dengan pencatatan audit log
            secara atomik melalui transaksi PostgreSQL.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Perlindungan Konkurensi
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-ink">Pencegahan Tumpang Tindih</h3>
          <p className="text-xs text-muted leading-relaxed">
            Validasi rentang tanggal efektif dan lock tingkat baris mencegah tumpang tindih harga
            secara concurrency-safe.
          </p>
        </Card>
      </div>

      <div className="p-6 rounded-none border border-hairline bg-surface space-y-3">
        <h3 className="text-sm font-semibold text-ink">Informasi Keamanan & Akses</h3>
        <p className="text-xs text-muted leading-relaxed">
          Portal ini dilindungi dengan verifikasi peran ketat pada sisi server. Akses basis data
          dibatasi oleh Row Level Security (RLS) PostgreSQL sehingga data pelanggan dan internal
          dealer tidak dapat diakses secara publik.
        </p>
      </div>
    </div>
  );
}
