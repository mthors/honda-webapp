import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getStorageImageUrl } from '@/lib/catalog/image';

interface ReferencePromoBannerProps {
  imageStoragePath?: string;
  promoTitle?: string;
}

export function ReferencePromoBanner({
  imageStoragePath = 'pcx-160-1793861131468-1.webp',
  promoTitle = 'Honda PCX 160 Ultimate Comfort',
}: ReferencePromoBannerProps) {
  const imageUrl = getStorageImageUrl(imageStoragePath);

  return (
    <section aria-label="Spanduk Program Mesin Honda" className="bg-canvas py-10 sm:py-16">
      <Container>
        {/* Wide Dark Banner matching the Reference's "World Most Powerful Motor Bike" */}
        <div className="bg-[#181818] text-white rounded-2xl border border-neutral-800 p-8 sm:p-12 lg:p-14 relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Red Glow in Background */}
          <div
            className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left Column: Bold Editorial Typography */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <Badge variant="primary" size="sm" className="mb-4 self-start font-semibold">
                Teknologi Honda Generasi Baru
              </Badge>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-extrabold font-manrope text-white tracking-tight leading-snug">
                Performa Tangguh <span className="text-primary">Mesin eSP+</span>
                <br />
                <span> Dan Rangka Presisi eSAF</span>
              </h2>

              <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
                Nikmati akselerasi halus bertenaga, konsumsi bahan bakar yang sangat hemat, dan
                kenyamanan bermanuver di segala kondisi jalan. Didukung garansi resmi dan kemudahan
                layanan purna jual di jaringan showroom Honda Satrya Dealership Group.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link href="/hubungi">
                  <Button
                    variant="primary"
                    size="lg"
                    className="font-semibold px-7 py-3 shadow-md hover:shadow-lg"
                  >
                    Konsultasi Sales Showroom
                  </Button>
                </Link>
                <Link href="/promo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-white hover:bg-white hover:text-ink font-semibold px-6 py-3"
                  >
                    Cek Program Promo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Motorcycle in Front of Radiant Red Circle (Exact Reference Reproduction) */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
              {/* Vibrant Red Radiant Sun Circle */}
              <div
                className="w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-primary to-[#ff4757] shadow-[0_0_60px_rgba(230,27,51,0.35)] shrink-0"
                aria-hidden="true"
              />

              {/* High-Resolution Cutout Motorcycle Layered in Front */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full aspect-[4/3] max-w-md">
                  <Image
                    src={imageUrl}
                    alt={promoTitle}
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
