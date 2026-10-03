'use client';

import { useRouter } from 'next/navigation';
import { Plus, Download, Upload, ChevronDown, X } from 'lucide-react';
import PageHeader from '@/app/components/ui/PageHeader';
import Button from '@/app/components/ui/Button';
import DropdownMenu from '@/app/components/ui/DropdownMenu';
import cx, { focusRing } from '@/app/components/ui/cx';
import { useConfirm } from '@/app/components/ConfirmProvider';

/**
 * Leads page header (DESIGN_BRIEF §8): title + count, one primary action,
 * secondary Import/Export, and the smart/saved views as an underline tab bar.
 */
export default function LeadsHeader({ total, onExport, filters, smartViews, savedViews, onFilterChange, onApplySavedView, onDeleteView }) {
  const router = useRouter();
  const confirm = useConfirm();

  const deleteView = async (e, view) => {
    e.stopPropagation();
    if (!(await confirm({ title: 'Delete saved view', message: `Delete "${view.name}"?`, confirmLabel: 'Delete', danger: true }))) return;
    onDeleteView?.(view.id);
  };

  const tabCls = (selected) =>
    cx(
      '-mb-px inline-flex h-9 shrink-0 items-center gap-1 border-b-2 text-body transition-colors duration-[var(--duration-fast)]',
      selected ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-secondary hover:text-fg',
      focusRing
    );

  return (
    <PageHeader
      title="Leads"
      description={`${total.toLocaleString()} ${total === 1 ? 'lead' : 'leads'}`}
      actions={
        <>
          <Button icon={Upload} onClick={() => router.push('/automation/leads/bulk')} className="hidden sm:inline-flex">
            Import
          </Button>
          <DropdownMenu
            width={160}
            trigger={(p) => (
              <Button {...p} icon={Download} iconRight={ChevronDown}>
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            items={[
              { label: 'Excel (.xlsx)', onSelect: () => onExport('excel') },
              { label: 'PDF', onSelect: () => onExport('pdf') },
            ]}
          />
          <Button variant="primary" icon={Plus} onClick={() => router.push('/automation/leads/new')} data-tour="leads-add-btn">
            <span className="hidden sm:inline">Add lead</span>
          </Button>
        </>
      }
      tabs={
        <div role="tablist" aria-label="Lead views" className="flex items-center gap-5 overflow-x-auto [scrollbar-width:none]">
          {smartViews.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={filters.view === view.id}
              onClick={() => onFilterChange({ view: view.id, status: 'all' })}
              className={tabCls(filters.view === view.id)}
            >
              {view.label}
            </button>
          ))}
          {savedViews.map((view) => (
            <span key={view.id} className={cx(tabCls(false), 'gap-0.5')}>
              <button type="button" role="tab" aria-selected={false} onClick={() => onApplySavedView(view)} className="rounded-sm">
                {view.name}
              </button>
              <button
                type="button"
                onClick={(e) => deleteView(e, view)}
                aria-label={`Delete saved view ${view.name}`}
                className={cx('rounded-sm p-0.5 text-fg-tertiary hover:bg-muted hover:text-fg', focusRing)}
              >
                <X className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      }
    />
  );
}
