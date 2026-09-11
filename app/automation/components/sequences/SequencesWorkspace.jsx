'use client';

import { Loader2, ArrowLeft, Save, Play, Layers, BarChart3, Activity, FlaskConical, Copy, ClipboardPaste, Settings, ShieldCheck, ListChecks } from 'lucide-react';
import PageLoader from '../PageLoader';
import { useSequencesWorkspace } from '../../hooks/useSequencesWorkspace';
import SequencesHomeView from './SequencesHomeView';
import SequenceCreationWizard from './SequenceCreationWizard';
import NodeSidebar from './NodeSidebar';
import WorkflowCanvas from './WorkflowCanvas';
import NodeSettingsPanel from './NodeSettingsPanel';
import SequenceAnalytics from './SequenceAnalytics';
import ExecutionLogs from './ExecutionLogs';
import SequenceWorkflowSettings from './SequenceWorkflowSettings';
import ApprovalQueue from './ApprovalQueue';
import SimpleEditView from './SimpleEditView';
import ConfirmDialog from '../shared/ConfirmDialog';

// Simple edit is FIRST — most non-technical SMB customers want to edit 3
// messages, not build a graph. Advanced users can still switch to Builder.
const TABS = [
  { id: 'simple',    label: 'Simple edit',   icon: ListChecks },
  { id: 'builder',   label: 'Builder',       icon: Layers },
  { id: 'settings',  label: 'Trigger & A/B', icon: Settings },
  { id: 'analytics', label: 'Analytics',     icon: BarChart3 },
  { id: 'logs',      label: 'Execution logs',icon: Activity },
  { id: 'approvals', label: 'Approvals',     icon: ShieldCheck },
];

export default function SequencesWorkspace() {
  const ws = useSequencesWorkspace();

  if (ws.loading) {
    return <PageLoader label="Loading sequences…" />;
  }

  if (ws.workspaceMode === 'home') {
    return (
      <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950">
        <SequencesHomeView
          sequences={ws.sequences}
          stats={ws.stats}
          searchQuery={ws.searchQuery}
          onSearchChange={ws.setSearchQuery}
          onCreate={ws.startWizard}
          onSelect={ws.openEditor}
          onDelete={ws.deleteSequence}
          onToggleEnabled={ws.toggleEnabled}
          folders={ws.folders}
          activeFolderId={ws.activeFolderId}
          onFolderSelect={ws.setActiveFolderId}
          onCreateFolder={ws.createFolder}
          onRenameFolder={ws.renameFolder}
          onDeleteFolder={ws.deleteFolder}
          onMoveToFolder={ws.moveSequenceToFolder}
          onDuplicate={ws.duplicateSequence}
          onArchive={ws.archiveSequence}
          onToggleFolderFavorite={ws.toggleFolderFavorite}
        />
      </div>
    );
  }

  if (ws.workspaceMode === 'wizard') {
    return (
      <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950">
        <SequenceCreationWizard
          step={ws.wizardStep}
          draft={ws.wizardDraft}
          onChange={(patch) => ws.setWizardDraft((d) => ({ ...d, ...patch }))}
          onNext={() => ws.setWizardStep(2)}
          onBack={() => ws.setWizardStep(1)}
          onCancel={() => ws.setWorkspaceMode('home')}
          onFinish={ws.finishWizard}
          templates={ws.templates}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => ws.setWorkspaceMode('home')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <input
                value={ws.draftMeta.name}
                onChange={(e) => ws.setDraftMeta((m) => ({ ...m, name: e.target.value }))}
                className="text-lg font-bold bg-transparent border-none outline-none text-slate-900 dark:text-white w-full truncate"
              />
              <p className="text-xs text-slate-500 truncate">{ws.draftMeta.description || 'Workflow sequence'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`hidden sm:inline text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${
              ws.draftMeta.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>{ws.draftMeta.status}</span>
            <button
              type="button"
              onClick={() => ws.saveSequence(false)}
              disabled={ws.saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {ws.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save draft
            </button>
            {ws.selectedId && (
              <button
                type="button"
                onClick={ws.openTestMode}
                disabled={ws.saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 disabled:opacity-50"
              >
                <FlaskConical className="w-4 h-4" /> Test
              </button>
            )}
            <button type="button" onClick={ws.copySelection} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500" title="Copy"><Copy className="w-4 h-4" /></button>
            <button type="button" onClick={ws.pasteSelection} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500" title="Paste"><ClipboardPaste className="w-4 h-4" /></button>
            <button
              type="button"
              onClick={() => ws.saveSequence(true)}
              disabled={ws.saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4" /> Activate
            </button>
          </div>
        </div>
        <div className="px-4 flex gap-1 border-t border-slate-100 dark:border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                ws.setBuilderTab(tab.id);
                if (tab.id !== 'builder' && ws.selectedId) ws.loadExecutions(ws.selectedId);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                ws.builderTab === tab.id
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 min-h-0">
        {ws.builderTab === 'simple' && (
          <SimpleEditView
            nodes={ws.draftNodes}
            edges={ws.draftEdges}
            onUpdateNode={ws.updateNode}
            onReplaceGraph={(nodes, edges) => { ws.setDraftNodes(nodes); ws.setDraftEdges(edges); }}
            onSwitchToBuilder={() => ws.setBuilderTab('builder')}
            onSaveDraft={() => ws.saveSequence(false)}
          />
        )}
        {ws.builderTab === 'builder' && (
          <div className="flex gap-3 h-[calc(100vh-180px)] min-h-[480px]">
            <NodeSidebar onAddNode={ws.addNode} />
            <WorkflowCanvas
              nodes={ws.draftNodes}
              edges={ws.draftEdges}
              selectedNodeId={ws.selectedNodeId}
              onSelectNode={ws.setSelectedNodeId}
              onMoveNode={ws.moveNode}
              onConnect={ws.connectNodes}
              onDuplicate={ws.duplicateNode}
              onDelete={ws.removeNode}
              onUndo={ws.undo}
              onRedo={ws.redo}
            />
            <NodeSettingsPanel node={ws.selectedNode} onUpdate={ws.updateNode} />
          </div>
        )}
        {ws.builderTab === 'settings' && (
          <SequenceWorkflowSettings
            draftMeta={ws.draftMeta}
            setDraftMeta={ws.setDraftMeta}
            sequenceId={ws.selectedId}
            webhookSecret={ws.draftMeta.webhookSecret || ws.analytics?.sequence?.webhookSecret}
          />
        )}
        {ws.builderTab === 'analytics' && (
          <SequenceAnalytics analytics={ws.analytics} loading={ws.executionsLoading} />
        )}
        {ws.builderTab === 'logs' && (
          <ExecutionLogs executions={ws.executions} timeline={ws.analytics?.timeline} loading={ws.executionsLoading} />
        )}
        {ws.builderTab === 'approvals' && <ApprovalQueue />}
      </div>

      <ConfirmDialog
        open={ws.testModeOpen}
        mode="prompt"
        title="Test this sequence"
        message="Enter a lead ID to run the sequence against (debug mode — no messages are actually sent to the customer)."
        placeholder="Lead ID"
        required
        confirmLabel="Run test"
        saving={ws.saving}
        onConfirm={ws.runTestMode}
        onCancel={() => ws.setTestModeOpen(false)}
      />
    </div>
  );
}
