'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { SETTINGS_GROUPS, isSettingsNavActive, searchSettings } from './constants';
import WorkspaceSwitcher from './WorkspaceSwitcher';

export default function SettingsSidebar({ mobileOpen, onMobileClose }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch] = useState('');

  const results = useMemo(() => searchSettings(search), [search]);

  const toggleGroup = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search settings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {search ? (
          results.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-4">No settings found</p>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              const active = isSettingsNavActive(pathname, item);
              const href = item.tab ? `${item.href}?tab=${item.tab}` : item.href;
              return (
                <Link
                  key={`${item.id}-${item.tab || ''}`}
                  href={href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    active ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{item.group}</span>
                </Link>
              );
            })
          )
        ) : (
          SETTINGS_GROUPS.map((group) => {
            const isOpen = collapsed[group.id] !== true;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  {group.label}
                </button>
                {isOpen && (
                  <div className="space-y-0.5 mb-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isSettingsNavActive(pathname, item) && (!item.tab || tab === item.tab);
                      const href = item.tab ? `${item.href}?tab=${item.tab}` : item.href;
                      return (
                        <Link
                          key={`${item.id}-${item.tab || ''}`}
                          href={href}
                          onClick={onMobileClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                            active
                              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 font-medium border-l-2 border-teal-600 -ml-px pl-[11px]'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <WorkspaceSwitcher />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 border-r border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
