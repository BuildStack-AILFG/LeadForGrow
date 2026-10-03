'use client';

import { Trash2, UserCog, Tag, Download, Archive, Merge } from 'lucide-react';

export default function CompaniesBulkBar({ count, teamMembers, onAssign, onDelete, onArchive, onExport, onAddTags }) {
  if (!count) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 bg-accent text-white rounded-lg shadow-popover animate-in fade-in slide-in-from-top-1 duration-200">
      <span className="text-dense font-medium mr-2">{count} selected</span>
      <button type="button" onClick={onAssign} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-meta font-medium bg-canvas/10 hover:bg-canvas/15 rounded-lg transition-colors">
        <UserCog className="w-3.5 h-3.5" /> Assign Owner
      </button>
      <button type="button" onClick={onAddTags} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-meta font-medium bg-canvas/10 hover:bg-canvas/15 rounded-lg transition-colors">
        <Tag className="w-3.5 h-3.5" /> Add Tags
      </button>
      <button type="button" onClick={onExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-meta font-medium bg-canvas/10 hover:bg-canvas/15 rounded-lg transition-colors">
        <Download className="w-3.5 h-3.5" /> Export
      </button>
      <button type="button" onClick={onArchive} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-meta font-medium bg-canvas/10 hover:bg-canvas/15 rounded-lg transition-colors">
        <Archive className="w-3.5 h-3.5" /> Archive
      </button>
      <button type="button" disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 text-meta font-medium bg-canvas/5 text-white/40 rounded-lg cursor-not-allowed" title="Coming soon">
        <Merge className="w-3.5 h-3.5" /> Merge
      </button>
      <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-meta font-medium bg-danger/90 hover:bg-danger rounded-lg transition-colors ml-auto">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </button>
    </div>
  );
}
