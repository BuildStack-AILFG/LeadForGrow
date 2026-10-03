'use client';

import { Columns3, LayoutList } from 'lucide-react';
import CrmPageHeader from '../crm/CrmPageHeader';
import SegmentedControl from '@/app/components/ui/SegmentedControl';

export default function DealsHeader({ viewMode, onViewModeChange, onCreate, ...props }) {
  return (
    <CrmPageHeader
      title="Deals"
      subtitle="Pipeline, revenue and closed deals."
      searchPlaceholder="Search deals, companies, contacts"
      primaryLabel="New deal"
      totalLabel="deals"
      onPrimaryClick={onCreate}
      toolbarStart={
        onViewModeChange && (
          <>
            <SegmentedControl
              ariaLabel="Layout"
              value={viewMode === 'kanban' ? 'kanban' : 'table'}
              onChange={onViewModeChange}
              options={[
                { value: 'table', label: 'List', icon: LayoutList },
                { value: 'kanban', label: 'Board', icon: Columns3 },
              ]}
            />
            <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          </>
        )
      }
      {...props}
    />
  );
}
