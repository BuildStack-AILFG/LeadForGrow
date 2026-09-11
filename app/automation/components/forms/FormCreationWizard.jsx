'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { FORM_TYPES, FORM_TEMPLATES, LEAD_SOURCES, PIPELINE_STAGES } from './constants';

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
};

export default function FormCreationWizard({ step, draft, onChange, onNext, onBack, onCancel }) {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step >= s ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {s}
              </div>
              {s < 2 && <div className={`w-12 h-0.5 rounded ${step > s ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...slide} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none p-8 sm:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 mb-4">
                  <Sparkles className="w-6 h-6 text-teal-600" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Form basics</h1>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Tell us about your form. You can change everything later.</p>
              </div>

              <div className="space-y-5 max-w-md mx-auto">
                <Field label="Form name">
                  <input
                    value={draft.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="e.g. Website contact form"
                    className={inputClass}
                    autoFocus
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={draft.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="What will this form capture?"
                    rows={2}
                    className={inputClass}
                  />
                </Field>
                <Field label="Form type">
                  <div className="grid grid-cols-2 gap-2">
                    {FORM_TYPES.slice(0, 4).map((ft) => (
                      <button
                        key={ft.id}
                        type="button"
                        onClick={() => onChange({ formType: ft.id })}
                        className={`px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                          draft.formType === ft.id
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {ft.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Lead source">
                    <select value={draft.leadSource} onChange={(e) => onChange({ leadSource: e.target.value })} className={inputClass}>
                      {LEAD_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="CRM pipeline">
                    <select value={draft.pipelineStage} onChange={(e) => onChange({ pipelineStage: e.target.value })} className={inputClass}>
                      {PIPELINE_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              <WizardActions onCancel={onCancel} onNext={onNext} nextLabel="Choose template" nextDisabled={!draft.name?.trim()} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...slide}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">Choose a template</h1>
                <p className="text-sm text-slate-500 mt-2">Start with a proven layout — customize every field after.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FORM_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const selected = draft.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onChange({ templateId: tpl.id, templateFields: tpl.fields, formType: tpl.formType })}
                      className={`group text-left rounded-2xl overflow-hidden transition-all duration-200 ${
                        selected ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-slate-950 scale-[1.02]' : 'hover:scale-[1.01] hover:shadow-lg'
                      }`}
                    >
                      <div className={`h-24 bg-gradient-to-br ${tpl.gradient} flex items-center justify-center relative`}>
                        <Icon className="w-10 h-10 text-white/90" />
                        {selected && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-teal-600 rounded-full" />
                          </div>
                        )}
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{tpl.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{tpl.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <WizardActions onCancel={onCancel} onBack={onBack} onNext={onNext} nextLabel="Start building" nextDisabled={!draft.templateId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WizardActions({ onCancel, onBack, onNext, nextLabel, nextDisabled }) {
  return (
    <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 max-w-md mx-auto">
      <button type="button" onClick={onBack || onCancel} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft className="w-4 h-4" /> {onBack ? 'Back' : 'Cancel'}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm disabled:opacity-40 disabled:shadow-none transition-all"
      >
        {nextLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const inputClass = 'w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/80 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-slate-900 dark:text-slate-100 placeholder:text-slate-400';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
