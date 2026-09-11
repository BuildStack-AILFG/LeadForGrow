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

export default function TemplatesWorkspace() {
  const t = useTemplates();

  if (t.loading) {
    return <PageLoader label="Loading templates…" />;
  }

  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950">
      <TemplatesHeader
        stats={t.stats}
        saving={t.saving}
        syncing={t.syncing}
        onSave={t.saveAll}
        onSync={t.syncMeta}
        onCreate={t.openCreate}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <AutoPageIntro />

        <TemplateStatsBar stats={t.stats} />

        {/* Tabs */}
        <nav className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm w-fit mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = t.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => t.setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                  active ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="template-tab"
                    className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

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
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Tip</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {TABS.find((tab) => tab.id === t.activeTab)?.desc}. Click <strong>Save changes</strong> after editing.
                </p>
              </div>
            )}
            <div className="hidden lg:block bg-teal-50 dark:bg-teal-950/30 rounded-2xl p-5">
              <p className="text-xs font-semibold text-teal-800 dark:text-teal-200 mb-1">WhatsApp templates</p>
              <p className="text-xs text-teal-700/80 dark:text-teal-300/80 leading-relaxed">
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
