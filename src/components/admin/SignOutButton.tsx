'use client';

import React, { useTransition } from 'react';
import { signOutAdmin } from '@/app/admin/actions';
import { dealershipCopy } from '@/content/copy/id';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAdmin();
    });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-hairline text-ink hover:bg-neutral-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors disabled:opacity-50"
      aria-label={dealershipCopy.adminAuth.signOutButton}
    >
      {isPending ? 'Keluar...' : dealershipCopy.adminAuth.signOutButton}
    </button>
  );
}
