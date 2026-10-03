'use client';

import { useEffect, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Wand2 } from 'lucide-react';
import { AUTOMATION_TEMPLATES, RULE_ICONS, RULE_ICON_FALLBACK } from './constants';
import HelpHint from '@/app/components/ui/HelpHint';

const TONE_CLASSES = {
  emerald: { chip: 'bg-accent-subtle dark:bg-emerald-950/40 text-accent-fg dark:text-accent-fg', ring: 'hover:border-line dark:hover:border-emerald-800', badge: 'bg-accent-subtle dark:bg-accent-pressed/30 text-accent-fg dark:text-accent-fg' },
  blue:    { chip: 'bg-accent-subtle dark:bg-teal-950/40 text-accent-fg dark:text-accent-fg', ring: 'hover:border-line dark:hover:border-teal-800', badge: 'bg-accent-subtle dark:bg-accent-pressed/30 text-accent-fg dark:text-accent-fg' },
  violet:  { chip: 'bg-accent-subtle dark:bg-violet-950/40 text-accent-fg dark:text-accent-fg', ring: 'hover:border-line dark:hover:border-violet-800', badge: 'bg-accent-subtle dark:bg-accent-pressed/30 text-accent-fg dark:text-accent-fg' },
  amber:   { chip: 'bg-warning-subtle dark:bg-amber-950/40 text-warning dark:text-amber-400', ring: 'hover:border-warning/30 dark:hover:border-amber-800', badge: 'bg-warning-subtle dark:bg-amber-900/30 text-warning dark:text-amber-300' },
  rose:    { chip: 'bg-danger-subtle dark:bg-rose-950/40 text-danger dark:text-rose-400', ring: 'hover:border-rose-300 dark:hover:border-rose-800', badge: 'bg-danger-subtle dark:bg-rose-900/30 text-danger dark:text-rose-300' },
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
      <div className="absolute inset-0 bg-slate-900/50" style={{ animation: 'fadeIn 150ms ease-out' }} onClick={onClose} />

      {step === 'gallery' ? (
        <div className="lfg-tour-pop relative w-full max-w-2xl glass-panel rounded-lg shadow-modal p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-lg font-semibold text-fg dark:text-slate-50">Let's build an automation</h3>
              <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mt-1">Pick a ready-made starting point, or build one from scratch.</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 shrink-0" aria-label="Close">
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
                  className={`group text-left rounded-lg border border-line dark:border-slate-800 bg-canvas dark:bg-slate-900 p-4 transition-all hover:shadow-popover ${tone.ring}`}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tone.chip}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-sm font-semibold text-fg dark:text-slate-100">{tpl.name}</p>
                  </div>
                  <div className="text-meta leading-relaxed text-fg-tertiary dark:text-fg-tertiary mb-2 space-y-0.5">
                    <p><span className="font-semibold text-fg-secondary dark:text-fg-disabled">WHEN</span> {tpl.when}</p>
                    <p><span className="font-semibold text-fg-secondary dark:text-fg-disabled">THEN</span> {tpl.then}</p>
                  </div>
                  <p className="text-xs text-fg-tertiary dark:text-fg-tertiary leading-relaxed">{tpl.description}</p>
                </button>
              );
            })}

            <button
              type="button"
              onClick={startFromScratch}
              className="group text-left rounded-lg border border-dashed border-line-strong dark:border-slate-700 bg-subtle/60 dark:bg-slate-900/40 p-4 flex flex-col items-center justify-center text-center hover:border-line-strong hover:bg-subtle dark:hover:bg-slate-900 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-muted dark:bg-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Wand2 className="w-4.5 h-4.5 text-fg-tertiary dark:text-fg-tertiary" />
              </div>
              <p className="text-sm font-semibold text-fg-secondary dark:text-slate-200">Build from scratch</p>
              <p className="text-xs text-fg-tertiary mt-1">Pick your own type, name it yourself.</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="lfg-tour-pop relative w-full max-w-md glass-panel rounded-lg shadow-modal p-6">
          <button
            type="button"
            onClick={() => setStep('gallery')}
            className="inline-flex items-center gap-1 text-xs font-medium text-fg-tertiary dark:text-fg-tertiary hover:text-fg dark:hover:text-slate-200 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to templates
          </button>

          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-fg dark:text-slate-50">
              {selectedTemplate ? selectedTemplate.name : 'Custom automation'}
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedTemplate && (
            <div className="mt-3 mb-4 rounded-lg bg-subtle dark:bg-slate-800/60 border border-line dark:border-slate-700 p-3 text-meta leading-relaxed text-fg-secondary dark:text-fg-disabled space-y-0.5">
              <p><span className="font-semibold">WHEN</span> {selectedTemplate.when}</p>
              <p><span className="font-semibold">THEN</span> {selectedTemplate.then}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {!selectedTemplate && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">
                  Type
                  <HelpHint text="What should trigger this automation and what it does when it fires. Each type runs a fixed, tested action so it works reliably." />
                </label>
                <select
                  value={form.type}
                  onChange={(e) => onChange({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded-lg"
                >
                  {AUTOMATION_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">
                Name
                <HelpHint text="An internal label — your team sees this in the automation list. Customers never see it." />
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                placeholder="e.g. Lead Welcome Email"
                className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">
                Description
                <HelpHint text="A short reminder of what this automation does — useful when you have several running at once." />
              </label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => onChange({ ...form, description: e.target.value })}
                placeholder="What does this automation do?"
                className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded-lg resize-none"
              />
            </div>
            <button type="submit" className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors">
              Create automation <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
