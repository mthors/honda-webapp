import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InquiryForm } from '@/components/public/inquiry/InquiryForm';
import { getInquiryModelOptions } from '@/lib/inquiries/queries';
import { getSiteSettings, getActiveDealerships } from '@/lib/settings/queries';
import { normalizeIndonesianPhone } from '@/lib/formatters';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const dealerName = settings?.dealerName || 'Honda Satrya Dealer Group';

  return {
    title: `Hubungi & Konsultasi — ${dealerName}`,
    description:
      'Konsultasi pembelian motor Honda, informasi harga OTR resmi, alamat showroom, jam layanan, dan pengajuan pertanyaan pelanggan.',
  };
}

export default async function HubungiPage() {
  const [modelOptions, settings, dealerships] = await Promise.all([
    getInquiryModelOptions(),
    getSiteSettings(),
    getActiveDealerships(),
  ]);

  const dealerName = settings?.dealerName?.trim() || 'Honda Satrya Dealer Group';

  // Safe WhatsApp Resolution
  const rawWhatsApp = settings?.whatsappNumber || process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
  const cleanWhatsApp = rawWhatsApp ? normalizeIndonesianPhone(rawWhatsApp) : '';
  const hasValidWhatsApp = cleanWhatsApp.length >= 9;
  const whatsappUrl = hasValidWhatsApp
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
        `Halo ${dealerName}, saya ingin berkonsultasi mengenai motor Honda.`
      )}`
    : null;

  // Resolve Consultation Hours
  const consultationHours =
    settings?.openingHours?.consultation_hours?.trim() || dealershipCopy.dealer.operatingHours;

  return (
    <div className="py-12 sm:py-16">
      <Container>
        {/* Header Section */}
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            Layanan Pelanggan
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-heading">
            {dealershipCopy.contact.title}
          </h1>
          <p className="mt-3 text-base text-body leading-relaxed">
            {dealershipCopy.contact.subtitle}
          </p>
        </div>

        {/* Main Content Layout: Form & Group Quick Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          {/* Left Column: Public Inquiry Capture Form */}
          <div className="lg:col-span-7">
            <Suspense fallback={<Card padding="lg">Memuat formulir konsultasi...</Card>}>
              <InquiryForm
                modelOptions={modelOptions}
                dealerWhatsApp={cleanWhatsApp || undefined}
                privacyNotice={settings?.privacyNotice}
              />
            </Suspense>
          </div>

          {/* Right Column: Group Fast Contact & Central Hours */}
          <div className="lg:col-span-5 space-y-6">
            {/* WhatsApp Card */}
            <Card variant="canvas" padding="lg" className="border-t-4 border-t-primary">
              <h2 className="text-xl font-bold text-ink mb-2 font-heading">
                {dealershipCopy.contact.whatsappTitle}
              </h2>
              <p className="text-sm text-body leading-relaxed mb-6">
                {dealershipCopy.contact.whatsappDescription}
              </p>

              <div className="bg-neutral-2 p-4 mb-6">
                <span className="text-xs text-muted block uppercase font-semibold">
                  Nomor WhatsApp Resmi Sentral
                </span>
                <span className="text-lg font-bold text-ink font-mono">
                  {hasValidWhatsApp ? `+${cleanWhatsApp}` : 'Nomor Belum Dikonfigurasi'}
                </span>
              </div>

              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" fullWidth size="md">
                    Hubungi via WhatsApp
                  </Button>
                </a>
              ) : (
                <Button variant="secondary" fullWidth size="md" disabled>
                  Nomor Belum Dikonfigurasi
                </Button>
              )}
            </Card>

            {/* Central Consultation & Contact Info Card */}
            <Card
              variant="canvas"
              padding="lg"
              className="border-t-4 border-t-surface-alt space-y-4"
            >
              <div>
                <h2 className="text-xl font-bold text-ink mb-1 font-heading">
                  {dealershipCopy.contact.groupConsultationTitle}
                </h2>
                <p className="text-xs text-muted">
                  Layanan konsultasi terpusat Honda Satrya Dealer Group.
                </p>
              </div>

              <div className="pt-3 border-t border-hairline">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-heading mb-1">
                  {dealershipCopy.contact.operatingHoursTitle}
                </h3>
                <p className="text-sm text-ink leading-relaxed">{consultationHours}</p>
              </div>

              {/* Public Email (Only rendered when configured) */}
              {settings?.publicEmail && (
                <div className="pt-3 border-t border-hairline">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-heading mb-1">
                    Layanan Email Resmi
                  </h3>
                  <a
                    href={`mailto:${settings.publicEmail}`}
                    className="text-sm text-ink hover:text-primary transition-colors underline font-mono"
                  >
                    {settings.publicEmail}
                  </a>
                </div>
              )}

              {/* Quick Jump to Showroom Locations */}
              <div className="pt-3 border-t border-hairline">
                <a
                  href="#lokasi-showroom"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                >
                  <span>Lihat {dealerships.length} Lokasi Showroom Terdaftar</span>
                  <span aria-hidden="true">&darr;</span>
                </a>
              </div>
            </Card>
          </div>
        </div>

        {/* Dedicated Showroom Locations Section */}
        <section id="lokasi-showroom" className="mb-14 space-y-6 scroll-mt-24">
          <div className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-heading">
                {dealershipCopy.contact.showroomLocation}
              </h2>
              <p className="mt-1 text-sm text-body">{dealershipCopy.contact.networkSubtitle}</p>
            </div>
            {dealerships.length > 0 && (
              <span className="text-xs text-muted">
                {dealerships.length} Showroom Aktif Terdaftar
              </span>
            )}
          </div>

          {dealerships.length === 0 ? (
            <Card variant="neutral" padding="lg" className="text-center text-muted">
              <p className="text-sm">{dealershipCopy.contact.noShowrooms}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealerships.map((d) => {
                const branchWhatsApp = d.whatsappNumber
                  ? normalizeIndonesianPhone(d.whatsappNumber)
                  : '';
                const hasBranchWA = branchWhatsApp.length >= 9;
                const branchWaUrl = hasBranchWA
                  ? `https://wa.me/${branchWhatsApp}?text=${encodeURIComponent(
                      `Halo ${d.name}, saya ingin menanyakan informasi motor Honda di cabang ${d.city}.`
                    )}`
                  : null;

                return (
                  <Card
                    key={d.id}
                    variant="canvas"
                    padding="md"
                    className="border border-hairline flex flex-col justify-between h-full hover:border-primary/40 transition-colors shadow-2xs"
                  >
                    <div className="space-y-4">
                      {/* Card Header: City, Name & Synthetic Demo Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                            {d.city}
                          </span>
                          <h3 className="text-base font-bold text-ink font-heading mt-0.5">
                            {d.name}
                          </h3>
                        </div>
                        {d.isSynthetic && (
                          <Badge variant="warning" size="sm">
                            {dealershipCopy.adminSettings.syntheticBadge}
                          </Badge>
                        )}
                      </div>

                      {/* Detail Rows */}
                      <div className="space-y-3 text-xs border-t border-hairline pt-3">
                        {/* Address */}
                        <div>
                          <span className="font-semibold text-muted block text-[11px] uppercase tracking-wider">
                            Alamat Showroom
                          </span>
                          <p className="text-body leading-relaxed mt-0.5">
                            {d.address || (
                              <span className="text-muted italic">
                                {dealershipCopy.contact.infoUnavailable}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Opening Hours */}
                        <div>
                          <span className="font-semibold text-muted block text-[11px] uppercase tracking-wider">
                            {dealershipCopy.contact.operatingHoursTitle}
                          </span>
                          <p className="text-body leading-relaxed mt-0.5">
                            {d.openingHours || (
                              <span className="text-muted italic">
                                {dealershipCopy.contact.infoUnavailable}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Contact info */}
                        <div>
                          <span className="font-semibold text-muted block text-[11px] uppercase tracking-wider">
                            {dealershipCopy.contact.branchContact}
                          </span>
                          <div className="text-body mt-0.5 space-y-0.5">
                            {d.phone && <div>Tel: {d.phone}</div>}
                            {d.whatsappNumber && <div>WA: +{branchWhatsApp}</div>}
                            {!d.phone && !d.whatsappNumber && (
                              <span className="text-muted italic">
                                {dealershipCopy.contact.infoUnavailable}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Direct Branch WhatsApp CTA if configured */}
                    {branchWaUrl && (
                      <div className="pt-4 border-t border-hairline mt-4">
                        <a
                          href={branchWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-xs hover:bg-primary/20 transition-colors"
                        >
                          <span>Chat Cabang {d.city}</span>
                          <span aria-hidden="true">&rarr;</span>
                        </a>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Corporate Disclaimer */}
        <Card
          variant="neutral"
          padding="md"
          className="border-hairline text-xs text-muted leading-relaxed"
        >
          <strong className="text-ink font-semibold block mb-1">Penafian Resmi Dealer:</strong>
          {dealershipCopy.dealer.corporateDisclaimer}
        </Card>
      </Container>
    </div>
  );
}
