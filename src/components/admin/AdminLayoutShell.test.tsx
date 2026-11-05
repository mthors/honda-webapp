import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { AdminLayoutShell } from './AdminLayoutShell';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/components/admin/SignOutButton', () => ({
  SignOutButton: () => <button type="button">Keluar</button>,
}));

describe('AdminLayoutShell', () => {
  const mockAdminProfile = {
    displayName: 'Ahmad Dahlan',
    role: 'admin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePathname).mockReturnValue('/admin');
  });

  it('renders persistent sidebar with branding and all required administrative routes', () => {
    render(
      <AdminLayoutShell adminProfile={mockAdminProfile}>
        <div>Halaman Konten Dasbor</div>
      </AdminLayoutShell>
    );

    // Branding
    expect(screen.getAllByText('Honda Satrya Dealer Group').length).toBeGreaterThanOrEqual(1);

    // Navigation links in sidebar
    expect(screen.getByRole('link', { name: /Dasbor/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: /^Motor$/i })).toHaveAttribute('href', '/admin/motor');
    expect(screen.getByRole('link', { name: /Harga/i })).toHaveAttribute('href', '/admin/harga');
    expect(screen.getByRole('link', { name: /Promo/i })).toHaveAttribute('href', '/admin/promo');
    expect(screen.getByRole('link', { name: /Spanduk/i })).toHaveAttribute('href', '/admin/banner');
    expect(screen.getByRole('link', { name: /Inquiry/i })).toHaveAttribute('href', '/admin/leads');
    expect(screen.getByRole('link', { name: /^Dealer$/i })).toHaveAttribute(
      'href',
      '/admin/dealerships'
    );
    expect(screen.getByRole('link', { name: /Pengaturan/i })).toHaveAttribute(
      'href',
      '/admin/settings'
    );

    // Children content
    expect(screen.getByText('Halaman Konten Dasbor')).toBeInTheDocument();
  });

  it('correctly marks the active navigation link based on pathname', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/harga');

    render(
      <AdminLayoutShell adminProfile={mockAdminProfile}>
        <div>Konten Harga</div>
      </AdminLayoutShell>
    );

    const activeHargaLink = screen.getByRole('link', { name: /Harga/i });
    expect(activeHargaLink).toHaveAttribute('aria-current', 'page');

    const dasborLink = screen.getByRole('link', { name: /Dasbor/i });
    expect(dasborLink).not.toHaveAttribute('aria-current');
  });

  it('renders minimal top bar with administrator profile and logout button', () => {
    render(
      <AdminLayoutShell adminProfile={mockAdminProfile}>
        <div>Konten</div>
      </AdminLayoutShell>
    );

    // Top bar admin profile
    expect(screen.getByText('Ahmad Dahlan')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();

    // Logout action present
    expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument();
  });

  it('toggles mobile drawer when hamburger button is clicked and closes on close button', () => {
    render(
      <AdminLayoutShell adminProfile={mockAdminProfile}>
        <div>Konten</div>
      </AdminLayoutShell>
    );

    const toggleButton = screen.getByRole('button', { name: 'Buka menu navigasi admin' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Open drawer
    fireEvent.click(toggleButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Close button inside drawer
    const closeButton = screen.getByRole('button', { name: 'Tutup menu navigasi admin' });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes mobile drawer on Escape key press for keyboard accessibility', () => {
    render(
      <AdminLayoutShell adminProfile={mockAdminProfile}>
        <div>Konten</div>
      </AdminLayoutShell>
    );

    // Open drawer
    const toggleButton = screen.getByRole('button', { name: 'Buka menu navigasi admin' });
    fireEvent.click(toggleButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
