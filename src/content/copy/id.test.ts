import { describe, it, expect } from 'vitest';
import { dealershipCopy } from './id';

describe('dealershipCopy', () => {
  it('contains the authorized dealership identity name', () => {
    expect(dealershipCopy.dealer.name).toBe('Honda Mega Persada Mandiri');
  });

  it('includes mandatory price disclaimer text', () => {
    expect(dealershipCopy.pricing.disclaimer).toContain('Harga OTR');
    expect(dealershipCopy.pricing.disclaimer).toContain('dapat berubah sewaktu-waktu');
  });

  it('has all required Indonesian navigation labels', () => {
    expect(dealershipCopy.nav.home).toBe('Beranda');
    expect(dealershipCopy.nav.motorcycles).toBe('Sepeda Motor');
    expect(dealershipCopy.nav.priceList).toBe('Daftar Harga');
    expect(dealershipCopy.nav.promotions).toBe('Promo');
    expect(dealershipCopy.nav.aboutContact).toBe('Tentang & Kontak');
    expect(dealershipCopy.nav.adminLogin).toBe('Portal Staf');
  });

  it('provides comprehensive inquiry form field labels and consent notice', () => {
    expect(dealershipCopy.inquiry.fullNameLabel).toBeTruthy();
    expect(dealershipCopy.inquiry.whatsappLabel).toBeTruthy();
    expect(dealershipCopy.inquiry.privacyConsent).toBeTruthy();
    expect(dealershipCopy.inquiry.privacyConsent).toContain('Honda Mega Persada Mandiri');
  });
});
