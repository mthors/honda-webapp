import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dealershipCopy } from '@/content/copy/id';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { ProductDetailInteractive } from '@/components/public/catalog/ProductDetailInteractive';
import { ProductSpecs } from '@/components/public/catalog/ProductSpecs';
import { getPublishedModelBySlug } from '@/lib/catalog/queries';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface ModelDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ModelDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPublishedModelBySlug(slug);

  if (!model) {
    return {
      title: 'Sepeda Motor Tidak Ditemukan — Honda Satrya Dealer Group',
      description: 'Model sepeda motor yang Anda cari tidak tersedia atau belum dipublikasikan.',
    };
  }

  const title =
    model.seoTitle || `${model.name} — Harga OTR & Spesifikasi | Honda Satrya Dealer Group`;
  const description =
    model.seoDescription ||
    model.shortDescription ||
    `Informasi spesifikasi teknis, varian tipe, pilihan warna resmi, dan harga OTR sepeda motor Honda ${model.name} di Honda Satrya Dealer Group.`;

  const primaryImage = model.images[0]?.storagePath
    ? getStorageImageUrl(model.images[0].storagePath)
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/motor/${model.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/motor/${model.slug}`,
      type: 'website',
      ...(primaryImage ? { images: [{ url: primaryImage, alt: `Honda ${model.name}` }] } : {}),
    },
  };
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { slug } = await params;
  const model = await getPublishedModelBySlug(slug);

  if (!model) {
    notFound();
  }

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
              <Link href="/motor" className="hover:text-ink transition-colors">
                {dealershipCopy.catalog.breadcrumbCatalog}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/motor?kategori=${model.category.slug}`}
                className="hover:text-ink transition-colors"
              >
                {model.category.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-semibold text-ink" aria-current="page">
              {model.name}
            </li>
          </ol>
        </nav>

        {/* Model Title & Category Badges */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="neutral" size="sm">
              {model.category.name}
            </Badge>
            {model.isNew && (
              <Badge variant="primary" size="sm">
                {dealershipCopy.status.newModel}
              </Badge>
            )}
            {model.isFeatured && (
              <Badge variant="neutral" size="sm">
                {dealershipCopy.status.featured}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight font-manrope">
            {model.name}
          </h1>
          {model.shortDescription && (
            <p className="mt-3 text-base text-body max-w-3xl leading-relaxed">
              {model.shortDescription}
            </p>
          )}
        </div>

        {/* Interactive Gallery & Selector Section */}
        <div className="mb-16">
          <ProductDetailInteractive model={model} />
        </div>

        {/* Long Description (if provided) */}
        {model.description && (
          <div className="mb-16 max-w-4xl p-6 sm:p-8 bg-neutral-2/30 border border-hairline">
            <h2 className="text-lg font-bold text-ink font-manrope mb-3">
              Tentang Honda {model.name}
            </h2>
            <div className="text-sm text-body leading-relaxed whitespace-pre-line">
              {model.description}
            </div>
          </div>
        )}

        {/* Technical Specifications Section */}
        <div className="mb-16 max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink font-manrope">
              {dealershipCopy.catalog.specsTitle}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Rincian spesifikasi teknis dan dimensi resmi Honda {model.name}.
            </p>
          </div>
          <ProductSpecs
            engineCc={model.engineCc}
            transmission={model.transmission}
            keySpecs={model.keySpecs}
          />
        </div>

        {/* Dealership Assurance & Corporate Disclaimer */}
        <div className="p-6 bg-neutral-2/30 border border-hairline text-xs text-muted leading-relaxed">
          <p className="font-semibold text-ink mb-1">Informasi Showroom Digital:</p>
          <p>{dealershipCopy.dealer.corporateDisclaimer}</p>
        </div>
      </Container>
    </div>
  );
}
