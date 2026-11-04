import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RootError from './error';

describe('RootError Component', () => {
  const mockError = new Error('Database relation leads does not exist');
  (mockError as Error & { digest?: string }).digest = 'ERR_12345';

  it('renders neutral Indonesian error message without leaking sensitive database errors', () => {
    const resetMock = vi.fn();
    render(<RootError error={mockError} reset={resetMock} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Terjadi Kendala pada Sistem/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Terjadi kendala pada sistem\. Silakan coba kembali/i)
    ).toBeInTheDocument();

    // Verify raw internal error message is NOT exposed in the UI
    expect(screen.queryByText(/relation leads does not exist/i)).not.toBeInTheDocument();
    expect(screen.queryByText('ERR_12345')).not.toBeInTheDocument();
  });

  it('invokes reset callback when user clicks "Muat Ulang Halaman"', () => {
    const resetMock = vi.fn();
    render(<RootError error={mockError} reset={resetMock} />);

    const retryButton = screen.getByRole('button', { name: /Muat Ulang Halaman/i });
    fireEvent.click(retryButton);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it('renders links to home and contact page', () => {
    const resetMock = vi.fn();
    render(<RootError error={mockError} reset={resetMock} />);

    expect(screen.getByRole('link', { name: /Kembali ke Beranda/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Hubungi Layanan Kontak Kami/i })).toHaveAttribute(
      'href',
      '/hubungi'
    );
  });
});
