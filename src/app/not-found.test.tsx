import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RootNotFound from './not-found';

describe('RootNotFound (404 Page)', () => {
  it('renders 404 heading, Indonesian title, and friendly message', () => {
    render(<RootNotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /Halaman tidak ditemukan/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Halaman yang Anda tuju tidak ditemukan/i)).toBeInTheDocument();
  });

  it('renders navigation CTAs to home and catalog', () => {
    render(<RootNotFound />);
    expect(screen.getByRole('link', { name: /Kembali ke Beranda/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Lihat Katalog Motor/i })).toHaveAttribute(
      'href',
      '/motor'
    );
  });
});
