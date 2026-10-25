import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import { dealershipCopy } from '@/content/copy/id';

vi.mock('@/app/admin/actions', () => ({
  signInAdmin: vi.fn(),
  signOutAdmin: vi.fn(),
}));

describe('LoginForm component', () => {
  it('renders login title, subtitle, and input fields in natural Bahasa Indonesia', () => {
    render(<LoginForm />);

    expect(screen.getByText(dealershipCopy.adminAuth.title)).toBeInTheDocument();
    expect(screen.getByText(dealershipCopy.adminAuth.subtitle)).toBeInTheDocument();

    const emailInput = screen.getByLabelText(dealershipCopy.adminAuth.emailLabel);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    const passwordInput = screen.getByLabelText(dealershipCopy.adminAuth.passwordLabel);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');

    expect(
      screen.getByRole('button', { name: dealershipCopy.adminAuth.submitButton })
    ).toBeInTheDocument();
  });

  it('renders link to return to the public home page', () => {
    render(<LoginForm />);
    const homeLink = screen.getByRole('link', {
      name: new RegExp(dealershipCopy.common.backToHome),
    });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
