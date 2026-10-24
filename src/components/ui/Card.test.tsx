import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';

describe('Card component', () => {
  it('renders sharp corners (rounded-none) per DESIGN.md specifications', () => {
    render(<Card data-testid="card">Card Body</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('rounded-none');
    expect(card).toHaveClass('border-hairline');
  });

  it('applies dark surface variant when requested', () => {
    render(
      <Card variant="dark" data-testid="card-dark">
        Dark Surface
      </Card>
    );
    const card = screen.getByTestId('card-dark');
    expect(card).toHaveClass('bg-surface-alt');
    expect(card).toHaveClass('text-on-primary');
  });

  it('respects padding options', () => {
    render(
      <Card padding="lg" data-testid="card-lg">
        Large Padding
      </Card>
    );
    const card = screen.getByTestId('card-lg');
    expect(card).toHaveClass('p-8');
  });
});
