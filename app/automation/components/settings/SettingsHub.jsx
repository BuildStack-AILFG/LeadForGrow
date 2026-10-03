'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, Settings2 } from 'lucide-react';
import { SETTINGS_HUB_CARDS } from './constants';
import { CrmHubIcon } from './crm/CrmIcons';
import PageHeader from '@/app/components/ui/PageHeader';
import Input from '@/app/components/ui/Input';
import EmptyState from '@/app/components/ui/EmptyState';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Settings hub — a plain, searchable list of settings sections
 * (DESIGN_BRIEF §8: settings use a ~720px column; no colour-coded tiles).
 */
export default function SettingsHub() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SETTINGS_HUB_CARDS;
    return SETTINGS_HUB_CARDS.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="min-h-full bg-canvas">
      <PageHeader title="Settings" description="Workspace, team, channels and CRM configuration." />
      <div className="mx-auto max-w-3xl px-6 py-6">
        <Input
          type="search"
          icon={Search}
          aria-label="Search settings"
          placeholder="Search settings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fieldClassName="mb-4"
        />

        {filtered.length === 0 ? (
          <EmptyState compact icon={Settings2} title="No settings match your search." description="Try a shorter word, like “team” or “email”." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {filtered.map((card) => {
              const Icon = card.icon;
              return (
                <li key={card.id}>
                  <Link href={card.href} className={cx('group flex items-center gap-4 px-4 py-3 hover:bg-subtle', focusRing)}>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-fg-secondary">
                      {card.id === 'crm' ? <CrmHubIcon className="h-4 w-4" /> : <Icon className="h-4 w-4" strokeWidth={1.5} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-fg">{card.title}</span>
                      <span className="block truncate text-dense text-fg-secondary">{card.description}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-fg-tertiary group-hover:text-fg" strokeWidth={1.5} aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
