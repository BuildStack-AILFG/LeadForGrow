'use client';

import { Suspense, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { resolveStages, isStageClosed, isStageLost, isStageWon, getStageLabel } from '@/lib/crm/pipelineUtils';
import { companyOrContact, ownerName } from '../components/deals/utils';
import { useDealsWorkspace } from '../hooks/useDealsWorkspace';
import DealsHeader from '../components/deals/DealsHeader';
import DealsKpiCards from '../components/deals/DealsKpiCards';
import DealsFilterBar from '../components/deals/DealsFilterBar';
import DealTable from '../components/deals/DealTable';
import DealsKanban from '../components/deals/DealsKanban';
import DealCreateModal from '../components/deals/DealCreateModal';
import DealDrawer from '../components/deals/DealDrawer';
import DealsSkeleton from '../components/deals/DealsSkeleton';
import DemoScheduledModal from '../components/leads/DemoScheduledModal';
import QuotationSentModal from '../components/leads/QuotationSentModal';
import LostReasonModal from '../components/leads/LostReasonModal';
import AutoPageIntro from '@/app/automation/components/shared/tour/AutoPageIntro';

function filterAndSortDeals(deals, filters, stages) {
  let list = [...(deals || [])];

  if (filters.status === 'open') {
    list = list.filter((d) => !isStageClosed(d.stage, stages));
  } else if (filters.status === 'won') {
    list = list.filter((d) => isStageWon(d.stage, stages));
  } else if (filters.status === 'lost') {
    list = list.filter((d) => isStageLost(d.stage, stages));
  }

  if (filters.stage) {
    list = list.filter((d) => d.stage === filters.stage);
  }

  if (filters.ownerId === 'unassigned') {
    list = list.filter((d) => !d.assignedTo);
  } else if (filters.ownerId) {
    list = list.filter((d) => {
      const id = d.assignedTo?._id || d.assignedTo;
      return String(id) === String(filters.ownerId);
    });
  }

  const q = (filters.search || '').trim().toLowerCase();
  if (q) {
    list = list.filter((d) => {
      const contact = companyOrContact(d);
      return (
        d.title?.toLowerCase().includes(q) ||
        contact.toLowerCase().includes(q) ||
        getStageLabel(stages, d.stage).toLowerCase().includes(q) ||
        ownerName(d.assignedTo).toLowerCase().includes(q)
      );
    });
  }

  const dir = filters.dir === 'asc' ? 1 : -1;
  const sort = filters.sort || 'updatedAt';
  list.sort((a, b) => {
    let av = a[sort];
    let bv = b[sort];
    if (sort === 'stage') {
      av = getStageLabel(stages, a.stage);
      bv = getStageLabel(stages, b.stage);
    }
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string') return av.localeCompare(bv) * dir;
    if (av instanceof Date || sort.includes('Date') || sort === 'updatedAt') {
      return (new Date(av) - new Date(bv)) * dir;
    }
    return (Number(av) - Number(bv)) * dir;
  });

  return { tableList: list, kanbanList: list };
}

function DealsContent() {
  const ws = useDealsWorkspace();
  const stages = useMemo(() => resolveStages(ws.stages), [ws.stages]);

  const { tableList, kanbanList } = useMemo(
    () => filterAndSortDeals(ws.deals, ws.filters, stages),
    [ws.deals, ws.filters, stages]
  );

  const kanbanDealsByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.key] = kanbanList.filter((d) => d.stage === stage.key);
      return acc;
    }, {});
  }, [kanbanList, stages]);

  const hasActiveFilters =
  Boolean(ws.filters.search || ws.filters.status !== 'all' || ws.filters.stage || ws.filters.ownerId);

  if (ws.loading && !ws.deals.length) return <DealsSkeleton />;

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 pb-8 max-w-[1600px] mx-auto pt-6">
        <DealsHeader
          search={ws.searchInput}
          onSearchChange={ws.setSearchInput}
          total={ws.deals.length}
          refreshing={ws.refreshing}
          onRefresh={() => { ws.fetchDeals(true); ws.fetchStats(); }}
          onCreate={ws.openCreateModal}
          onExport={ws.exportDeals}
          onImport={() => toast('Import coming soon')}
          showFilters={ws.showFilters}
          onToggleFilters={() => ws.setShowFilters((v) => !v)}
          showSort={ws.showSort}
          onToggleSort={() => ws.setShowSort((v) => !v)}
          viewMode={ws.viewMode}
          onViewModeChange={ws.setViewMode}
        />

        <AutoPageIntro />

        <DealsKpiCards stats={ws.stats} loading={ws.statsLoading} />

        <DealsFilterBar
          filters={ws.filters}
          onFilterChange={ws.updateFilter}
          stages={stages}
          teamMembers={ws.teamMembers}
          showFilters={ws.showFilters}
          showSort={ws.showSort}
          filteredCount={tableList.length}
          totalCount={ws.deals.length}
        />

        {ws.viewMode === 'kanban' ? (
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <DealsKanban
              stages={stages}
              deals={kanbanList}
              dealsByStage={kanbanDealsByStage}
              onStageChange={ws.updateDealStage}
              onOpenDeal={ws.setDrawerId}
            />
          </div>
        ) : (
          <DealTable
            deals={tableList}
            stages={stages}
            onOpen={ws.setDrawerId}
            onEdit={ws.openEditDeal}
            onDelete={ws.deleteDeal}
            onStageChange={ws.updateDealStage}
            onCreate={ws.openCreateModal}
            sortField={ws.filters.sort}
            sortDir={ws.filters.dir}
            onSort={(field) => ws.updateFilter({
              sort: field,
              dir: ws.filters.sort === field && ws.filters.dir === 'desc' ? 'asc' : 'desc',
            })}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </div>

      <DealCreateModal
        open={ws.showModal}
        editing={!!ws.editingDealId}
        form={ws.form}
        onChange={ws.setForm}
        onClose={ws.closeModal}
        onSubmit={ws.saveDeal}
        stages={stages}
        saving={ws.saving}
      />

      <DealDrawer
        dealId={ws.drawerId}
        stages={stages}
        onClose={() => ws.setDrawerId(null)}
        onUpdated={() => ws.fetchDeals(true)}
        onStageChange={ws.updateDealStage}
      />

      <DemoScheduledModal
        open={!!ws.demoPrompt}
        entityName={ws.demoPrompt?.dealName}
        saving={ws.demoSaving}
        onCancel={ws.cancelDemoPrompt}
        onConfirm={ws.confirmDemoScheduled}
      />

      <QuotationSentModal
        open={!!ws.quotationPrompt}
        entityName={ws.quotationPrompt?.dealName}
        dealId={ws.quotationPrompt?.dealId}
        saving={ws.quotationSaving}
        onCancel={ws.cancelQuotationPrompt}
        onConfirm={ws.confirmQuotationSent}
      />

      <LostReasonModal
        open={!!ws.lostPrompt}
        entityName={ws.lostPrompt?.dealName}
        saving={ws.lostSaving}
        onCancel={ws.cancelLostPrompt}
        onConfirm={ws.confirmLostReason}
      />
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsSkeleton />}>
      <DealsContent />
    </Suspense>
  );
}
