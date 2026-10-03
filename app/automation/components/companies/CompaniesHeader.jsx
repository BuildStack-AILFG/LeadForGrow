'use client';

import { Layers } from 'lucide-react';
import CrmPageHeader, { ToolbarButton } from '../crm/CrmPageHeader';

export default function CompaniesHeader({ onCreate, showGroup, onToggleGroup, ...props }) {
  return (
    <CrmPageHeader
      title="Companies"
      subtitle="Accounts and their revenue."
      searchPlaceholder="Search company, domain, industry"
      primaryLabel="Add company"
      totalLabel="companies"
      onPrimaryClick={onCreate}
      toolbarEnd={
        onToggleGroup ? (
          <ToolbarButton active={showGroup} onClick={onToggleGroup} icon={Layers}>
            Group
          </ToolbarButton>
        ) : null
      }
      {...props}
    />
  );
}
