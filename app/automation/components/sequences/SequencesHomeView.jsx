'use client';

import { useState } from 'react';
import {
  GitBranch, Plus, Play, Users, CheckCircle2, Zap, Trash2, ChevronRight, Search, Pause,
  Folder, FolderOpen, Star, Pencil, Copy, Archive
} from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

const STATUS_STYLES = {
  active: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg',
  draft: 'bg-warning-subtle text-warning dark:bg-amber-950/40 dark:text-amber-400',
  paused: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary',
  archived: 'bg-muted text-fg-tertiary',
};

export default function SequencesHomeView({
  sequences, stats, searchQuery, onSearchChange, onCreate, onSelect, onDelete, onToggleEnabled,
  folders = [], activeFolderId, onFolderSelect, onCreateFolder, onRenameFolder, onDeleteFolder, onMoveToFolder,
  onDuplicate, onArchive, onToggleFolderFavorite,
}) {
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [renameFolderTarget, setRenameFolderTarget] = useState(null); // folder object or null
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null); // folder object or null
  const [deleteSeqTarget, setDeleteSeqTarget] = useState(null); // sequence object or null

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page font-semibold text-fg">Sequences</h1>
          <p className="mt-0.5 text-body text-fg-secondary">
            Multi-step follow-ups that run until a lead replies or converts.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:shadow-popover transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Create sequence
        </button>
      </div>

      <AutoPageIntro />

      <div className="flex gap-6">
        {/* Folder sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-meta font-semibold text-fg-tertiary">Folders</p>
            <button type="button" onClick={() => setNewFolderOpen(true)} className="p-1 rounded hover:bg-muted dark:hover:bg-slate-800 text-fg-tertiary">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => onFolderSelect?.(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                !activeFolderId ? 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40' : 'text-fg-secondary hover:bg-subtle dark:hover:bg-slate-900'
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              All workflows
            </button>
            {folders.filter((f) => !f.archived).map((folder) => (
              <div key={folder._id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onFolderSelect?.(folder._id)}
                  className={`flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    activeFolderId === folder._id ? 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40' : 'text-fg-secondary hover:bg-subtle dark:hover:bg-slate-900'
                  }`}
                >
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {folder.isFavorite && <Star className="w-3 h-3 text-warning ml-auto shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFolderFavorite?.(folder._id, !folder.isFavorite)}
                  className={`shrink-0 p-1 opacity-0 group-hover:opacity-100 ${folder.isFavorite ? 'text-warning opacity-100' : 'text-fg-tertiary'}`}
                  title="Favorite"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenameFolderTarget(folder)}
                  className="shrink-0 p-1 opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-fg-secondary"
                  title="Rename folder"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteFolderTarget(folder)}
                  className="shrink-0 p-1 opacity-0 group-hover:opacity-100 text-fg-tertiary hover:text-danger"
                  title="Delete folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
            <input
              type="search"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search workflows…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-line dark:border-slate-700 bg-canvas/80 dark:bg-slate-900/80 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total sequences', value: stats.total, icon: GitBranch, iconClass: 'text-accent-fg' },
              { label: 'Active', value: stats.active, icon: Play, iconClass: 'text-accent-fg' },
              { label: 'Enrolled leads', value: stats.enrolled, icon: Users, iconClass: 'text-accent-fg' },
              { label: 'Running now', value: stats.running, icon: Zap, iconClass: 'text-warning' },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-lg bg-canvas/80 dark:bg-slate-900/80 border border-line/80 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-fg-tertiary">{s.label}</p>
                  <s.icon className={`w-4 h-4 ${s.iconClass}`} />
                </div>
                <p className="text-2xl font-semibold text-fg dark:text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {sequences.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-lg border-2 border-dashed border-line dark:border-slate-700 bg-canvas/50 dark:bg-slate-900/30">
              <div className="w-16 h-16 mx-auto rounded-lg bg-accent flex items-center justify-center mb-4">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-fg dark:text-white">No sequences yet</h3>
              <p className="text-sm text-fg-tertiary mt-1 max-w-md mx-auto">
                Create your first workflow — guided templates for WhatsApp nurture, missed call recovery, and more.
              </p>
              <button type="button" onClick={onCreate} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Get started
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sequences.map((seq, i) => (
                <div
                  key={seq._id}
                  className="group text-left p-5 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 hover:border-line dark:hover:border-accent hover:shadow-popover transition-all"
                >
                  <button type="button" onClick={() => onSelect(seq)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-canvas border border-line flex items-center justify-center shadow-popover group-hover:scale-105 transition-transform">
                        <GitBranch className="w-5 h-5 text-fg-secondary" />
                      </div>
                      <span className={`text-meta font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[seq.status] || STATUS_STYLES.draft}`}>
                        {seq.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-fg dark:text-white group-hover:text-accent-fg transition-colors">{seq.name}</h3>
                    <p className="text-xs text-fg-tertiary mt-1 line-clamp-2">{seq.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-4 text-meta text-fg-tertiary">
                      <span>{(seq.nodes?.length || seq.steps?.length || 0)} steps</span>
                      <span>·</span>
                      <span>{seq.analytics?.enrolled || 0} enrolled</span>
                    </div>
                  </button>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-line dark:border-slate-800">
                    <select
                      className="text-meta border border-line dark:border-slate-700 rounded-lg px-2 py-1 bg-transparent text-fg-tertiary"
                      value={seq.folderId || ''}
                      onChange={(e) => onMoveToFolder?.(seq._id, e.target.value || null)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">No folder</option>
                      {folders.map((f) => (
                        <option key={f._id} value={f._id}>{f.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDuplicate?.(seq); }}
                        className="p-1.5 rounded-lg text-fg-tertiary hover:text-accent-fg"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onArchive?.(seq._id); }}
                        className="p-1.5 rounded-lg text-fg-tertiary hover:text-warning"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleEnabled?.(seq._id, seq.status !== 'active'); }}
                        className="p-1.5 rounded-lg text-fg-tertiary hover:text-accent-fg"
                        title={seq.status === 'active' ? 'Pause' : 'Enable'}
                      >
                        {seq.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteSeqTarget(seq); }}
                        className="p-1.5 rounded-lg text-fg-tertiary hover:text-danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={newFolderOpen}
        mode="prompt"
        title="New folder"
        placeholder="Folder name"
        required
        confirmLabel="Create"
        onConfirm={(name) => { onCreateFolder?.(name); setNewFolderOpen(false); }}
        onCancel={() => setNewFolderOpen(false)}
      />
      <ConfirmDialog
        open={!!renameFolderTarget}
        mode="prompt"
        title="Rename folder"
        defaultValue={renameFolderTarget?.name || ''}
        required
        confirmLabel="Rename"
        onConfirm={(name) => { onRenameFolder?.(renameFolderTarget._id, name); setRenameFolderTarget(null); }}
        onCancel={() => setRenameFolderTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteFolderTarget}
        mode="confirm"
        title="Delete folder?"
        message={`"${deleteFolderTarget?.name}" will be removed. Sequences inside it are not deleted, just unfiled.`}
        confirmLabel="Delete folder"
        danger
        onConfirm={() => { onDeleteFolder?.(deleteFolderTarget._id); setDeleteFolderTarget(null); }}
        onCancel={() => setDeleteFolderTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteSeqTarget}
        mode="confirm"
        title="Delete sequence?"
        message={`"${deleteSeqTarget?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => { onDelete(deleteSeqTarget._id); setDeleteSeqTarget(null); }}
        onCancel={() => setDeleteSeqTarget(null)}
      />
    </div>
  );
}
