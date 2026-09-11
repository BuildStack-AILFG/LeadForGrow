'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, Plus, Play, Users, CheckCircle2, Zap, Trash2, ChevronRight, Search, Pause,
  Folder, FolderOpen, Star, Pencil, Copy, Archive
} from 'lucide-react';
import ConfirmDialog from '../shared/ConfirmDialog';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  paused: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  archived: 'bg-slate-100 text-slate-500',
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-medium mb-3">
            <GitBranch className="w-3.5 h-3.5" />
            Workflow Automation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Sequences</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-lg">
            WhatsApp-first sales automation — nurture leads, recover missed calls, and qualify with AI.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Folders</p>
            <button type="button" onClick={() => setNewFolderOpen(true)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              onClick={() => onFolderSelect?.(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                !activeFolderId ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
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
                    activeFolderId === folder._id ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                  {folder.isFavorite && <Star className="w-3 h-3 text-amber-500 ml-auto shrink-0" />}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFolderFavorite?.(folder._id, !folder.isFavorite)}
                  className={`shrink-0 p-1 opacity-0 group-hover:opacity-100 ${folder.isFavorite ? 'text-amber-500 opacity-100' : 'text-slate-400'}`}
                  title="Favorite"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenameFolderTarget(folder)}
                  className="shrink-0 p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600"
                  title="Rename folder"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteFolderTarget(folder)}
                  className="shrink-0 p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search workflows…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total sequences', value: stats.total, icon: GitBranch, iconClass: 'text-teal-500' },
              { label: 'Active', value: stats.active, icon: Play, iconClass: 'text-emerald-500' },
              { label: 'Enrolled leads', value: stats.enrolled, icon: Users, iconClass: 'text-violet-500' },
              { label: 'Running now', value: stats.running, icon: Zap, iconClass: 'text-amber-500' },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/80 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <s.icon className={`w-4 h-4 ${s.iconClass}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {sequences.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/30">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500 flex items-center justify-center mb-4 shadow-sm">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No sequences yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Create your first workflow — guided templates for WhatsApp nurture, missed call recovery, and more.
              </p>
              <button type="button" onClick={onCreate} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium">
                <Plus className="w-4 h-4" /> Get started
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sequences.map((seq, i) => (
                <motion.div
                  key={seq._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all"
                >
                  <button type="button" onClick={() => onSelect(seq)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <GitBranch className="w-5 h-5 text-white" />
                      </div>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[seq.status] || STATUS_STYLES.draft}`}>
                        {seq.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">{seq.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{seq.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-400">
                      <span>{(seq.nodes?.length || seq.steps?.length || 0)} steps</span>
                      <span>·</span>
                      <span>{seq.analytics?.enrolled || 0} enrolled</span>
                    </div>
                  </button>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <select
                      className="text-[10px] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-transparent text-slate-500"
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onArchive?.(seq._id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleEnabled?.(seq._id, seq.status !== 'active'); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600"
                        title={seq.status === 'active' ? 'Pause' : 'Enable'}
                      >
                        {seq.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteSeqTarget(seq); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
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
