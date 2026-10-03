'use client';

import { Plus } from 'lucide-react';
import { calcConversionRate } from './constants';
import { FormPreviewThumbnail } from './FormPreview';

export default function FormsSidebar({ forms, selectedId, onSelect, onCreate, maxForms }) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 border-r border-line dark:border-slate-800 bg-canvas dark:bg-slate-900 flex flex-col h-full">
      <div className="p-3 border-b border-line dark:border-slate-800">
        <button
          type="button"
          onClick={onCreate}
          disabled={forms.length >= maxForms}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> New form
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {forms.map((form) => {
          const rate = calcConversionRate(form);
          const selected = form._id === selectedId;
          return (
            <button
              key={form._id}
              type="button"
              onClick={() => onSelect(form._id)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                selected
                  ? 'border-accent bg-accent-subtle dark:bg-teal-950/20'
                  : 'border-transparent hover:bg-subtle dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex gap-2">
                <div className="w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-line dark:border-slate-700">
                  <FormPreviewThumbnail fields={form.fields} styling={form.styling} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-fg dark:text-slate-100 truncate">{form.name}</p>
                  <p className="text-meta text-fg-tertiary dark:text-fg-tertiary">{form.submissionCount || 0} leads · {rate}% conv.</p>
                  <span className={`inline-block mt-0.5 text-meta font-semibold px-1.5 py-0.5 rounded ${form.active !== false ? 'bg-accent-subtle dark:bg-accent-pressed/30 text-accent-fg dark:text-accent-fg' : 'bg-muted dark:bg-slate-800 text-fg-tertiary dark:text-fg-tertiary'}`}>
                    {form.active !== false ? 'Live' : 'Draft'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
