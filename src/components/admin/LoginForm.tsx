'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { signInAdmin } from '@/app/admin/actions';
import { dealershipCopy } from '@/content/copy/id';
import { Button } from '@/components/ui/Button';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAdmin, { error: null });

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-surface rounded-xl border border-hairline shadow-sm">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 rounded-full mb-3">
          {dealershipCopy.dealer.officialBadge}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-heading">
          {dealershipCopy.adminAuth.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{dealershipCopy.adminAuth.subtitle}</p>
      </div>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start space-x-2"
        >
          <svg
            className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
            {dealershipCopy.adminAuth.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder={dealershipCopy.adminAuth.emailPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-canvas text-ink placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
            {dealershipCopy.adminAuth.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            placeholder={dealershipCopy.adminAuth.passwordPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-lg border border-hairline bg-canvas text-ink placeholder:text-muted/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" fullWidth disabled={isPending} className="py-3">
            {isPending
              ? dealershipCopy.adminAuth.submittingButton
              : dealershipCopy.adminAuth.submitButton}
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-hairline text-center">
        <Link
          href="/"
          className="text-xs text-muted hover:text-ink transition-colors inline-flex items-center space-x-1"
        >
          <span>&larr;</span>
          <span>{dealershipCopy.common.backToHome}</span>
        </Link>
      </div>
    </div>
  );
}
