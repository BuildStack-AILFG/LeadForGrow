'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { SECTION_META, SECTION_COLORS, SETTINGS_HUB_CARDS } from './constants';
import { CrmHubIcon } from './crm/CrmIcons';

export default function SettingsHeader({ section }) {
  const meta = SECTION_META[section] || SECTION_META.hub;
  const colors = SECTION_COLORS[meta.color] || SECTION_COLORS.blue;
  const hubCard = SETTINGS_HUB_CARDS.find((c) => c.id === section);
  const Icon = hubCard?.icon;
  const isCrm = section === 'crm';

  return (
    <header className="sticky top-0 z-20 bg-subtle/95 dark:bg-slate-950/95 border-b border-line/80 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pt-4 pb-1">
          <Link
            href="/automation/settings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-tertiary dark:text-fg-tertiary hover:text-accent-fg dark:hover:text-accent-fg transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Settings
          </Link>
        </div>

        <div className="flex items-center gap-3 pb-4 pt-2">
          {(Icon || isCrm) && (
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06] ${
                isCrm
                  ? 'bg-slate-900 text-white dark:bg-muted dark:text-fg'
                  : colors.icon
              }`}
            >
              {isCrm ? <CrmHubIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" strokeWidth={1.75} />}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-page font-semibold text-fg">{meta.title}</h1>
            <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5 truncate">{meta.description}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
