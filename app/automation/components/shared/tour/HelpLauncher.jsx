'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, Search, RotateCcw, MessageCircle, X, ExternalLink } from 'lucide-react';
import { useTour } from './TourProvider';
import { findTourForPath, findIntroForPath } from './registry';
import { resetTour, markIntroSeen, getIntrosSeen } from './storage';

/**
 * Persistent "Need help?" entry point (spec section 16). Deliberately kept
 * separate from the Grovia assistant FAB — sits directly above it with a
 * clear gap so the two never visually compete or overlap.
 */
export default function HelpLauncher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const { restart } = useTour();
  const panelRef = useRef(null);

  const pageTour = findTourForPath(pathname);
  const pageIntro = findIntroForPath(pathname);
  const hasPageHelp = Boolean(pageTour || pageIntro);

  useEffect(() => {
    if (!open) return;
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(query.trim() ? `/help?q=${encodeURIComponent(query.trim())}` : '/help');
    setOpen(false);
  };

  const handleRestart = () => {
    setOpen(false);
    if (pageTour) {
      resetTour(pageTour.id);
      restart(pageTour);
    } else if (pageIntro) {
      const seen = getIntrosSeen();
      delete seen[pageIntro.id];
      // storage helper only exposes markIntroSeen; direct write mirrors it
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lfg_intro_seen_v1', JSON.stringify(seen));
      }
      window.location.reload();
    }
  };

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="lfg-tour-pop glass-panel fixed z-[9996] bottom-[172px] right-6 w-72 rounded-2xl p-4 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" /> Need help?
            </p>
            <button type="button" onClick={() => setOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the Guide…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </form>

          <div className="space-y-1">
            {hasPageHelp && (
              <button
                type="button"
                onClick={handleRestart}
                className="w-full flex items-center gap-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-2 rounded-xl transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-indigo-500 shrink-0" />
                Restart tour for this page
              </button>
            )}
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-2 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-blue-500 shrink-0" />
              Browse all guides
            </Link>
            <a
              href="https://wa.me/916366966120"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-2 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              Contact support
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open help"
        aria-expanded={open}
        className="fixed z-[9995] bottom-[104px] right-6 w-11 h-11 rounded-full glass-dark text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
        title="Need help?"
      >
        <Compass className="w-[18px] h-[18px]" />
      </button>
    </>
  );
}
