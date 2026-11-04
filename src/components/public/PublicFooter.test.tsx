import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PublicFooter } from './PublicFooter';
import type { SiteSettings } from '@/types/settings';

describe('PublicFooter component', () => {
  it('renders the dealership identity name and official badge with default fallback', () => {
    render(<PublicFooter />);
    expect(screen.getByText('HONDA')).toBeInTheDocument();
    expect(screen.getByText('SATRYA DEALER GROUP')).toBeInTheDocument();
    expect(screen.getByText('Dealer Resmi Honda')).toBeInTheDocument();
  });

  it('renders configured dealer name when settings prop is provided', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Surabaya',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281234567890',
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicFooter settings={mockSettings} />);
    expect(screen.getByText('HONDA')).toBeInTheDocument();
    expect(screen.getByText('SATRYA SURABAYA')).toBeInTheDocument();
  });

  it('renders social links only when configured and omits them when empty', () => {
    // 1. Without social links
    const { rerender } = render(<PublicFooter />);
    expect(screen.queryByText('Media Sosial Resmi')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Instagram/i)).not.toBeInTheDocument();

    // 2. With Instagram and Facebook configured
    const settingsWithSocial: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281234567890',
      publicEmail: null,
      openingHours: {},
      socialLinks: {
        instagram: 'https://instagram.com/hondasatryademo',
        facebook: 'https://facebook.com/hondasatryademo',
      },
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    rerender(<PublicFooter settings={settingsWithSocial} />);
    expect(screen.getByText('Media Sosial Resmi')).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram Resmi Dealer')).toHaveAttribute(
      'href',
      'https://instagram.com/hondasatryademo'
    );
    expect(screen.getByLabelText('Facebook Resmi Dealer')).toHaveAttribute(
      'href',
      'https://facebook.com/hondasatryademo'
    );
  });

  it('renders email link only when publicEmail is configured', () => {
    // 1. Without email
    const { rerender } = render(<PublicFooter />);
    expect(screen.queryByText('Layanan Email')).not.toBeInTheDocument();

    // 2. With email configured
    const settingsWithEmail: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281234567890',
      publicEmail: 'resmi@satryagroup.co.id',
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    rerender(<PublicFooter settings={settingsWithEmail} />);
    expect(screen.getByText('Layanan Email')).toBeInTheDocument();
    const emailLink = screen.getByRole('link', { name: 'resmi@satryagroup.co.id' });
    expect(emailLink).toHaveAttribute('href', 'mailto:resmi@satryagroup.co.id');
  });

  it('renders the corporate disclaimer distinguishing dealer from AHM corporate', () => {
    render(<PublicFooter />);
    const disclaimer = screen.getByText(/bukan website resmi korporat PT Astra Honda Motor/i);
    expect(disclaimer).toBeInTheDocument();
  });

  it('renders all public navigation quick links', () => {
    render(<PublicFooter />);
    expect(screen.getByRole('link', { name: /Beranda/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Sepeda Motor/i })).toHaveAttribute('href', '/motor');
    expect(screen.getByRole('link', { name: /Daftar Harga/i })).toHaveAttribute('href', '/harga');
    expect(screen.getByRole('link', { name: /Promo/i })).toHaveAttribute('href', '/promo');
    expect(screen.getByRole('link', { name: /Tentang & Kontak/i })).toHaveAttribute(
      'href',
      '/hubungi'
    );
  });

  it('renders the copyright notice with current year', () => {
    render(<PublicFooter />);
    const currentYear = new Date().getFullYear();
    const copyright = screen.getByText(
      new RegExp(`© ${currentYear} Honda Satrya Dealer Group`, 'i')
    );
    expect(copyright).toBeInTheDocument();
  });
});
