'use client';

import { MousePointerClick, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FormSettingsPanel({ field, fieldIndex, onChange, mobile = false }) {
  if (!field) {
    if (mobile) return null;
    return (
      <aside className="hidden xl:flex w-72 flex-shrink-0 flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-[220px]"
        >
          <div className="w-16 h-16 rounded-lg bg-accent-subtle dark:bg-teal-950/30 dark:from-teal-950/40 dark:to-indigo-950/40 flex items-center justify-center mx-auto mb-5">
            <MousePointerClick className="w-7 h-7 text-accent-fg dark:text-accent-fg" />
          </div>
          <h3 className="text-sm font-semibold text-fg dark:text-slate-200">Select a field</h3>
          <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-2 leading-relaxed">Click any field on the canvas to customize its label, validation, and appearance.</p>
          <div className="mt-6 flex items-start gap-2 text-left p-3 bg-warning-subtle/80 dark:bg-amber-950/20 rounded-lg">
            <Lightbulb className="w-4 h-4 text-warning dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-meta text-warning dark:text-amber-200 leading-relaxed">Tip: Hover a field block for quick duplicate and required toggles.</p>
          </div>
        </motion.div>
      </aside>
    );
  }

  const update = (key, val) => {
    onChange(fieldIndex, { ...field, [key]: val });
  };

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={field.name}
        initial={{ opacity: 0, x: mobile ? 0 : 12, y: mobile ? 8 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: mobile ? 0 : 12, y: mobile ? 8 : 0 }}
        transition={{ duration: 0.2 }}
        className={mobile ? 'flex flex-col' : 'hidden xl:flex w-72 flex-shrink-0 flex-col'}
      >
        <div className="mb-4">
          <p className="text-meta font-semibold text-accent-fg dark:text-accent-fg">{field.type}</p>
          <h3 className="text-sm font-semibold text-fg dark:text-slate-50 mt-0.5">Field settings</h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <SettingField label="Label">
            <input value={field.label} onChange={(e) => update('label', e.target.value)} className={inputClass} />
          </SettingField>
          <SettingField label="Placeholder">
            <input value={field.placeholder || ''} onChange={(e) => update('placeholder', e.target.value)} className={inputClass} />
          </SettingField>
          <SettingField label="Help text">
            <input value={field.helpText || ''} onChange={(e) => update('helpText', e.target.value)} placeholder="Shown below the label" className={inputClass} />
          </SettingField>

          <label className="flex items-center justify-between p-3 bg-subtle dark:bg-slate-800/50 rounded-lg cursor-pointer">
            <span className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">Required field</span>
            <div className={`relative w-9 h-5 rounded-full transition-colors ${field.required ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <input type="checkbox" checked={!!field.required} onChange={(e) => update('required', e.target.checked)} className="sr-only" />
              <div className={`absolute top-0.5 w-4 h-4 bg-canvas rounded-full transition-transform ${field.required ? 'translate-x-4' : 'translate-x-0.5'}`} onClick={() => update('required', !field.required)} />
            </div>
          </label>

          {(field.type === 'select' || field.type === 'radio') && (
            <SettingField label="Options">
              <input
                value={(field.options || []).join(', ')}
                onChange={(e) => update('options', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="Option 1, Option 2"
                className={inputClass}
              />
            </SettingField>
          )}

          <SettingField label="Width">
            <div className="flex gap-2">
              {['full', 'half'].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => update('width', w)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    (field.width || 'full') === w ? 'bg-accent text-white' : 'bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-disabled'
                  }`}
                >
                  {w === 'full' ? 'Full' : 'Half'}
                </button>
              ))}
            </div>
          </SettingField>

          <SettingField label="Validation (regex)">
            <input
              value={field.validation?.pattern || ''}
              onChange={(e) => update('validation', { ...field.validation, pattern: e.target.value })}
              placeholder="Optional pattern"
              className={inputClass}
            />
          </SettingField>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

const inputClass = 'w-full px-3 py-2.5 text-sm bg-subtle dark:bg-slate-800/80 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus/25';

function SettingField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-fg-tertiary dark:text-fg-tertiary mb-1.5">{label}</label>
      {children}
    </div>
  );
}
