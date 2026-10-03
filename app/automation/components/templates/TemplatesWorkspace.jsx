'use client';

import PageLoader from '../PageLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '../../hooks/useTemplates';
import { TABS } from './constants';
import TemplatesHeader from './TemplatesHeader';
import TemplateStatsBar from './TemplateStatsBar';
import TemplateLibrary from './TemplateLibrary';
import TemplateEditorDrawer from './TemplateEditorDrawer';
import AutomatedFlowPanel from './AutomatedFlowPanel';
import VariablePanel from './VariablePanel';
import AutoPageIntro from '../shared/tour/AutoPageIntro';
import TemplateChannelTabs from './TemplateChannelTabs';
import Tabs from '@/app/components/ui/Tabs';

export default function TemplatesWorkspace() {
  const t = useTemplates();

  if (t.loading) {
    return <PageLoader label="Loading templates…" />;
  }

  return (
    <div className="min-h-full bg-canvas">
      <TemplateChannelTabs />
      <TemplatesHeader
        stats={t.stats}
        saving={t.saving}
        syncing={t.syncing}
        onSave={t.saveAll}
        onSync={t.syncMeta}
        onCreate={t.openCreate}
      />

      <div className="px-4 py-6 sm:px-6">
        <AutoPageIntro />

        <TemplateStatsBar stats={t.stats} />

        <Tabs
          className="mb-6"
          ariaLabel="Template sections"
          value={t.activeTab}
          onChange={t.setActiveTab}
          tabs={TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={t.activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {t.activeTab === 'library' && (
                  <TemplateLibrary
                    templates={t.filteredTemplates}
                    searchQuery={t.searchQuery}
                    onSearchChange={t.setSearchQuery}
                    onCreate={t.openCreate}
                    onEdit={t.openEdit}
                    onDelete={t.deleteTemplate}
                  />
                )}
                {t.activeTab === 'welcome' && (
                  <AutomatedFlowPanel
                    type="welcome"
                    template={t.welcomeTemplate}
                    onChange={t.setWelcomeTemplate}
                    onCopyVar={t.copyToken}
                  />
                )}
                {t.activeTab === 'followup' && (
                  <AutomatedFlowPanel
                    type="followup"
                    template={t.followUpTemplate}
                    onChange={t.setFollowUpTemplate}
                    onCopyVar={t.copyToken}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar — library tab only shows variable panel on desktop for auto tabs too */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            {t.activeTab === 'library' ? (
              <VariablePanel onCopy={t.copyToken} />
            ) : (
              <div className="bg-canvas dark:bg-slate-900 rounded p-5">
                <p className="text-sm font-semibold text-fg dark:text-slate-50 mb-2">Tip</p>
                <p className="text-xs text-fg-tertiary leading-relaxed">
                  {TABS.find((tab) => tab.id === t.activeTab)?.desc}. Click <strong>Save changes</strong> after editing.
                </p>
              </div>
            )}
            <div className="hidden lg:block bg-accent/5 dark:bg-teal-950/30 rounded p-5">
              <p className="text-xs font-semibold text-accent-fg dark:text-teal-200 mb-1">WhatsApp templates</p>
              <p className="text-xs text-accent-fg/70 dark:text-accent-fg/80 leading-relaxed">
                Sync from Meta to import approved business templates for outbound messaging.
              </p>
            </div>
          </div>
        </div>
      </div>

      <TemplateEditorDrawer
        open={t.editorOpen}
        template={t.editingTemplate}
        onClose={t.closeEditor}
        onSave={t.saveEditor}
        onCopyVar={t.copyToken}
        readOnly={t.editingTemplate?.isMetaTemplate}
      />
    </div>
  );
}
