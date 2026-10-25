import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionHeading } from './SectionHeading';

describe('SectionHeading component', () => {
  it('renders section title and optional description', () => {
    render(
      <SectionHeading
        title="Daftar Sepeda Motor"
        description="Pilihan motor Honda terbaik untuk Anda."
      />
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Daftar Sepeda Motor' })
    ).toBeInTheDocument();
    expect(screen.getByText('Pilihan motor Honda terbaik untuk Anda.')).toBeInTheDocument();
  });

  it('renders optional badge above heading', () => {
    render(<SectionHeading title="Harga OTR" badge="Resmi Dealer" />);
    expect(screen.getByText('Resmi Dealer')).toBeInTheDocument();
  });
});
