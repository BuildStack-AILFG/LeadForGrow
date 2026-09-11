'use client';

import { useEffect, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { AUTOMATION_TEMPLATES, RULE_ICONS, RULE_ICON_FALLBACK } from './constants';
import HelpHint from '@/app/components/ui/HelpHint';

const TONE_CLASSES = {
  emerald: { chip: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400', ring: 'hover:border-emerald-300 dark:hover:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  blue:    { chip: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400', ring: 'hover:border-teal-300 dark:hover:border-teal-800', badge: 'bg-teal-100 text-teal-700' },
  violet:  { chip: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400', ring: 'hover:border-violet-300 dark:hover:border-violet-800', badge: 'bg-violet-100 text-violet-700' },
  amber:   { chip: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400', ring: 'hover:border-amber-300 dark:hover:border-amber-800', badge: 'bg-amber-100 text-amber-700' },
  rose:    { chip: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400', ring: 'hover:border-rose-300 dark:hover:border-rose-800', badge: 'bg-rose-100 text-rose-700' },
};

export default function CreateAutomationModal({ open, form, onChange, onClose, onSubmit }) {
  const [step, setStep] = useState('gallery'); // 'gallery' | 'form'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (open) {
      setStep('gallery');
      setSelectedTemplate(null);
    }
  }, [open]);

  if (!open) return null;

  const pickTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    onChange({
      ...form,
      type: tpl.id,
      name: form.name || tpl.defaultName,
      description: form.description || tpl.defaultDescription,
    });
    setStep('form');
  };

  const startFromScratch = () => {
    setSelectedTemplate(null);
    setStep('form');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" style={{ animation: 'fadeIn 150ms ease-out' }} onClick={onClose} />

      {step === 'gallery' ? (
        <div className="lfg-tour-pop relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Let's build an automation</h3>
              <p className="text-sm text-slate-500 mt-1">Pick a ready-made starting point, or build one from scratch.</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            {AUTOMATION_TEMPLATES.map((tpl) => {
              const Icon = RULE_ICONS[tpl.id] || RULE_ICON_FALLBACK;
              const tone = TONE_CLASSES[tpl.tone] || TONE_CLASSES.blue;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => pickTemplate(tpl)}
                  className={`group text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all hover:shadow-md ${tone.ring}`}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone.chip}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tpl.name}</p>
                  </div>
                  <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 mb-2 space-y-0.5">
                    <p><span className="font-semibold text-slate-600 dark:text-slate-300">WHEN</span> {tpl.when}</p>
                    <p><span className="font-semibold text-slate-600 dark:text-slate-300">THEN</span> {tpl.then}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tpl.description}</p>
                </button>
              );
            })}

            <button
              type="button"
              onClick={startFromScratch}
              className="group text-left rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 p-4 flex flex-col items-center justify-center text-center hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Wand2 className="w-4.5 h-4.5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Build from scratch</p>
              <p className="text-xs text-slate-400 mt-1">Pick your own type, name it yourself.</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="lfg-tour-pop relative w-full max-w-md glass-panel rounded-3xl shadow-2xl p-6">
          <button
            type="button"
            onClick={() => setStep('gallery')}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to templates
          </button>

          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {selectedTemplate ? selectedTemplate.name : 'Custom automation'}
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedTemplate && (
            <div className="mt-3 mb-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 space-y-0.5">
              <p><span className="font-semibold">WHEN</span> {selectedTemplate.when}</p>
              <p><span className="font-semibold">THEN</span> {selectedTemplate.then}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!selectedTemplate && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Type
                  <HelpHint text="What should trigger this automation and what it does when it fires. Each type runs a fixed, tested action so it works reliably." />
                </label>
                <select
                  value={form.type}
                  onChange={(e) => onChange({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {AUTOMATION_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Name
                <HelpHint text="An internal label — your team sees this in the automation list. Customers never see it." />
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                placeholder="e.g. Lead Welcome Email"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Description
                <HelpHint text="A short reminder of what this automation does — useful when you have several running at once." />
              </label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => onChange({ ...form, description: e.target.value })}
                placeholder="What does this automation do?"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none"
              />
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
              Create automation <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
