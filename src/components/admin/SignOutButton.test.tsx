import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SignOutButton } from './SignOutButton';
import { dealershipCopy } from '@/content/copy/id';
import { signOutAdmin } from '@/app/admin/actions';

vi.mock('@/app/admin/actions', () => ({
  signOutAdmin: vi.fn(),
}));

describe('SignOutButton component', () => {
  it('renders button with natural Indonesian copy', () => {
    render(<SignOutButton />);
    const button = screen.getByRole('button', { name: dealershipCopy.adminAuth.signOutButton });
    expect(button).toBeInTheDocument();
  });

  it('triggers signOutAdmin server action on click', async () => {
    render(<SignOutButton />);
    const button = screen.getByRole('button', { name: dealershipCopy.adminAuth.signOutButton });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(signOutAdmin).toHaveBeenCalledTimes(1);
  });
});
