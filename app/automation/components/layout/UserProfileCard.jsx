'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, LogOut, User, CreditCard, Settings } from 'lucide-react';

export default function UserProfileCard({
  displayName,
  email,
  role,
  plan,
  collapsed,
  onLogout
}) {
  const [open, setOpen] = useState(false);
  const initial = displayName?.charAt(0)?.toUpperCase() || 'U';
  const roleLabel = role?.toLowerCase() === 'owner' ? 'Owner' : 'Team member';

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onLogout}
        title={`${displayName} · Sign out`}
        className="mx-auto w-9 h-9 rounded-full bg-muted dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-fg-secondary dark:text-slate-200 hover:ring-2 hover:ring-focus transition-all"
      >
        {initial}
      </button>
    );
  }

  return (
    <div className="relative px-2 pb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-muted dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-fg-secondary dark:text-slate-200">
            {initial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full ring-2 ring-white dark:ring-slate-900" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-fg dark:text-slate-100 truncate">{displayName}</p>
          <p className="text-meta text-fg-tertiary dark:text-fg-tertiary truncate">{roleLabel}</p>
        </div>
        <ChevronUp className={`w-3.5 h-3.5 text-fg-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 bottom-full mb-1 z-20 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg shadow-popover py-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-line dark:border-slate-800">
              <p className="text-sm font-semibold text-fg dark:text-slate-100 truncate">{displayName}</p>
              <p className="text-meta text-fg-tertiary truncate">{email}</p>
              <span className="inline-block mt-1 text-meta text-fg-tertiary">{plan} · {roleLabel}</span>
            </div>
            <Link href="/user/home" className="flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              <User className="w-3.5 h-3.5" /> Profile
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              <CreditCard className="w-3.5 h-3.5" /> Billing
            </Link>
            <Link href="/automation/settings" className="flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger-subtle dark:hover:bg-red-950/30 border-t border-line dark:border-slate-800 mt-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
