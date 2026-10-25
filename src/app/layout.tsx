import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Honda Satrya Dealer Group — Dealer Resmi Motor Honda',
  description:
    'Digital Showroom resmi Honda Satrya Dealer Group. Informasi katalog motor Honda, harga OTR lokal terverifikasi, promo resmi dealer, dan layanan konsultasi pembelian.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={manrope.variable}>
      <body className="antialiased min-h-screen bg-canvas text-ink flex flex-col">{children}</body>
    </html>
  );
}
