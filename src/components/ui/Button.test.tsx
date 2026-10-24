import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button component', () => {
  it('renders button with primary variant styling and children text', () => {
    render(<Button variant="primary">Hubungi Sales</Button>);
    const button = screen.getByRole('button', { name: /Hubungi Sales/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('rounded-md');
  });

  it('renders outline variant correctly', () => {
    render(<Button variant="outline">Lihat Detail</Button>);
    const button = screen.getByRole('button', { name: /Lihat Detail/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('border-hairline');
  });

  it('handles click events properly', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Klik Saya</Button>);
    const button = screen.getByRole('button', { name: /Klik Saya/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('honors disabled attribute and prevents interactions', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Tidak Aktif
      </Button>
    );
    const button = screen.getByRole('button', { name: /Tidak Aktif/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
