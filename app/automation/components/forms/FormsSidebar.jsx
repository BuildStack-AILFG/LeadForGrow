'use client';

import { Plus } from 'lucide-react';
import { calcConversionRate } from './constants';
import { FormPreviewThumbnail } from './FormPreview';

export default function FormsSidebar({ forms, selectedId, onSelect, onCreate, maxForms }) {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onCreate}
          disabled={forms.length >= maxForms}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
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
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex gap-2">
                <div className="w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
                  <FormPreviewThumbnail fields={form.fields} styling={form.styling} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{form.name}</p>
                  <p className="text-[10px] text-slate-500">{form.submissionCount || 0} leads · {rate}% conv.</p>
                  <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${form.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
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
