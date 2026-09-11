'use client';

import { Search, Plus } from 'lucide-react';
import TemplateCard from './TemplateCard';

export default function TemplateLibrary({ templates, searchQuery, onSearchChange, onCreate, onEdit, onDelete }) {
  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search templates…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No templates found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create a template or sync from Meta</p>
          <button type="button" onClick={onCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Create template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template, index) => (
            <TemplateCard
              key={template.id || `new-${index}`}
              template={template}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          <button
            type="button"
            onClick={onCreate}
            className="flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-teal-300 hover:text-teal-600 hover:bg-white dark:hover:bg-slate-900 transition-all"
          >
            <Plus className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">Add template</span>
          </button>
        </div>
      )}
    </div>
  );
}
