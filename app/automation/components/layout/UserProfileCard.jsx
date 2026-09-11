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
        className="mx-auto w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200 hover:ring-2 hover:ring-teal-500/30 transition-all"
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
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-200">
            {initial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{roleLabel}</p>
        </div>
        <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-2 right-2 bottom-full mb-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-500 truncate">{email}</p>
              <span className="inline-block mt-1 text-[10px] text-slate-400">{plan} · {roleLabel}</span>
            </div>
            <Link href="/user/home" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              <User className="w-3.5 h-3.5" /> Profile
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              <CreditCard className="w-3.5 h-3.5" /> Billing
            </Link>
            <Link href="/automation/settings" className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setOpen(false)}>
              <Settings className="w-3.5 h-3.5" /> Settings
            </Link>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-slate-100 dark:border-slate-800 mt-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
