'use client';

import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

/**
 * Cross-page "product discovery" nudge (spec section 29) — a small,
 * low-noise strip that connects one feature to another related one, e.g.
 * Leads → "Want to automatically follow up? Create Automation →".
 * Deliberately quiet (no glass, no color-block) so it reads as a helpful
 * aside, not an ad.
 */
export default function DiscoveryLink({ text, cta, href, onClickOverride }) {
  const Tag = onClickOverride ? 'button' : Link;
  const extraProps = onClickOverride
    ? { type: 'button', onClick: onClickOverride }
    : { href };

  return (
    <Tag
      {...extraProps}
      className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-dashed border-line dark:border-slate-700 hover:border-line dark:hover:border-teal-800 hover:bg-accent-subtle dark:hover:bg-teal-950/10 transition-colors text-left"
    >
      <span className="flex items-center gap-2 text-sm text-fg-secondary dark:text-fg-tertiary">
        <Compass className="w-4 h-4 text-fg-tertiary shrink-0" />
        {text}
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-fg dark:text-accent-fg shrink-0 group-hover:translate-x-0.5 transition-transform">
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Tag>
  );
}
