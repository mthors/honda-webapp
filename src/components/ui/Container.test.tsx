import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Container } from './Container';

describe('Container component', () => {
  it('renders children with standard container max-width and responsive padding', () => {
    render(<Container data-testid="container">Konten Halaman</Container>);
    const el = screen.getByTestId('container');
    expect(el).toHaveClass('max-w-7xl');
    expect(el).toHaveClass('mx-auto');
    expect(el).toHaveTextContent('Konten Halaman');
  });

  it('renders custom HTML element when as prop is provided', () => {
    render(
      <Container as="section" data-testid="container-section">
        Section
      </Container>
    );
    const el = screen.getByTestId('container-section');
    expect(el.tagName).toBe('SECTION');
  });
});
