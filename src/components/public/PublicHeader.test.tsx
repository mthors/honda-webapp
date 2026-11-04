import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicHeader } from './PublicHeader';
import type { SiteSettings } from '@/types/settings';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('PublicHeader component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dealership logo and identity text with default fallback', () => {
    render(<PublicHeader />);
    const dealerName = screen.getByText('HONDA');
    expect(dealerName).toBeInTheDocument();
    expect(screen.getByText('SATRYA DEALER GROUP')).toBeInTheDocument();
  });

  it('renders configured dealer name when settings prop is provided', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Utama',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281299990000',
      publicEmail: 'kontak@satrya.id',
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    expect(screen.getByText('HONDA')).toBeInTheDocument();
    expect(screen.getByText('SATRYA UTAMA')).toBeInTheDocument();
  });

  it('constructs safe WhatsApp link when configured in settings', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '0812-3456-7890',
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    const contactLinks = screen.getAllByRole('link', { name: /Hubungi Sales/i });
    const waLink = contactLinks.find((l) => l.getAttribute('href')?.includes('wa.me'));
    expect(waLink).toBeDefined();
    // Normalized to international 628... format without leading zero
    expect(waLink?.getAttribute('href')).toContain('wa.me/6281234567890');
  });

  it('normalizes +62 and 08 phone numbers to 628... for WhatsApp universal links', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '+62 857-1122-3344',
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    const contactLinks = screen.getAllByRole('link', { name: /Hubungi Sales/i });
    const waLink = contactLinks.find((l) => l.getAttribute('href')?.includes('wa.me'));
    expect(waLink).toBeDefined();
    expect(waLink?.getAttribute('href')).toContain('wa.me/6285711223344');
  });

  it('falls back to /hubungi internal link when WhatsApp number is missing or invalid', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
    delete process.env.NEXT_PUBLIC_DEALER_WHATSAPP;

    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '', // empty
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    const contactLinks = screen.getAllByRole('link', { name: /Hubungi Sales/i });
    for (const link of contactLinks) {
      expect(link).toHaveAttribute('href', '/hubungi');
    }

    process.env.NEXT_PUBLIC_DEALER_WHATSAPP = originalEnv;
  });

  it('renders desktop navigation links with correct destinations', () => {
    render(<PublicHeader />);
    const desktopNav = screen.getByRole('navigation', { name: 'Navigasi Utama' });
    expect(desktopNav).toBeInTheDocument();

    const homeLink = within(desktopNav).getByRole('link', { name: 'Beranda' });
    expect(homeLink).toHaveAttribute('href', '/');

    const motorLink = within(desktopNav).getByRole('link', { name: 'Sepeda Motor' });
    expect(motorLink).toHaveAttribute('href', '/motor');

    const hargaLink = within(desktopNav).getByRole('link', { name: 'Daftar Harga' });
    expect(hargaLink).toHaveAttribute('href', '/harga');

    const promoLink = within(desktopNav).getByRole('link', { name: 'Promo' });
    expect(promoLink).toHaveAttribute('href', '/promo');

    const hubungiLink = within(desktopNav).getByRole('link', { name: 'Tentang & Kontak' });
    expect(hubungiLink).toHaveAttribute('href', '/hubungi');
  });

  it('supports opening and closing the mobile menu with proper accessibility attributes', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton).toHaveAttribute('aria-controls', 'mobile-navigation');

    // Click to open
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Tutup menu navigasi/i })).toBeInTheDocument();

    // Click to close
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Buka menu navigasi/i })).toBeInTheDocument();
  });

  it('closes mobile menu when a mobile navigation link is activated', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Click a link inside the mobile menu
    const mobileNavRegion = screen.getByRole('region', { name: 'Menu Navigasi Mobile' });
    const motorLink = mobileNavRegion.querySelector('a[href="/motor"]');
    expect(motorLink).toBeTruthy();

    if (motorLink) {
      fireEvent.click(motorLink);
    }

    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes mobile menu when the Escape key is pressed', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
