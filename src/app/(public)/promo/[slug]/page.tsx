import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getPromotionBySlug } from '@/lib/promotions/queries';
import { getStorageImageUrl } from '@/lib/catalog/image';
import { formatRupiah, normalizeIndonesianPhone } from '@/lib/formatters';

interface PromoDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatDateIndonesian(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return isoString.split('T')[0];
  }
}

export async function generateMetadata({ params }: PromoDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const promo = await getPromotionBySlug(slug);

  if (!promo) {
    return {
      title: 'Promo Tidak Ditemukan — Honda Satrya Dealer Group',
      description:
        'Program promo sepeda motor Honda yang Anda cari tidak tersedia atau telah berakhir.',
    };
  }

  const title = `${promo.title} — Promo Dealer Honda Satrya`;
  const description = promo.summary;
  const primaryImage = promo.imagePath ? getStorageImageUrl(promo.imagePath) : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/promo/${promo.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/promo/${promo.slug}`,
      type: 'website',
      ...(primaryImage ? { images: [{ url: primaryImage, alt: promo.title }] } : {}),
    },
  };
}

export default async function PromoDetailPage({ params }: PromoDetailPageProps) {
  const { slug } = await params;
  const promo = await getPromotionBySlug(slug);

  if (!promo) {
    notFound();
  }

  const bannerUrl = getStorageImageUrl(promo.imagePath);
  const startDateStr = formatDateIndonesian(promo.startsAt);
  const endDateStr = formatDateIndonesian(promo.endsAt);
  const waNumber = normalizeIndonesianPhone(
    process.env.NEXT_PUBLIC_DEALER_WHATSAPP || '081234567890'
  );
  const waText = encodeURIComponent(
    `Halo Honda Satrya Dealer Group, saya tertarik dengan program promo "${promo.title}". Mohon informasi syarat dan pengajuan unitnya.`
  );

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center flex-wrap gap-2 text-xs text-muted">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                {dealershipCopy.catalog.breadcrumbHome}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/promo" className="hover:text-ink transition-colors">
                Promo
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-ink" aria-current="page">
              {promo.title}
            </li>
          </ol>
        </nav>

        {/* Promo Title & Validity Banner */}
        <div className="max-w-4xl mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="primary" size="sm">
              {dealershipCopy.promotions.promoActiveBadge}
            </Badge>
            <Badge variant="neutral" size="sm">
              {dealershipCopy.promotions.periodLabel}: {startDateStr} – {endDateStr}
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight font-manrope">
            {promo.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-body leading-relaxed max-w-3xl">
            {promo.summary}
          </p>
        </div>

        {/* Visual Banner */}
        {promo.imagePath && (
          <div className="mb-10 max-w-4xl">
            <div className="relative w-full aspect-[21/9] sm:aspect-[16/7] bg-neutral-2/40 border border-hairline overflow-hidden flex items-center justify-center">
              <Image
                src={bannerUrl}
                alt={promo.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </div>
        )}

        {/* Details & Terms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-4xl mb-12">
          {/* Main Details (if provided) */}
          <div className="lg:col-span-7 space-y-6">
            {promo.details && (
              <div>
                <h2 className="text-lg font-bold text-ink font-manrope mb-3">Rincian Penawaran</h2>
                <div className="text-sm text-body leading-relaxed whitespace-pre-line bg-canvas p-5 border border-hairline">
                  {promo.details}
                </div>
              </div>
            )}

            {/* Terms and Conditions */}
            {promo.terms && (
              <Card variant="neutral" padding="lg" className="border-l-4 border-l-primary">
                <h3 className="text-sm font-bold text-ink font-manrope mb-2">
                  {dealershipCopy.promotions.termsTitle}
                </h3>
                <p className="text-xs sm:text-sm text-body leading-relaxed whitespace-pre-line">
                  {promo.terms}
                </p>
              </Card>
            )}
          </div>

          {/* Action Box */}
          <div className="lg:col-span-5">
            <Card
              variant="canvas"
              padding="lg"
              className="border border-hairline space-y-4 sticky top-6"
            >
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block mb-1">
                  Konsultasi Program
                </span>
                <h3 className="text-base font-bold text-ink font-manrope">
                  Dapatkan Promo Sekarang
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Hubungi konsultan sales kami untuk konfirmasi ketersediaan unit dan simulasi
                  pembelian promo ini.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <a
                  href={`https://wa.me/${waNumber}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="primary" size="md" className="w-full justify-center">
                    {dealershipCopy.promotions.claimPromo}
                  </Button>
                </a>
                <Link href="/hubungi" className="w-full">
                  <Button variant="outline" size="md" className="w-full justify-center">
                    Kontak Showroom
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Eligible Models Section */}
        {promo.eligibleModels.length > 0 && (
          <div className="max-w-4xl pt-8 border-t border-hairline">
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-ink font-manrope">
                {dealershipCopy.promotions.eligibleModelsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1">
                Model sepeda motor Honda berikut termasuk dalam program penawaran promo ini.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {promo.eligibleModels.map((model) => {
                const modelImg = getStorageImageUrl(model.primaryImage?.storagePath);

                return (
                  <Card
                    key={model.id}
                    variant="canvas"
                    padding="none"
                    className="flex flex-col justify-between overflow-hidden border border-hairline hover:border-ink transition-colors group"
                  >
                    <div className="relative w-full aspect-[16/10] bg-neutral-2/40 border-b border-hairline flex items-center justify-center p-3">
                      <Image
                        src={modelImg}
                        alt={model.primaryImage?.altText || model.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge variant="neutral" size="sm" className="absolute top-2 left-2">
                        {model.categoryName}
                      </Badge>
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="font-bold text-sm text-ink font-manrope group-hover:text-primary transition-colors">
                          {model.name}
                        </h4>
                        <div className="mt-2 text-xs">
                          {model.startingPriceIdr !== null ? (
                            <div>
                              <span className="text-[10px] text-muted uppercase font-semibold block">
                                {dealershipCopy.catalog.startingFrom}
                              </span>
                              <span className="font-bold text-ink font-manrope text-sm">
                                {formatRupiah(model.startingPriceIdr)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted italic text-[11px]">
                              {dealershipCopy.catalog.noPriceAvailable}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-hairline">
                        <Link href={`/motor/${model.slug}`} className="block w-full">
                          <Button variant="outline" size="sm" className="w-full justify-center">
                            Lihat Unit →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
