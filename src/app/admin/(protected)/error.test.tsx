import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminProtectedError from './error';

describe('AdminProtectedError Component', () => {
  const mockError = new Error('Postgres connection failed: 5432');
  (mockError as Error & { digest?: string }).digest = 'ADMIN_ERR_99';

  it('renders admin error boundary heading and Indonesian message without leaking details', () => {
    const resetMock = vi.fn();
    render(<AdminProtectedError error={mockError} reset={resetMock} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /Kendala Memuat Panel Administrator/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Terjadi kesalahan saat memuat data atau memproses permintaan/i)
    ).toBeInTheDocument();

    // Verify raw postgres error is not exposed
    expect(screen.queryByText(/Postgres connection failed/i)).not.toBeInTheDocument();
  });

  it('invokes reset callback on "Coba Lagi"', () => {
    const resetMock = vi.fn();
    render(<AdminProtectedError error={mockError} reset={resetMock} />);

    const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
    fireEvent.click(retryBtn);

    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it('renders link to dashboard "/admin"', () => {
    const resetMock = vi.fn();
    render(<AdminProtectedError error={mockError} reset={resetMock} />);

    expect(screen.getByRole('link', { name: /Kembali ke Dasbor/i })).toHaveAttribute(
      'href',
      '/admin'
    );
  });
});
