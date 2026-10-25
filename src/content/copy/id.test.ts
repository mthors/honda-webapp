import { describe, it, expect } from 'vitest';
import { dealershipCopy } from './id';

describe('dealershipCopy', () => {
  it('contains the authorized dealership identity name', () => {
    expect(dealershipCopy.dealer.name).toBe('Honda Mega Persada Mandiri');
  });

  it('includes mandatory corporate disclaimer text', () => {
    expect(dealershipCopy.dealer.corporateDisclaimer).toContain('bukan website resmi korporat');
    expect(dealershipCopy.dealer.corporateDisclaimer).toContain('Astra Honda Motor');
  });

  it('includes mandatory price disclaimer text', () => {
    expect(dealershipCopy.pricing.disclaimer).toContain('Harga OTR');
    expect(dealershipCopy.pricing.disclaimer).toContain('dapat berubah sewaktu-waktu');
  });

  it('has all required Indonesian navigation labels and accessibility descriptions', () => {
    expect(dealershipCopy.nav.home).toBe('Beranda');
    expect(dealershipCopy.nav.motorcycles).toBe('Sepeda Motor');
    expect(dealershipCopy.nav.priceList).toBe('Daftar Harga');
    expect(dealershipCopy.nav.promotions).toBe('Promo');
    expect(dealershipCopy.nav.aboutContact).toBe('Tentang & Kontak');
    expect(dealershipCopy.nav.menuButtonOpen).toBe('Buka menu navigasi');
    expect(dealershipCopy.nav.menuButtonClose).toBe('Tutup menu navigasi');
  });

  it('provides comprehensive inquiry form field labels and consent notice', () => {
    expect(dealershipCopy.inquiry.fullNameLabel).toBeTruthy();
    expect(dealershipCopy.inquiry.whatsappLabel).toBeTruthy();
    expect(dealershipCopy.inquiry.privacyConsent).toBeTruthy();
    expect(dealershipCopy.inquiry.privacyConsent).toContain('Honda Mega Persada Mandiri');
  });
});
