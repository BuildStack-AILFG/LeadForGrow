'use client';

import { Trash2, UserCog, Tag, Download, Archive, Merge } from 'lucide-react';

export default function ContactsBulkBar({ count, teamMembers, onAssign, onDelete, onArchive, onExport, onAddTags }) {
  if (!count) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 bg-[#101828] dark:bg-slate-700 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="text-[13px] font-medium mr-2">{count} selected</span>
      <button type="button" onClick={onAssign} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-white/10 dark:bg-slate-900/10 hover:bg-white/15 dark:hover:bg-slate-800/15 rounded-lg transition-colors">
        <UserCog className="w-3.5 h-3.5" /> Assign Owner
      </button>
      <button type="button" onClick={onAddTags} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-white/10 dark:bg-slate-900/10 hover:bg-white/15 dark:hover:bg-slate-800/15 rounded-lg transition-colors">
        <Tag className="w-3.5 h-3.5" /> Add Tags
      </button>
      <button type="button" onClick={onExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-white/10 dark:bg-slate-900/10 hover:bg-white/15 dark:hover:bg-slate-800/15 rounded-lg transition-colors">
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      <button type="button" onClick={onArchive} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-white/10 dark:bg-slate-900/10 hover:bg-white/15 dark:hover:bg-slate-800/15 rounded-lg transition-colors">
        <Archive className="w-3.5 h-3.5" /> Archive
      </button>
      <button type="button" disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-white/5 dark:bg-slate-900/5 text-white/40 rounded-lg cursor-not-allowed" title="Coming soon">
        <Merge className="w-3.5 h-3.5" /> Merge
      </button>
      <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors ml-auto">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );
}
