'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Settings, ChevronRight, Search, Plug, Users } from 'lucide-react';
import { SETTINGS_HUB_CARDS, SECTION_COLORS } from './constants';
import { CrmHubIcon } from './crm/CrmIcons';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

export default function SettingsHub() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SETTINGS_HUB_CARDS;
    return SETTINGS_HUB_CARDS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="min-h-full bg-subtle dark:bg-slate-950 relative overflow-hidden">
      {/* Soft top gradient wash */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-canvas" />

      <div className="relative px-4 sm:px-6 pb-10 max-w-5xl mx-auto">
        <header className="pt-6 pb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-canvas border border-line dark:bg-teal-950/50 text-fg-secondary dark:text-accent-fg flex items-center justify-center">
              <Settings className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-fg dark:text-slate-50">Settings</h1>
              <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">Administration center for your CRM workspace</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Sections', value: String(SETTINGS_HUB_CARDS.length), icon: Settings, accent: 'text-accent-fg bg-accent-subtle dark:bg-teal-950/40' },
              { label: 'Integrations', value: '25+ apps', icon: Plug, accent: 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/40' },
              { label: 'Team', value: 'Roles & access', icon: Users, accent: 'text-accent-fg bg-accent-subtle dark:bg-violet-950/40' }
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-canvas/80 dark:bg-slate-900/80 border border-line/80 dark:border-slate-800 rounded-lg px-4 py-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${s.accent}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-meta font-medium text-fg-tertiary">{s.label}</p>
                  <p className="text-sm font-semibold text-fg dark:text-slate-50">{s.value}</p>
                </div>
              );
            })}
          </div>

          <div className="relative mt-5 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
            <input
              type="text"
              placeholder="Search settings sections…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas/90 dark:bg-slate-900/90 focus:outline-none focus:ring-2 focus:ring-focus focus:border-teal-400"
            />
          </div>
        </header>

        <AutoPageIntro />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((card) => {
            const Icon = card.icon;
            const colors = SECTION_COLORS[card.color];
            return (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative bg-canvas dark:bg-slate-900 border border-line/90 dark:border-slate-800 rounded-lg p-5 hover:shadow-popover transition-all overflow-hidden ${colors.ring} ${colors.glow}`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${colors.bar} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06] ${
                      card.id === 'crm'
                        ? 'bg-slate-900 text-white dark:bg-muted dark:text-fg'
                        : colors.icon
                    }`}
                  >
                    {card.id === 'crm' ? (
                      <CrmHubIcon className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-fg-disabled group-hover:text-accent-fg group-hover:translate-x-0.5 transition-all mt-1" />
                </div>

                <h2 className="text-sm font-semibold text-fg dark:text-slate-50 mt-4">{card.title}</h2>
                <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-1 leading-relaxed line-clamp-2">{card.description}</p>

                <p className="text-meta font-medium text-fg-tertiary mt-3">{card.count} settings</p>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-fg-tertiary py-12">No sections match your search</p>
        )}
      </div>
    </div>
  );
}
