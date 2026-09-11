'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import { useAutomationRules } from '../hooks/useAutomationRules';
import AutomationHeader from '../components/automation/AutomationHeader';
import AutomationList from '../components/automation/AutomationList';
import AutomationSettingsPanel from '../components/automation/AutomationSettingsPanel';
import CreateAutomationModal from '../components/automation/CreateAutomationModal';
import AutomationSkeleton from '../components/automation/AutomationSkeleton';
import { useAutoStartTour } from '../components/shared/tour/useAutoStartTour';
import { TOURS } from '../components/shared/tour/registry';
import DiscoveryLink from '../components/shared/tour/DiscoveryLink';

function AutomationRulesContent() {
  const ws = useAutomationRules();
  const [mobilePanel, setMobilePanel] = useState(false);
  useAutoStartTour(TOURS.automationRules, !ws.loading);

  const handleSelect = (rule) => {
    ws.selectRule(rule);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobilePanel(true);
    }
  };

  if (ws.loading) return <AutomationSkeleton />;

  return (
    <div className="min-h-full bg-[#f8f9fc] dark:bg-slate-950">
      <div className="px-4 sm:px-6 pb-8">
        <AutomationHeader
          total={ws.allRules.length}
          activeCount={ws.activeCount}
          search={ws.search}
          onSearchChange={ws.setSearch}
          statusFilter={ws.statusFilter}
          onStatusFilterChange={ws.setStatusFilter}
          refreshing={ws.refreshing}
          onRefresh={ws.refresh}
          onCreate={() => ws.setShowCreateModal(true)}
        />

        <div className="mt-4 mb-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">CRM stage automations</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure welcome messages, meeting reminders, templates, and payment follow-ups per sales stage.
            </p>
          </div>
          <Link
            href="/automation/settings/crm"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5" />
            CRM automation settings
          </Link>
        </div>

        <div className="mt-4 mb-4 p-4 bg-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">💬 WhatsApp Interactive Flows</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated customer conversations - garage bookings, service selection, quotes, and more. Triggers on incoming WhatsApp messages.
            </p>
          </div>
          <Link
            href="/automation/whatsapp-flows"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Manage flows
          </Link>
        </div>

        <div className="mt-4">
          <DiscoveryLink text="Need inspiration?" cta="Browse templates" href="#" onClickOverride={() => ws.setShowCreateModal(true)} />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3" data-tour="automation-list">
            <AutomationList
              rules={ws.rules}
              selectedId={ws.selectedRule?._id}
              onSelect={handleSelect}
              onToggle={ws.toggleRule}
              isFirstRun={ws.allRules.length === 0}
              onCreate={() => ws.setShowCreateModal(true)}
            />
          </div>

          <div className="lg:col-span-2" data-tour="automation-settings-panel">
            <AutomationSettingsPanel
              rule={ws.selectedRule}
              form={ws.editForm}
              onFormChange={ws.setEditForm}
              templateRules={ws.templateRules}
              cloudinaryConfig={ws.cloudinaryConfig}
              onCloudinaryChange={ws.saveCloudinaryConfig}
              onUploadMedia={ws.uploadHeaderMedia}
              onSave={ws.saveEdit}
              saving={ws.saving}
            />
          </div>
        </div>
      </div>

      {mobilePanel && ws.selectedRule && (
        <AutomationSettingsPanel
          mobile
          rule={ws.selectedRule}
          form={ws.editForm}
          onFormChange={ws.setEditForm}
          templateRules={ws.templateRules}
          cloudinaryConfig={ws.cloudinaryConfig}
          onCloudinaryChange={ws.saveCloudinaryConfig}
          onUploadMedia={ws.uploadHeaderMedia}
          onSave={ws.saveEdit}
          saving={ws.saving}
          onClose={() => setMobilePanel(false)}
        />
      )}

      <CreateAutomationModal
        open={ws.showCreateModal}
        form={ws.createForm}
        onChange={ws.setCreateForm}
        onClose={() => ws.setShowCreateModal(false)}
        onSubmit={ws.createRule}
      />
    </div>
  );
}

export default function AutomationRulesPage() {
  return (
    <Suspense fallback={<AutomationSkeleton />}>
      <AutomationRulesContent />
    </Suspense>
  );
}
