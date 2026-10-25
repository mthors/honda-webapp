import React from 'react';
import { Metadata } from 'next';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Hubungi Kami — Honda Satrya Dealer Group',
  description:
    'Informasi kontak resmi, alamat showroom, jam layanan, dan nomor WhatsApp dealer Honda Satrya Dealer Group.',
};

export default function HubungiPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        'Halo Honda Satrya Dealer Group, saya ingin berkonsultasi mengenai motor Honda.'
      )}`
    : null;

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <div className="max-w-3xl mb-10">
          <Badge variant="primary" size="sm" className="mb-3">
            Informasi Dealer
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink font-manrope">
            {dealershipCopy.contact.title}
          </h1>
          <p className="mt-3 text-base text-body leading-relaxed">
            {dealershipCopy.contact.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* WhatsApp Card */}
          <Card variant="canvas" padding="lg" className="border-t-4 border-t-primary">
            <h2 className="text-xl font-bold text-ink mb-2 font-manrope">
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
            <h2 className="text-xl font-bold text-ink mb-2 font-manrope">
              {dealershipCopy.contact.showroomLocation}
            </h2>
            <p className="text-sm text-body leading-relaxed mb-4">
              {dealershipCopy.dealer.addressPlaceholder}
            </p>

            <div className="pt-4 border-t border-hairline mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-manrope mb-1">
                {dealershipCopy.contact.operatingHoursTitle}
              </h3>
              <p className="text-sm text-ink leading-relaxed">
                {dealershipCopy.dealer.operatingHours}
              </p>
            </div>

            <div className="pt-4 border-t border-hairline">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted font-manrope mb-1">
                Layanan Email
              </h3>
              <p className="text-sm text-ink">{dealershipCopy.dealer.email}</p>
            </div>
          </Card>
        </div>

        {/* Corporate Disclaimer */}
        <Card
          variant="neutral"
          padding="md"
          className="border border-hairline text-xs text-muted leading-relaxed"
        >
          <p>{dealershipCopy.dealer.corporateDisclaimer}</p>
        </Card>
      </Container>
    </div>
  );
}
