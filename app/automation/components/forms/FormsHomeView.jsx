'use client';

import { useState } from 'react';
import { Plus, FileInput, TrendingUp, ArrowRight, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { calcConversionRate } from './constants';
import { FormPreviewThumbnail } from './FormPreview';
import AutoPageIntro from '../shared/tour/AutoPageIntro';
import { useConfirm } from '@/app/components/ConfirmProvider';

export default function FormsHomeView({ forms, stats, maxForms, onCreate, onSelect, onDelete }) {
  const confirm = useConfirm();
  const [menuId, setMenuId] = useState(null);

  const handleDelete = async (e, form) => {
    e.stopPropagation();
    setMenuId(null);
    const msg = form.submissionCount > 0
      ? `Delete "${form.name}"? Past submissions will stay in your CRM. This cannot be undone.`
      : `Delete "${form.name}"? This cannot be undone.`;
    if (await confirm({ title: 'Delete form', message: msg, confirmLabel: 'Delete', danger: true })) onDelete(form._id);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-fg dark:text-slate-50 tracking-tight">Lead capture forms</h1>
          <p className="text-sm text-fg-tertiary mt-1">Build, publish, and track forms that feed your CRM.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={forms.length >= maxForms}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg shadow-popover disabled:opacity-50 transition-all"
        >
          <Plus className="w-4 h-4" /> Create form
        </button>
      </div>

      <AutoPageIntro />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { label: 'Active forms', value: stats.activeForms, icon: FileInput },
          { label: 'Submissions', value: stats.totalSubmissions, icon: TrendingUp },
          { label: 'With leads', value: stats.withLeads, icon: FileInput },
          { label: 'Avg conversion', value: `${stats.avgConversion}%`, icon: TrendingUp },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-canvas dark:bg-slate-900 rounded-lg p-4">
              <Icon className="w-4 h-4 text-accent-fg mb-2" />
              <p className="text-2xl font-semibold text-fg dark:text-slate-50 tabular-nums">{c.value}</p>
              <p className="text-xs text-fg-tertiary mt-0.5">{c.label}</p>
            </div>
          );
        })}
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-20 bg-canvas dark:bg-slate-900 rounded-lg">
          <div className="w-16 h-16 rounded-lg bg-accent-subtle dark:bg-teal-950/50 flex items-center justify-center mx-auto mb-4">
            <FileInput className="w-8 h-8 text-accent-fg" />
          </div>
          <h2 className="text-lg font-semibold text-fg dark:text-slate-50">No forms yet</h2>
          <p className="text-sm text-fg-tertiary mt-2 max-w-xs mx-auto">Create your first lead capture form in under 2 minutes.</p>
          <button type="button" onClick={onCreate} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent rounded-lg">
            <Plus className="w-4 h-4" /> Get started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form, i) => {
            const rate = calcConversionRate(form);
            const menuOpen = menuId === form._id;
            return (
              <motion.div
                key={form._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-canvas dark:bg-slate-900 rounded-lg hover:shadow-popover transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => onSelect(form._id)}
                  className="w-full text-left"
                >
                  <div className="h-28 bg-subtle dark:bg-slate-800/50 p-4">
                    <FormPreviewThumbnail fields={form.fields} styling={form.styling} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-fg dark:text-slate-50 truncate">{form.name}</p>
                        <p className="text-xs text-fg-tertiary mt-0.5">{form.submissionCount || 0} leads · {rate}% conv.</p>
                      </div>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                        form.active !== false ? 'bg-accent-subtle text-accent-fg' : 'bg-muted text-fg-tertiary'
                      }`}>
                        {form.active !== false ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs font-medium text-accent-fg opacity-0 group-hover:opacity-100 transition-opacity">
                      Open builder <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>

                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuId(menuOpen ? null : form._id); }}
                    className="p-1.5 rounded-lg text-fg-tertiary hover:text-fg-secondary hover:bg-canvas/90 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                    aria-label="Form options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-canvas dark:bg-slate-900 rounded-lg shadow-popover border border-line dark:border-slate-800 py-1 z-20">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setMenuId(null); onSelect(form._id); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-fg-secondary dark:text-fg-disabled hover:bg-subtle dark:hover:bg-slate-800"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, form)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger-subtle dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
