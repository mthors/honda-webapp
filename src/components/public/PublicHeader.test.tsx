import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PublicHeader } from './PublicHeader';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('PublicHeader component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dealership logo and identity text', () => {
    render(<PublicHeader />);
    const dealerName = screen.getByText('HONDA');
    expect(dealerName).toBeInTheDocument();
    expect(screen.getByText('MEGA PERSADA MANDIRI')).toBeInTheDocument();
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

