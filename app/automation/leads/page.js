'use client';

import { Suspense, useCallback } from 'react';
import { SMART_VIEWS } from '../components/leads/constants';
import { useLeadsWorkspace } from '../hooks/useLeadsWorkspace';
import LeadsHeader from '../components/leads/LeadsHeader';
import CRMFilterBar from '../components/leads/CRMFilterBar';
import BulkActionsBar from '../components/leads/BulkActionsBar';
import LeadTable from '../components/leads/LeadTable';
import CRMKanban from '../components/leads/CRMKanban';
import LeadDrawer from '../components/leads/LeadDrawer';
import ConvertLeadDialog from '../components/leads/ConvertLeadDialog';
import QualifiedSummaryModal from '../components/leads/QualifiedSummaryModal';
import LostReasonModal from '../components/leads/LostReasonModal';
import DemoScheduledModal from '../components/leads/DemoScheduledModal';
import QuotationSentModal from '../components/leads/QuotationSentModal';
import LeadsPagination from '../components/leads/LeadsPagination';
import MobileLeadCard from '../components/leads/MobileLeadCard';
import LeadsSkeleton from '../components/leads/LeadsSkeleton';
import { useAutoStartTour } from '../components/shared/tour/useAutoStartTour';
import { TOURS } from '../components/shared/tour/registry';
import Button from '@/app/components/ui/Button';
import EmptyState from '@/app/components/ui/EmptyState';
import { Users, Plus } from 'lucide-react';
import Link from 'next/link';

function LeadsWorkspaceContent() {
  const ws = useLeadsWorkspace();
  useAutoStartTour(TOURS.leads, !ws.loading);

  const handleSearch = useCallback((value) => ws.setSearchInput(value), [ws]);

  if (ws.loading) return <LeadsSkeleton />;

  return (
    <div className="min-h-full bg-canvas">
      <div className="sticky top-0 z-30">
        <LeadsHeader
          total={ws.pagination.total}
          onExport={ws.exportLeads}
          filters={ws.filters}
          smartViews={SMART_VIEWS}
          savedViews={ws.savedViews}
          onFilterChange={ws.updateFilter}
          onApplySavedView={ws.applySavedView}
          onDeleteView={ws.deleteSavedView}
        />
        <CRMFilterBar
          filters={ws.filters}
          onFilterChange={ws.updateFilter}
          teamMembers={ws.teamMembers}
          viewMode={ws.viewMode}
          onViewModeChange={ws.setViewMode}
          search={ws.searchInput}
          onSearchChange={handleSearch}
          refreshing={ws.refreshing}
          onRefresh={ws.refresh}
          onSaveView={ws.saveCurrentView}
        />
      </div>

      <div className="px-4 pb-8 pt-4 sm:px-6">
        <BulkActionsBar
          count={ws.selectedIds.length}
          teamMembers={ws.teamMembers}
          onAssign={ws.bulkAssign}
          onDelete={ws.bulkDelete}
          onExport={() => ws.exportLeads('excel')}
          onBulkRowColorChange={ws.bulkUpdateRowColor}
        />

        {ws.error && (
          <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3">
            <p className="text-body text-danger">{ws.error}</p>
            <Button size="sm" onClick={ws.refresh}>Try again</Button>
          </div>
        )}

        {ws.viewMode === 'table' ? (
          <>
            <div className="hidden lg:block">
              <LeadTable
                leads={ws.leads}
                selectedIds={ws.selectedIds}
                onToggleSelect={ws.toggleSelect}
                onToggleSelectAll={ws.toggleSelectAll}
                onOpenDrawer={ws.setDrawerLeadId}
                onConvert={ws.requestLeadConvert}
                teamMembers={ws.teamMembers}
                onAssign={ws.assignLead}
                onStatusChange={ws.updateLeadStatus}
                onCall={ws.initiateCall}
                onRowColorChange={ws.updateLeadRowColor}
                sortField={ws.sortField}
                sortDir={ws.sortDir}
                onSort={ws.toggleSort}
              />
            </div>
            <div className="lg:hidden space-y-3">
              {ws.leads.map((lead) => (
                <MobileLeadCard
                  key={lead._id}
                  lead={lead}
                  selected={ws.selectedIds.includes(lead._id)}
                  onSelect={ws.toggleSelect}
                  onOpen={ws.setDrawerLeadId}
                />
              ))}
              {ws.leads.length === 0 && <EmptyState compact icon={Users} title="No leads match your filters." description="Try a different view or clear a filter." />}
            </div>
          </>
        ) : ws.leads.length === 0 ? (
          <div className="rounded-lg border border-line">
            <EmptyState
              icon={Users}
              title="No leads on the board."
              description="Leads appear here as soon as they're captured or added."
              action={
                <Link href="/automation/leads/new">
                  <Button variant="primary" icon={Plus} tabIndex={-1}>Add lead</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <>
          <CRMKanban
            leads={ws.leads}
            onStatusChange={ws.updateLeadStatus}
            onOpenDrawer={ws.setDrawerLeadId}
          />
          {ws.pagination.total > ws.leads.length && (
            <p className="mt-3 text-meta text-fg-tertiary">
              Showing {ws.leads.length} of {ws.pagination.total} leads on the board. Use filters to narrow it down.
            </p>
          )}
          </>
        )}

        {ws.viewMode === 'table' && (
          <LeadsPagination
            pagination={ws.pagination}
            onPageChange={(page) => ws.updateFilter({ page })}
          />
        )}
      </div>

      <LeadDrawer
        leadId={ws.drawerLeadId}
        leadSnapshot={ws.leads.find((l) => l._id === ws.drawerLeadId)}
        onClose={() => ws.setDrawerLeadId(null)}
        onStatusChange={ws.updateLeadStatus}
        onAssign={ws.assignLead}
        teamMembers={ws.teamMembers}
        onCall={ws.initiateCall}
        onConvertLead={ws.convertLead}
      />

      <QualifiedSummaryModal
        open={!!ws.qualifiedPrompt}
        leadName={ws.qualifiedPrompt?.leadName}
        saving={ws.qualifying}
        onCancel={ws.cancelQualifiedPrompt}
        onConfirm={ws.confirmQualifiedAmount}
      />

      <LostReasonModal
        open={!!ws.lostPrompt}
        leadName={ws.lostPrompt?.leadName}
        variant={ws.lostPrompt?.status === 'unqualified' ? 'unqualified' : 'lost'}
        saving={ws.lostSaving}
        onCancel={ws.cancelLostPrompt}
        onConfirm={ws.confirmLostReason}
      />

      <DemoScheduledModal
        open={!!ws.demoPrompt}
        leadName={ws.demoPrompt?.leadName}
        saving={ws.demoSaving}
        onCancel={ws.cancelDemoPrompt}
        onConfirm={ws.confirmDemoScheduled}
      />

      <QuotationSentModal
        open={!!ws.quotationPrompt}
        leadName={ws.quotationPrompt?.leadName}
        saving={ws.quotationSaving}
        onCancel={ws.cancelQuotationPrompt}
        onConfirm={ws.confirmQuotationSent}
      />

      <ConvertLeadDialog
        open={!!ws.convertLeadId && !ws.drawerLeadId && !!ws.convertLeadMeta}
        lead={ws.convertLeadMeta}
        teamMembers={ws.teamMembers}
        saving={ws.converting}
        onClose={ws.cancelLeadConvert}
        onConfirm={(form) => ws.convertLead(form)}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsWorkspaceContent />
    </Suspense>
  );
}
