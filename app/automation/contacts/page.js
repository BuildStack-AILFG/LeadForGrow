'use client';

import { Suspense } from 'react';
import { UserCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useContactsWorkspace } from '../hooks/useContactsWorkspace';
import ContactsHeader from '../components/contacts/ContactsHeader';
import ContactsKpiCards from '../components/contacts/ContactsKpiCards';
import ContactsFilterBar from '../components/contacts/ContactsFilterBar';
import ContactTable from '../components/contacts/ContactTable';
import ContactsBulkBar from '../components/contacts/ContactsBulkBar';
import ContactsPagination from '../components/contacts/ContactsPagination';
import ContactCreateModal from '../components/contacts/ContactCreateModal';
import ContactDrawer from '../components/contacts/ContactDrawer';
import ContactsSkeleton from '../components/contacts/ContactsSkeleton';
import AutoPageIntro from '@/app/automation/components/shared/tour/AutoPageIntro';

function ContactsEmptyState({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center mb-5">
        <UserCircle className="w-8 h-8 text-[#98A2B3]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[16px] font-semibold text-[#101828] mb-1">No contacts yet</h3>
      <p className="text-[13px] text-[#667085] max-w-sm mb-6">
        Add your first contact to track relationships, deals, and activity in one place.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="px-5 py-2.5 text-[13px] font-semibold text-white bg-[#101828] hover:bg-[#1F2937] rounded-lg shadow-sm transition-colors"
      >
        Add First Contact
      </button>
    </div>
  );
}

function ContactsContent() {
  const ws = useContactsWorkspace();

  if (ws.loading && !ws.contacts.length) return <ContactsSkeleton />;

  const hasFilters = ws.filters.search || ws.filters.type || ws.filters.ownerId || ws.filters.hasOpenDeals;

  return (
    <div className="min-h-full bg-white">
      <div className="px-4 sm:px-6 pb-8 max-w-[1600px] mx-auto pt-6">
        <ContactsHeader
          search={ws.searchInput}
          onSearchChange={ws.setSearchInput}
          total={ws.pagination.total}
          refreshing={ws.refreshing}
          onRefresh={() => { ws.fetchContacts(true); }}
          onCreate={() => ws.setShowModal(true)}
          onExport={ws.exportContacts}
          onImport={() => toast('Import coming soon')}
          showFilters={ws.showFilters}
          onToggleFilters={() => ws.setShowFilters((v) => !v)}
          showSort={ws.showSort}
          onToggleSort={() => ws.setShowSort((v) => !v)}
        />

        <AutoPageIntro />

        <ContactsKpiCards stats={ws.stats} loading={ws.statsLoading} />

        <ContactsFilterBar
          filters={ws.filters}
          onFilterChange={ws.updateFilter}
          teamMembers={ws.teamMembers}
          showFilters={ws.showFilters}
          showSort={ws.showSort}
        />

        <ContactsBulkBar
          count={ws.selectedIds.length}
          onAssign={ws.bulkAssign}
          onDelete={ws.bulkDelete}
          onArchive={ws.bulkArchive}
          onExport={ws.exportContacts}
          onAddTags={ws.bulkAddTags}
        />

        {ws.contacts.length === 0 && !hasFilters ? (
          <ContactsEmptyState onCreate={() => ws.setShowModal(true)} />
        ) : (
          <>
            <ContactTable
              contacts={ws.contacts}
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
            />
            <ContactsPagination
              pagination={ws.pagination}
              onPageChange={(page) => ws.updateFilter({ page })}
              onLimitChange={(limit) => ws.updateFilter({ limit, page: 1 })}
            />
          </>
        )}
      </div>

      <ContactCreateModal
        open={ws.showModal}
        form={ws.form}
        onChange={ws.setForm}
        onClose={() => ws.setShowModal(false)}
        onSubmit={ws.createContact}
        saving={ws.saving}
        teamMembers={ws.teamMembers}
      />

      <ContactDrawer
        contactId={ws.drawerId}
        onClose={() => ws.setDrawerId(null)}
        onUpdated={() => ws.fetchContacts(true)}
      />
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<ContactsSkeleton />}>
      <ContactsContent />
    </Suspense>
  );
}
