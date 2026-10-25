import React from 'react';
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
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Autentikasi & Sesi
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <h2 className="text-base font-semibold text-ink">Verifikasi Server Aktif</h2>
          <p className="text-xs text-muted leading-relaxed">
            Sesi administrator terverifikasi melalui data server-side{' '}
            <code className="text-ink font-mono bg-canvas px-1 rounded">staff_profiles</code>.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Pondasi Database
            </span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <h2 className="text-base font-semibold text-ink">Skema V1 & RLS Terpasang</h2>
          <p className="text-xs text-muted leading-relaxed">
            14 tabel entitas dan kebijakan keamanan baris (RLS) siap untuk modul katalog dan prospek
            inquiry.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Tahap Pengembangan
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-ink">Milestone 2 Selesai</h2>
          <p className="text-xs text-muted leading-relaxed">
            Pengelolaan katalog motor (M3) dan rincian harga OTR (M4) akan diimplementasikan pada
            tahap berikutnya.
          </p>
        </Card>
      </div>

      <div className="p-6 rounded-xl border border-hairline bg-surface space-y-3">
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
