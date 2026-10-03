'use client';

import Link from 'next/link';
import { Search, Plus, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { FILTER_OPTIONS } from './constants';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import DropdownMenu from '@/app/components/ui/DropdownMenu';

/** Automations list header — standard list-page pattern (DESIGN_BRIEF §8). */
export default function AutomationHeader({ total, activeCount, search, onSearchChange, statusFilter, onStatusFilterChange, refreshing, onRefresh, onCreate }) {
  const activeFilter = FILTER_OPTIONS.find((f) => f.id === statusFilter);

  return (
    <header className="sticky top-0 z-30 -mx-4 border-b border-line bg-canvas px-4 sm:-mx-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 py-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-fg">Automations</h1>
          <p className="mt-0.5 text-body text-fg-secondary">
            {total} {total === 1 ? 'automation' : 'automations'} · {activeCount} active ·{' '}
            <span className="inline-flex items-center gap-1 text-fg-tertiary">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" /> Engine running
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/help/automation-rules" className="hidden text-dense text-accent-fg hover:underline sm:inline">
            How automations work
          </Link>
          <Button variant="primary" icon={Plus} onClick={onCreate} data-tour="automation-create-btn">
            New automation
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line py-2">
        <DropdownMenu
          width={192}
          align="start"
          trigger={(p) => (
            <Button {...p} size="sm" iconRight={ChevronDown}>
              {activeFilter?.label || 'All'}
            </Button>
          )}
          items={FILTER_OPTIONS.map((f) => ({ label: f.label, icon: statusFilter === f.id ? Check : undefined, onSelect: () => onStatusFilterChange(f.id) }))}
        />
        <div className="ml-auto flex items-center gap-2">
          <div className="w-56 lg:w-72">
            <Input type="search" icon={Search} aria-label="Search automations" placeholder="Search automations" value={search} onChange={(e) => onSearchChange(e.target.value)} className="h-8" />
          </div>
          <Button variant="ghost" icon={RefreshCw} aria-label="Refresh" onClick={onRefresh} loading={refreshing} />
        </div>
      </div>
    </header>
  );
}
