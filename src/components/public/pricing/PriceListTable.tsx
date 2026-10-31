import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CategoryPriceGroup } from '@/types/pricing';
import { dealershipCopy } from '@/content/copy/id';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatRupiah, normalizeIndonesianPhone } from '@/lib/formatters';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface PriceListTableProps {
  groups: CategoryPriceGroup[];
  city?: string;
  dealerWhatsApp?: string;
}

export function PriceListTable({
  groups,
  city = 'Sidoarjo',
  dealerWhatsApp = '081234567890',
}: PriceListTableProps) {
  const waNumber = normalizeIndonesianPhone(dealerWhatsApp);

  // Check if any verified active price is published across all categories
  const hasAnyPublishedPrice = groups.some((group) =>
    group.items.some((item) => item.activePrice !== null)
  );

  return (
    <div className="space-y-10">
      {/* City Scope and Official Disclaimer Notice */}
      <Card variant="neutral" padding="lg" className="border-l-4 border-l-primary">
        <div className="flex items-start space-x-3">
          <span className="text-primary text-xl font-bold leading-none select-none">!</span>
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-ink font-manrope">
                {dealershipCopy.pricing.disclaimerTitle}
              </h2>
              <Badge variant="neutral" size="sm">
                Wilayah: {city}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-body leading-relaxed">
              {dealershipCopy.pricing.disclaimer}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Content: Grouped Categories or Empty State */}
      {groups.length === 0 || !hasAnyPublishedPrice ? (
        <div className="py-16 px-6 text-center bg-neutral-2/40 border border-hairline max-w-2xl mx-auto">
          <Badge variant="neutral" size="sm" className="mb-3">
            Status Pembaruan Dealer
          </Badge>
          <h3 className="text-lg sm:text-xl font-bold text-ink font-manrope mb-2">
            {dealershipCopy.pricing.emptyTitle}
          </h3>
          <p className="text-xs sm:text-sm text-body leading-relaxed max-w-lg mx-auto mb-6">
            {dealershipCopy.pricing.emptyDescription}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                `Halo Honda Satrya Dealer Group, saya ingin menanyakan rincian daftar harga OTR terbaru untuk wilayah ${city}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="md">
                {dealershipCopy.pricing.contactSales}
              </Button>
            </a>
            <Link href="/motor">
              <Button variant="outline" size="md">
                Lihat Katalog Motor →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => {
            if (group.items.length === 0) return null;

            return (
              <section
                key={group.categoryId}
                aria-labelledby={`cat-heading-${group.categorySlug}`}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-hairline">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="neutral" size="sm">
                      Kategori
                    </Badge>
                    <h3
                      id={`cat-heading-${group.categorySlug}`}
                      className="text-xl sm:text-2xl font-bold text-ink font-manrope tracking-tight"
                    >
                      {group.categoryName}
                    </h3>
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {group.items.length} varian tipe
                  </span>
                </div>

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto border border-hairline bg-canvas">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-neutral-2/60 border-b border-hairline text-ink font-bold font-manrope uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 w-16 text-center">Visual</th>
                        <th className="py-3 px-4">{dealershipCopy.pricing.tableHeaderModel}</th>
                        <th className="py-3 px-4">{dealershipCopy.pricing.tableHeaderEngine}</th>
                        <th className="py-3 px-4">{dealershipCopy.pricing.tableHeaderPrice}</th>
                        <th className="py-3 px-4 text-right">
                          {dealershipCopy.pricing.tableHeaderAction}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {group.items.map((item) => {
                        const imgUrl = getStorageImageUrl(item.primaryImage?.storagePath);
                        const waText = encodeURIComponent(
                          `Halo Honda Satrya Dealer Group, saya tertarik dengan penawaran harga OTR motor ${item.modelName} varian ${item.variantName} untuk wilayah ${city}.`
                        );

                        return (
                          <tr
                            key={`${item.modelId}-${item.variantId}`}
                            className="hover:bg-neutral-2/20 transition-colors"
                          >
                            <td className="py-3 px-4 text-center">
                              <div className="relative w-12 h-10 mx-auto bg-neutral-2/40 border border-hairline overflow-hidden flex items-center justify-center">
                                <Image
                                  src={imgUrl}
                                  alt={item.primaryImage?.altText || item.modelName}
                                  fill
                                  sizes="48px"
                                  className="object-contain p-1"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                href={`/motor/${item.modelSlug}`}
                                className="font-bold text-ink hover:text-primary transition-colors block font-manrope"
                              >
                                {item.modelName}
                              </Link>
                              <span className="text-xs text-muted block mt-0.5">
                                Tipe Varian:{' '}
                                <span className="font-semibold text-body">{item.variantName}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted">
                              {[
                                item.engineCc ? `${item.engineCc} cc` : null,
                                item.transmission ? item.transmission : null,
                              ]
                                .filter(Boolean)
                                .join(' • ') || '—'}
                            </td>
                            <td className="py-3 px-4">
                              {item.activePrice !== null ? (
                                <div>
                                  <span className="text-base font-extrabold text-ink font-manrope block">
                                    {formatRupiah(item.activePrice.amountIdr)}
                                  </span>
                                  <span className="text-[11px] text-muted block">OTR {city}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted italic">
                                  {dealershipCopy.pricing.unverifiedNotice}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={`https://wa.me/${waNumber}?text=${waText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="outline" size="sm">
                                  Tanya Sales →
                                </Button>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                  {group.items.map((item) => {
                    const imgUrl = getStorageImageUrl(item.primaryImage?.storagePath);
                    const waText = encodeURIComponent(
                      `Halo Honda Satrya Dealer Group, saya ingin informasi harga OTR motor ${item.modelName} tipe ${item.variantName} di wilayah ${city}.`
                    );

                    return (
                      <Card
                        key={`m-${item.modelId}-${item.variantId}`}
                        variant="canvas"
                        padding="md"
                        className="flex flex-col justify-between border border-hairline"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-16 h-14 shrink-0 bg-neutral-2/40 border border-hairline overflow-hidden flex items-center justify-center">
                            <Image
                              src={imgUrl}
                              alt={item.primaryImage?.altText || item.modelName}
                              fill
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/motor/${item.modelSlug}`}
                              className="text-sm font-bold text-ink hover:text-primary transition-colors font-manrope block"
                            >
                              {item.modelName}
                            </Link>
                            <span className="text-xs text-muted block mt-0.5">
                              Tipe:{' '}
                              <span className="font-semibold text-body">{item.variantName}</span>
                            </span>
                            <span className="text-[11px] text-muted block mt-0.5">
                              {[item.engineCc ? `${item.engineCc} cc` : null, item.transmission]
                                .filter(Boolean)
                                .join(' • ')}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2">
                          <div>
                            {item.activePrice !== null ? (
                              <div>
                                <span className="text-sm font-extrabold text-ink font-manrope block">
                                  {formatRupiah(item.activePrice.amountIdr)}
                                </span>
                                <span className="text-[10px] text-muted block">OTR {city}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted italic">
                                {dealershipCopy.pricing.unverifiedNotice}
                              </span>
                            )}
                          </div>
                          <a
                            href={`https://wa.me/${waNumber}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              Tanya →
                            </Button>
                          </a>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
