import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PublicFooter } from './PublicFooter';

describe('PublicFooter component', () => {
  it('renders the dealership identity name and official badge', () => {
    render(<PublicFooter />);
    expect(screen.getByText('HONDA')).toBeInTheDocument();
    expect(screen.getByText('MEGA PERSADA MANDIRI')).toBeInTheDocument();
    expect(screen.getByText('Dealer Resmi Honda')).toBeInTheDocument();
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
      new RegExp(`© ${currentYear} Honda Mega Persada Mandiri`, 'i')
    );
    expect(copyright).toBeInTheDocument();
  });
});
