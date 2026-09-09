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
import DiscoveryLink from '../components/shared/tour/DiscoveryLink';

function LeadsWorkspaceContent() {
  const ws = useLeadsWorkspace();
  useAutoStartTour(TOURS.leads, !ws.loading);

  const handleSearch = useCallback((value) => ws.setSearchInput(value), [ws]);

  if (ws.loading) return <LeadsSkeleton />;

  return (
    <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950">
      <div className="px-4 sm:px-6 pb-8">
        <LeadsHeader
          search={ws.searchInput}
          onSearchChange={handleSearch}
          total={ws.pagination.total}
          refreshing={ws.refreshing}
          onRefresh={ws.refresh}
          viewMode={ws.viewMode}
          onViewModeChange={ws.setViewMode}
          onExport={ws.exportLeads}
        />

        <div className="mt-4">
          <DiscoveryLink
            text="Want to automatically follow up with new leads?"
            cta="Create Automation"
            href="/automation/automation-rules"
          />
        </div>

        <div className="mt-4 mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <CRMFilterBar
            filters={ws.filters}
            onFilterChange={ws.updateFilter}
            smartViews={SMART_VIEWS}
            savedViews={ws.savedViews}
            onSaveView={ws.saveCurrentView}
            onApplySavedView={ws.applySavedView}
            teamMembers={ws.teamMembers}
          />
        </div>

        <BulkActionsBar
          count={ws.selectedIds.length}
          teamMembers={ws.teamMembers}
          onAssign={ws.bulkAssign}
          onDelete={ws.bulkDelete}
          onExport={() => ws.exportLeads('excel')}
          onBulkRowColorChange={ws.bulkUpdateRowColor}
        />

        {ws.error && (
          <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{ws.error}</p>
            <button
              type="button"
              onClick={ws.refresh}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Retry
            </button>
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
              {ws.leads.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-12">No leads match your filters.</p>
              )}
            </div>
          </>
        ) : ws.leads.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No leads in your pipeline</p>
            <p className="text-sm text-slate-500 mt-1">Adjust filters or capture new leads to see them here.</p>
          </div>
        ) : (
          <>
          <CRMKanban
            leads={ws.leads}
            onStatusChange={ws.updateLeadStatus}
            onOpenDrawer={ws.setDrawerLeadId}
          />
          {ws.pagination.total > ws.leads.length && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Showing {ws.leads.length} of {ws.pagination.total} leads in pipeline view. Use filters to narrow results.
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
