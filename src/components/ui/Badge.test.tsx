import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge component', () => {
  it('renders primary variant with brand red styling', () => {
    render(<Badge variant="primary">Promo Baru</Badge>);
    const badge = screen.getByText('Promo Baru');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-primary');
    expect(badge).toHaveClass('rounded-xs');
  });

  it('renders semantic success status variant', () => {
    render(<Badge variant="success">Aktif</Badge>);
    const badge = screen.getByText('Aktif');
    expect(badge).toHaveClass('text-status-success');
  });

  it('renders semantic error variant', () => {
    render(<Badge variant="error">Kadaluarsa</Badge>);
    const badge = screen.getByText('Kadaluarsa');
    expect(badge).toHaveClass('text-status-error');
  });
});

