'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { INBOX_PRIMARY_VIEWS, INBOX_MORE_VIEWS } from './constants';

const cap = (n) => (n > 99 ? '99+' : String(n));

// Queues that mean "someone is waiting on us" get an attention colour; the rest are plain numbers.
const ATTENTION = new Set(['needs_reply', 'unassigned']);

function CountBadge({ view, counts, active }) {
  const n = view.count ? counts?.[view.count] : undefined;
  if (!n) return null;
  const tone = active
    ? 'bg-white/25 text-white'
    : ATTENTION.has(view.id)
      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-200'
      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  return (
    <span data-count={view.id} className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-full text-[10px] font-semibold leading-none ${tone}`}>
      {cap(n)}
    </span>
  );
}

/**
 * The inbox's view tabs: a few queues with live counts, and everything else under "More" (so nothing hides behind a
 * sideways scroll). `filter` is the active view id, `counts` = /api/automation/inbox/counts.
 */
export default function InboxViewTabs({ filter, onChange, counts }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onDown = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const activeMore = INBOX_MORE_VIEWS.find((v) => v.id === filter);
  const pill = (active) => `inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded whitespace-nowrap transition-colors ${
    active
      ? 'bg-brand text-white'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
  }`;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {INBOX_PRIMARY_VIEWS.map((v) => (
        <button key={v.id} type="button" title={v.hint} aria-pressed={filter === v.id} onClick={() => onChange(v.id)} className={pill(filter === v.id)}>
          {v.label}
          <CountBadge view={v} counts={counts} active={filter === v.id} />
        </button>
      ))}

      <div ref={moreRef} className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={moreOpen}
          title="More views"
          onClick={() => setMoreOpen((o) => !o)}
          className={pill(Boolean(activeMore))}
        >
          {activeMore ? activeMore.label : 'More'}
          {activeMore && <CountBadge view={activeMore} counts={counts} active />}
          <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
        </button>
        {moreOpen && (
          <div role="menu" className="absolute left-0 top-full mt-1 z-30 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg p-1.5 space-y-0.5">
            {INBOX_MORE_VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="menuitem"
                title={v.hint}
                onClick={() => { onChange(v.id); setMoreOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded text-left ${
                  filter === v.id
                    ? 'bg-brand-tint dark:bg-slate-800 text-brand-ink font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-brand-tint dark:hover:bg-slate-800'
                }`}
              >
                <span>{v.label}</span>
                <CountBadge view={v} counts={counts} active={false} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
