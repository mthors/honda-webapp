import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { InquiryForm } from '@/components/public/inquiry/InquiryForm';
import { getInquiryModelOptions } from '@/lib/inquiries/queries';

export const metadata: Metadata = {
  title: 'Hubungi & Konsultasi — Honda Satrya Dealer Group',
  description:
    'Konsultasi pembelian motor Honda, informasi harga OTR resmi, alamat showroom, jam layanan, dan pengajuan pertanyaan pelanggan.',
};

export default async function HubungiPage() {
  const modelOptions = await getInquiryModelOptions();
  const whatsappNumber = process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Halo Honda Satrya Dealer Group, saya ingin berkonsultasi mengenai motor Honda.'
      )}`
    : null;

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

        {/* Main Content Layout: Form & Showroom Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          {/* Left Column: Public Inquiry Capture Form */}
          <div className="lg:col-span-7">
            <Suspense fallback={<Card padding="lg">Memuat formulir konsultasi...</Card>}>
              <InquiryForm modelOptions={modelOptions} dealerWhatsApp={whatsappNumber} />
            </Suspense>
          </div>

          {/* Right Column: Fast WhatsApp Contact & Showroom Info */}
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
                  Nomor WhatsApp Resmi
                </span>
                <span className="text-lg font-bold text-ink">
                  {whatsappNumber ? `+${whatsappNumber}` : dealershipCopy.dealer.phone}
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

            {/* Showroom & Operating Hours Card */}
            <Card variant="canvas" padding="lg" className="border-t-4 border-t-surface-alt">
              <h2 className="text-xl font-bold text-ink mb-2 font-heading">
                {dealershipCopy.contact.showroomLocation}
              </h2>
              <p className="text-sm text-body leading-relaxed mb-4">
                {dealershipCopy.dealer.addressPlaceholder}
              </p>

              <div className="pt-4 border-t border-hairline mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-heading mb-1">
                  {dealershipCopy.contact.operatingHoursTitle}
                </h3>
                <p className="text-sm text-ink leading-relaxed">
                  {dealershipCopy.dealer.operatingHours}
                </p>
              </div>

              <div className="pt-4 border-t border-hairline">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-heading mb-1">
                  Layanan Email
                </h3>
                <p className="text-sm text-ink">{dealershipCopy.dealer.email}</p>
              </div>
            </Card>
          </div>
        </div>

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
