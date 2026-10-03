'use client';

import { useState } from 'react';
import { BookmarkPlus, CalendarRange, Columns3, LayoutList, RefreshCw, Search } from 'lucide-react';
import { SOURCE_OPTIONS, PIPELINE_STAGES } from './constants';
import { mapTeamMemberOptions } from './utils';
import Toolbar from '@/app/components/ui/Toolbar';
import SegmentedControl from '@/app/components/ui/SegmentedControl';
import Select from '@/app/components/ui/Select';
import Checkbox from '@/app/components/ui/Checkbox';
import Button from '@/app/components/ui/Button';
import Popover from '@/app/components/ui/Popover';
import Input from '@/app/components/ui/Input';

/**
 * Leads toolbar (DESIGN_BRIEF §8): view switcher + filters on the left,
 * search / refresh / save view on the right. Smart views live in the page
 * header tabs (LeadsHeader). Filtering behaviour is unchanged.
 */
export default function CRMFilterBar({
  filters,
  onFilterChange,
  teamMembers,
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  refreshing,
  onRefresh,
  onSaveView,
}) {
  const [saveName, setSaveName] = useState('');
  const hasDates = !!(filters.dateFrom || filters.dateTo);

  return (
    <Toolbar
      left={
        <>
          <span data-tour="leads-pipeline-toggle">
            <SegmentedControl
              ariaLabel="Layout"
              value={viewMode === 'kanban' ? 'kanban' : 'table'}
              onChange={onViewModeChange}
              options={[
                { value: 'table', label: 'List', icon: LayoutList },
                { value: 'kanban', label: 'Board', icon: Columns3 },
              ]}
            />
          </span>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <Select size="sm" aria-label="Status" value={filters.status} onChange={(e) => onFilterChange({ status: e.target.value, view: 'all' })} className="w-auto">
            <option value="all">All statuses</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
            <option value="converted">Converted</option>
          </Select>
          <Select size="sm" aria-label="Source" value={filters.source} onChange={(e) => onFilterChange({ source: e.target.value })} className="w-auto">
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select size="sm" aria-label="Owner" value={filters.assignedTo} onChange={(e) => onFilterChange({ assignedTo: e.target.value, view: 'all' })} className="w-auto">
            <option value="">All owners</option>
            <option value="me">My leads</option>
            <option value="unassigned">Unassigned</option>
            {mapTeamMemberOptions(teamMembers).map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
          <Popover
            width={280}
            trigger={(p) => (
              <Button {...p} size="sm" icon={CalendarRange} className={hasDates ? 'border-accent text-accent-fg' : undefined}>
                {hasDates ? `${filters.dateFrom || '…'} – ${filters.dateTo || '…'}` : 'Date range'}
              </Button>
            )}
          >
            {({ close }) => (
              <div className="flex flex-col gap-3 p-3">
                <Input type="date" label="From" value={filters.dateFrom} onChange={(e) => onFilterChange({ dateFrom: e.target.value })} />
                <Input type="date" label="To" value={filters.dateTo} onChange={(e) => onFilterChange({ dateTo: e.target.value })} />
                <div className="flex justify-between">
                  <Button size="sm" variant="ghost" disabled={!hasDates} onClick={() => onFilterChange({ dateFrom: '', dateTo: '' })}>
                    Clear dates
                  </Button>
                  <Button size="sm" onClick={close}>Done</Button>
                </div>
              </div>
            )}
          </Popover>
          <Checkbox
            label={<span className="text-dense text-fg-secondary">Show converted</span>}
            checked={!!filters.showConverted}
            onChange={(e) => onFilterChange({ showConverted: e.target.checked, view: 'all' })}
          />
        </>
      }
      right={
        <>
          <div className="w-56 lg:w-72" data-tour="leads-search">
            <Input
              type="search"
              icon={Search}
              aria-label="Search leads"
              placeholder="Search name, phone, email"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearchChange(search)}
              className="h-8"
            />
          </div>
          <Button variant="ghost" icon={RefreshCw} aria-label="Refresh" onClick={onRefresh} loading={refreshing} />
          <Popover
            align="end"
            width={260}
            trigger={(p) => <Button {...p} variant="ghost" icon={BookmarkPlus} aria-label="Save current filters as a view" title="Save view" />}
          >
            {({ close }) => (
              <form
                className="flex flex-col gap-3 p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!saveName.trim()) return;
                  onSaveView(saveName.trim());
                  setSaveName('');
                  close();
                }}
              >
                <Input label="Save current filters as" placeholder="e.g. Hot leads this week" value={saveName} onChange={(e) => setSaveName(e.target.value)} autoFocus />
                <Button type="submit" variant="primary" size="sm" disabled={!saveName.trim()} className="self-end">
                  Save view
                </Button>
              </form>
            )}
          </Popover>
        </>
      }
    />
  );
}
