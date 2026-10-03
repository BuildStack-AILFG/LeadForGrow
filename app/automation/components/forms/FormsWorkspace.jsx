'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, Loader2, Palette,
  Layers, BarChart3, Rocket, Monitor, Tablet, Smartphone, MoreHorizontal, Trash2, Copy
} from 'lucide-react';
import { useFormsWorkspace } from '../../hooks/useFormsWorkspace';
import PageLoader from '../PageLoader';
import FormsHomeView from './FormsHomeView';
import FormCreationWizard from './FormCreationWizard';
import FormBuilder from './FormBuilder';
import FormPreview from './FormPreview';
import FormSettingsPanel from './FormSettingsPanel';
import ThemeDrawer from './ThemeDrawer';
import PublishPanel from './PublishPanel';
import AnalyticsView from './AnalyticsView';
import { useConfirm } from '@/app/components/ConfirmProvider';

const TABS = [
  { id: 'builder', label: 'Builder', icon: Layers },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'publish', label: 'Publish', icon: Rocket },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function FormsWorkspace() {
  const ws = useFormsWorkspace();
  const confirm = useConfirm();
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [showMenu, setShowMenu] = useState(false);

  const updateField = (index, field) => {
    ws.setDraftFields((prev) => prev.map((f, i) => (i === index ? field : f)));
  };

  const selectedField = ws.selectedFieldIndex != null ? ws.draftFields[ws.selectedFieldIndex] : null;

  const confirmDelete = async () => {
    if (!ws.selectedForm) return;
    const form = ws.selectedForm;
    const msg = form.submissionCount > 0
      ? `Delete "${form.name}"? Past submissions will stay in your CRM. This cannot be undone.`
      : `Delete "${form.name}"? This cannot be undone.`;
    setShowMenu(false);
    if (await confirm({ title: 'Delete form', message: msg, confirmLabel: 'Delete', danger: true })) ws.deleteForm(form._id);
  };

  if (ws.loading) {
    return <PageLoader label="Loading forms…" />;
  }

  /* ── HOME ── */
  if (ws.workspaceMode === 'home') {
    return (
      <div className="min-h-full bg-canvas">
        <FormsHomeView
          forms={ws.forms}
          stats={ws.stats}
          maxForms={ws.maxForms}
          onCreate={ws.startWizard}
          onSelect={ws.openEditor}
          onDelete={ws.deleteForm}
        />
      </div>
    );
  }

  /* ── WIZARD ── */
  if (ws.workspaceMode === 'wizard') {
    return (
      <div className="min-h-full bg-canvas">
        <FormCreationWizard
          step={ws.wizardStep}
          draft={ws.wizardDraft}
          onChange={(patch) => ws.setWizardDraft((d) => ({ ...d, ...patch }))}
          onNext={() => {
            if (ws.wizardStep === 1) ws.setWizardStep(2);
            else ws.completeWizard();
          }}
          onBack={ws.wizardStep === 2 ? () => ws.setWizardStep(1) : undefined}
          onCancel={ws.backToHome}
        />
      </div>
    );
  }

  /* ── EDITOR ── */
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-0px)] bg-subtle dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex-shrink-0 bg-canvas/80 dark:bg-slate-900/80 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={ws.backToHome}
              className="p-2 -ml-2 text-fg-tertiary hover:text-fg dark:hover:text-slate-200 rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-fg dark:text-slate-50 truncate">
                {ws.draftMeta.name || ws.selectedForm?.name}
              </h1>
            </div>
          </div>

          {/* Tabs — desktop */}
          <nav className="hidden sm:flex items-center gap-0.5 p-0.5 bg-muted dark:bg-slate-800 rounded-lg">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = ws.view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => ws.setView(tab.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    active ? 'text-fg dark:text-slate-50' : 'text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="form-tab"
                      className="absolute inset-0 bg-canvas dark:bg-slate-900 rounded-lg"
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

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {ws.view === 'builder' && (
              <button
                type="button"
                onClick={() => ws.setShowThemeDrawer(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Palette className="w-3.5 h-3.5" /> Theme
              </button>
            )}
            <button
              type="button"
              onClick={() => ws.setView('preview')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              type="button"
              onClick={ws.saveForm}
              disabled={ws.saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-fg-secondary dark:text-slate-200 bg-muted dark:bg-slate-800 hover:bg-muted dark:hover:bg-slate-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {ws.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => ws.setView('publish')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-md shadow-popover transition-all"
            >
              Publish
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled rounded-lg hover:bg-muted dark:hover:bg-slate-800"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-canvas dark:bg-slate-900 rounded-lg shadow-popover border border-line dark:border-slate-800 py-1 z-50">
                    <button
                      type="button"
                      onClick={() => { ws.duplicateForm(ws.selectedForm); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate form
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger-subtle dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete form
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => ws.setView(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg ${
                ws.view === tab.id ? 'bg-accent text-white' : 'bg-muted dark:bg-slate-800 text-fg-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={ws.view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {ws.view === 'builder' && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
                  <div className="flex-1 min-w-0">
                    <FormBuilder
                      fields={ws.draftFields}
                      setFields={ws.setDraftFields}
                      selectedIndex={ws.selectedFieldIndex}
                      setSelectedIndex={ws.setSelectedFieldIndex}
                    />
                  </div>
                  <FormSettingsPanel
                    field={selectedField}
                    fieldIndex={ws.selectedFieldIndex}
                    onChange={updateField}
                  />
                </div>

                {/* Mobile field settings */}
                {selectedField && (
                  <div className="xl:hidden mt-6 bg-canvas dark:bg-slate-900 rounded-lg p-5">
                    <FormSettingsPanel
                      field={selectedField}
                      fieldIndex={ws.selectedFieldIndex}
                      onChange={updateField}
                      mobile
                    />
                  </div>
                )}
              </div>
            )}

            {ws.view === 'preview' && (
              <div className="flex flex-col items-center py-8 px-4">
                <div className="flex items-center gap-1 p-1 bg-canvas dark:bg-slate-900 rounded-lg mb-6">
                  {[
                    { id: 'desktop', icon: Monitor, label: 'Desktop' },
                    { id: 'tablet', icon: Tablet, label: 'Tablet' },
                    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPreviewDevice(id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                        previewDevice === id ? 'bg-accent text-white' : 'text-fg-tertiary hover:text-fg-secondary'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
                <motion.div
                  key={previewDevice}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <FormPreview
                    fields={ws.draftFields}
                    styling={ws.draftStyling}
                    meta={ws.draftMeta}
                    device={previewDevice}
                    immersive
                  />
                </motion.div>
              </div>
            )}

            {ws.view === 'publish' && ws.selectedForm && (
              <PublishPanel
                form={ws.selectedForm}
                styling={ws.draftStyling}
                onStylingChange={ws.setDraftStyling}
                onPublish={(active) => ws.togglePublish(active)}
                isPublished={ws.selectedForm.active !== false}
              />
            )}

            {ws.view === 'analytics' && (
              <AnalyticsView
                form={ws.selectedForm}
                submissions={ws.submissions}
                submissionsLoading={ws.submissionsLoading}
                stats={ws.stats}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ThemeDrawer
        open={ws.showThemeDrawer}
        styling={ws.draftStyling}
        onChange={ws.setDraftStyling}
        onClose={() => ws.setShowThemeDrawer(false)}
      />
    </div>
  );
}
