'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { isIntroSeen, markIntroSeen } from './storage';

const TONE = {
  blue:    { bg: 'from-teal-50 to-indigo-50 dark:from-teal-950/30 dark:to-indigo-950/20', border: 'border-line dark:border-teal-900/40', chip: 'bg-accent', link: 'text-accent-fg dark:text-accent-fg hover:text-accent-fg' },
  emerald: { bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20', border: 'border-line dark:border-emerald-900/40', chip: 'bg-accent', link: 'text-accent-fg dark:text-accent-fg hover:text-accent-fg' },
  violet:  { bg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20', border: 'border-line dark:border-violet-900/40', chip: 'bg-accent', link: 'text-accent-fg dark:text-accent-fg hover:text-accent-fg' },
  amber:   { bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20', border: 'border-warning/30 dark:border-amber-900/40', chip: 'bg-warning', link: 'text-warning dark:text-amber-400 hover:text-warning' },
  slate:   { bg: 'from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', border: 'border-line dark:border-slate-700', chip: 'bg-slate-700', link: 'text-fg-secondary dark:text-fg-disabled hover:text-fg' },
};

/**
 * PageIntro — a friendly, dismiss-once explanation card for pages that
 * don't need a full multi-step spotlight tour (spec: "Not every page
 * needs a long tour... some can have a 2-step introduction"). Shows once,
 * persists via localStorage, and always links into the matching Guide
 * article for anyone who wants the deep version later.
 *
 * Render it right under the page header. It renders nothing after the
 * user dismisses it (or after the auto-collapse timeout), and nothing on
 * server render / before the localStorage check resolves, so it never
 * causes a layout flash for returning users.
 */
export default function PageIntro({ id, icon: Icon, title, body, guideHref, tone = 'blue', ctaLabel = 'Learn how this works' }) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const t = TONE[tone] || TONE.blue;

  useEffect(() => {
    setChecked(true);
    setVisible(!isIntroSeen(id));
  }, [id]);

  if (!checked || !visible) return null;

  const dismiss = () => {
    markIntroSeen(id);
    setVisible(false);
  };

  return (
    <div
      className={`lfg-tour-pop relative mb-4 rounded-lg border ${t.border} bg-canvas ${t.bg} p-4 sm:p-5 flex items-start gap-3.5`}
      data-testid={`page-intro-${id}`}
    >
      {Icon && (
        <div className={`w-9 h-9 rounded-lg ${t.chip} flex items-center justify-center shrink-0`}>
          <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2} />
        </div>
      )}
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-sm font-semibold text-fg dark:text-slate-100">{title}</p>
        <p className="text-dense text-fg-secondary dark:text-fg-tertiary mt-0.5 leading-relaxed">{body}</p>
        {guideHref && (
          <Link href={guideHref} className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${t.link}`}>
            {ctaLabel} →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 p-1 rounded-lg text-fg-tertiary hover:text-fg-secondary hover:bg-canvas/60 dark:hover:bg-canvas/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
