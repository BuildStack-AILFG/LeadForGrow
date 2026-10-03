'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { SECTION_META, SETTINGS_HUB_CARDS } from './constants';
import { CrmHubIcon } from './crm/CrmIcons';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Settings sub-page header: "← Settings" back link + section title.
 * Pages that aren't one of the hub sections (e.g. AI settings, email,
 * WhatsApp) render their own title, so here they only get the back link —
 * avoids two page titles on one screen.
 */
export default function SettingsHeader({ section }) {
  const isSection = section !== 'hub' && !!SECTION_META[section];
  const meta = SECTION_META[section] || SECTION_META.hub;
  const hubCard = SETTINGS_HUB_CARDS.find((c) => c.id === section);
  const Icon = hubCard?.icon;
  const isCrm = section === 'crm';

  return (
    <header className={cx('sticky top-0 z-20 bg-canvas', isSection && 'border-b border-line')}>
      <div className="px-4 sm:px-6">
        <div className="pt-4">
          <Link href="/automation/settings" className={cx('inline-flex items-center gap-1 rounded-sm text-dense text-fg-tertiary hover:text-fg', focusRing)}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Settings
          </Link>
        </div>
        {isSection && (
          <div className="flex items-center gap-3 pb-4 pt-2">
            {(Icon || isCrm) && (
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-fg-secondary">
                {isCrm ? <CrmHubIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-page font-semibold text-fg">{meta.title}</h1>
              <p className="mt-0.5 truncate text-body text-fg-secondary">{meta.description}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
