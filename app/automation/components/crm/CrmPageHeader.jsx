'use client';

import { Search, RefreshCw, Plus, Filter, ArrowUpDown, Upload, Download } from 'lucide-react';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';

/**
 * Shared header for Deals / Contacts / Companies (DESIGN_BRIEF §8):
 *   row 1 — title (20/600) + one-line description · Import/Export secondary · ONE primary
 *   row 2 — toolbar: view switcher, Filter, Sort … search + refresh on the right
 * No card wrapper: grouped by a hairline divider, not a tinted box.
 */
function ToolbarButton({ active, onClick, icon, children, className }) {
  return (
    <Button size="sm" icon={icon} onClick={onClick} aria-pressed={active ?? undefined} className={[active && 'border-line-strong bg-subtle', className].filter(Boolean).join(' ')}>
      {children}
    </Button>
  );
}

export default function CrmPageHeader({
  title,
  subtitle,
  total,
  totalLabel = 'total',
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  primaryLabel,
  onPrimaryClick,
  showFilters,
  onToggleFilters,
  showSort,
  onToggleSort,
  onImport,
  onExport,
  refreshing,
  onRefresh,
  toolbarStart,
  toolbarEnd,
}) {
  const countText = total > 0 ? `${total.toLocaleString()} ${totalLabel}` : null;

  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-4">
        <div className="min-w-0">
          <h1 className="text-page font-semibold text-fg">{title}</h1>
          {(subtitle || countText) && <p className="mt-0.5 text-body text-fg-secondary">{countText || subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onImport && (
            <Button icon={Upload} onClick={onImport} className="hidden sm:inline-flex">
              Import
            </Button>
          )}
          {onExport && (
            <Button icon={Download} onClick={onExport} className="hidden sm:inline-flex">
              Export
            </Button>
          )}
          {primaryLabel && onPrimaryClick && (
            <Button variant="primary" icon={Plus} onClick={onPrimaryClick}>
              {primaryLabel}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-y border-line py-2">
        {toolbarStart}
        {onToggleFilters && (
          <ToolbarButton active={showFilters} onClick={onToggleFilters} icon={Filter}>
            Filter
          </ToolbarButton>
        )}
        {onToggleSort && (
          <ToolbarButton active={showSort} onClick={onToggleSort} icon={ArrowUpDown}>
            Sort
          </ToolbarButton>
        )}
        {toolbarEnd}
        <div className="ml-auto flex items-center gap-2">
          <div className="w-56 lg:w-72">
            <Input
              type="search"
              icon={Search}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8"
            />
          </div>
          {onRefresh && <Button variant="ghost" icon={RefreshCw} aria-label="Refresh" onClick={onRefresh} loading={refreshing} />}
        </div>
      </div>
    </header>
  );
}

export { ToolbarButton };
