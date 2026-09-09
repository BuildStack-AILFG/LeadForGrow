'use client';

import { Suspense } from 'react';
import { Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCompaniesWorkspace } from '../hooks/useCompaniesWorkspace';
import CompaniesHeader from '../components/companies/CompaniesHeader';
import CompaniesKpiCards from '../components/companies/CompaniesKpiCards';
import CompaniesFilterBar from '../components/companies/CompaniesFilterBar';
import CompanyTable from '../components/companies/CompanyTable';
import CompaniesBulkBar from '../components/companies/CompaniesBulkBar';
import CompaniesPagination from '../components/companies/CompaniesPagination';
import CompanyCreateModal from '../components/companies/CompanyCreateModal';
import CompanyDrawer from '../components/companies/CompanyDrawer';
import CompaniesSkeleton from '../components/companies/CompaniesSkeleton';
import AutoPageIntro from '@/app/automation/components/shared/tour/AutoPageIntro';

function CompaniesEmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mb-5">
        <Building2 className="w-8 h-8 text-[#98A2B3]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[16px] font-semibold text-[#101828] mb-1">No companies yet</h3>
      <p className="text-[13px] text-[#667085] max-w-sm mb-6">
        Add your first company to organize contacts, deals, and revenue in one place.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#101828] hover:bg-[#1F2937] rounded-lg shadow-sm transition-colors"
      >
        Add First Company
      </button>
    </div>
  );
}

function CompaniesContent() {
  const ws = useCompaniesWorkspace();

  if (ws.loading && !ws.companies.length) return <CompaniesSkeleton />;

  const hasFilters = ws.filters.search || ws.filters.industry || ws.filters.status || ws.filters.ownerId;

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 pb-8 max-w-[1600px] mx-auto pt-6">
        <CompaniesHeader
          search={ws.searchInput}
          onSearchChange={ws.setSearchInput}
          total={ws.pagination.total}
          refreshing={ws.refreshing}
          onRefresh={() => ws.fetchCompanies(true)}
          onCreate={() => ws.setShowModal(true)}
          onExport={ws.exportCompanies}
          onImport={() => toast('Import coming soon')}
          showFilters={ws.showFilters}
          onToggleFilters={() => ws.setShowFilters((v) => !v)}
          showSort={ws.showSort}
          onToggleSort={() => ws.setShowSort((v) => !v)}
          showGroup={ws.showGroup}
          onToggleGroup={() => ws.setShowGroup((v) => !v)}
        />

        <AutoPageIntro />

        <CompaniesKpiCards stats={ws.stats} loading={ws.statsLoading} />

        <CompaniesFilterBar
          filters={ws.filters}
          onFilterChange={ws.updateFilter}
          teamMembers={ws.teamMembers}
          showFilters={ws.showFilters}
          showSort={ws.showSort}
          showGroup={ws.showGroup}
          groupBy={ws.groupBy}
          onGroupChange={ws.setGroupBy}
        />

        <CompaniesBulkBar
          count={ws.selectedIds.length}
          teamMembers={ws.teamMembers}
          onAssign={ws.bulkAssign}
          onDelete={ws.bulkDelete}
          onArchive={ws.bulkArchive}
          onExport={ws.exportCompanies}
          onAddTags={ws.bulkAddTags}
        />

        {ws.companies.length === 0 && !hasFilters ? (
          <CompaniesEmptyState onCreate={() => ws.setShowModal(true)} />
        ) : (
          <>
            <CompanyTable
              companies={ws.companies}
              selectedIds={ws.selectedIds}
              onToggleSelect={ws.toggleSelect}
              onToggleSelectAll={ws.toggleSelectAll}
              onOpen={ws.setDrawerId}
              onMenuAction={ws.handleMenuAction}
              sortField={ws.filters.sort}
              sortDir={ws.filters.dir}
              onSort={(field) => ws.updateFilter({
                sort: field,
                dir: ws.filters.sort === field && ws.filters.dir === 'desc' ? 'asc' : 'desc',
              })}
              groupBy={ws.groupBy}
            />
            <CompaniesPagination
              pagination={ws.pagination}
              onPageChange={(page) => ws.updateFilter({ page })}
              onLimitChange={(limit) => ws.updateFilter({ limit, page: 1 })}
            />
          </>
        )}
      </div>

      <CompanyCreateModal
        open={ws.showModal}
        form={ws.form}
        onChange={ws.setForm}
        onClose={() => ws.setShowModal(false)}
        onSubmit={ws.createCompany}
        saving={ws.saving}
        teamMembers={ws.teamMembers}
      />

      <CompanyDrawer
        companyId={ws.drawerId}
        onClose={() => ws.setDrawerId(null)}
        onUpdated={() => ws.fetchCompanies(true)}
      />
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<CompaniesSkeleton />}>
      <CompaniesContent />
    </Suspense>
  );
}
