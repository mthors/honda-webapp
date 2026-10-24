import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';
import { formatRupiah } from '@/lib/formatters';

export default function HomePage() {
  const samplePrice = 19500000;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Notice Bar */}
      <div className="bg-surface-alt text-on-primary py-2 px-4 text-xs font-medium text-center">
        <span>{dealershipCopy.dealer.officialBadge} — Sidoarjo, Jawa Timur</span>
      </div>

      {/* Header Shell */}
      <header className="border-b border-hairline bg-canvas sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              HONDA <span className="text-primary">MEGA PERSADA MANDIRI</span>
            </span>
            <p className="text-xs text-muted hidden sm:block">{dealershipCopy.dealer.tagline}</p>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-ink">
            <span className="hover:text-primary cursor-pointer transition-colors">
              {dealershipCopy.nav.motorcycles}
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              {dealershipCopy.nav.priceList}
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              {dealershipCopy.nav.promotions}
            </span>
            <span className="hover:text-primary cursor-pointer transition-colors">
              {dealershipCopy.nav.aboutContact}
            </span>
          </nav>

          <div className="flex items-center space-x-3">
            <Button variant="primary" size="sm">
              {dealershipCopy.common.contactSales}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-canvas border-b border-hairline py-12 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary bg-neutral-2 mb-4">
                {dealershipCopy.dealer.officialBadge}
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight leading-tight">
                {dealershipCopy.hero.headline}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-body leading-relaxed">
                {dealershipCopy.hero.subheadline}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button variant="primary" size="lg">
                  {dealershipCopy.hero.primaryCta}
                </Button>
                <Button variant="outline" size="lg">
                  {dealershipCopy.hero.secondaryCta}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Design System Baseline Demonstration */}
        <section className="bg-neutral-2/40 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-ink">
                Pondasi Desain & Status Proyek (M0 Baseline)
              </h2>
              <p className="text-sm text-body mt-1">
                Verifikasi token warna, tipografi Manrope, geometri sharp card, dan komponen tombol
                sesuai DESIGN.md.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sharp Card 1 */}
              <div className="bg-canvas border border-hairline p-6">
                <div className="text-xs uppercase font-semibold text-muted mb-2">
                  Token Harga OTR
                </div>
                <div className="text-2xl font-bold text-ink mb-1">{formatRupiah(samplePrice)}</div>
                <p className="text-xs text-muted mb-4">
                  {dealershipCopy.catalog.startingFrom} OTR Sidoarjo
                </p>
                <div className="pt-4 border-t border-hairline">
                  <span className="inline-flex items-center text-xs font-semibold text-status-success bg-green-50 px-2 py-1">
                    ✓ Terverifikasi Dealer
                  </span>
                </div>
              </div>

              {/* Sharp Card 2 */}
              <div className="bg-canvas border border-hairline p-6">
                <div className="text-xs uppercase font-semibold text-muted mb-2">
                  Status Form Semantic
                </div>
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center justify-between p-2 bg-green-50 text-status-success border border-green-200">
                    <span>Berhasil Terkirim</span>
                    <span>✓</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-amber-50 text-status-warning border border-amber-200">
                    <span>Perlu Konfirmasi Sales</span>
                    <span>!</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 text-status-error border border-red-200">
                    <span>Format Tidak Sesuai</span>
                    <span>✕</span>
                  </div>
                </div>
              </div>

              {/* Sharp Card 3 */}
              <div className="bg-canvas border border-hairline p-6">
                <div className="text-xs uppercase font-semibold text-muted mb-2">
                  Disklasimer Resmi
                </div>
                <p className="text-xs text-body leading-relaxed">
                  {dealershipCopy.pricing.disclaimer}
                </p>
                <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between text-xs text-muted">
                  <span>Varian: CBS / ABS</span>
                  <span className="text-primary font-semibold cursor-pointer">
                    {dealershipCopy.catalog.viewDetails} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Shell */}
      <footer className="bg-surface-alt text-on-primary border-t border-neutral-3 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-on-primary">{dealershipCopy.dealer.name}</h3>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                {dealershipCopy.dealer.tagline}
              </p>
              <p className="text-xs text-muted mt-1">{dealershipCopy.dealer.addressPlaceholder}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Jam Operasional
              </h4>
              <p className="text-xs text-on-primary mt-2">{dealershipCopy.dealer.operatingHours}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Kontak & Layanan
              </h4>
              <p className="text-xs text-on-primary mt-2">
                WhatsApp: {dealershipCopy.dealer.phone}
              </p>
              <p className="text-xs text-on-primary">Email: {dealershipCopy.dealer.email}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-3 flex flex-col sm:flex-row items-center justify-between text-xs text-muted">
            <p>
              © {new Date().getFullYear()} {dealershipCopy.dealer.name}. Hak Cipta Dilindungi.
            </p>
            <p className="mt-2 sm:mt-0">Dealer Resmi Sepeda Motor Honda</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
