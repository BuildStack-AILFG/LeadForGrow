'use client';

import { FORM_THEMES, FORM_TYPES } from './constants';

export default function ThemeCustomizer({ styling, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-3">Choose a theme</p>
        <div className="grid grid-cols-2 gap-3">
          {FORM_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...styling, theme: t.id, primaryColor: t.primary, backgroundColor: t.bg === t.primary ? '' : t.bg })}
              className={`p-4 rounded-2xl text-left transition-all ${
                styling.theme === t.id ? 'bg-accent-subtle dark:bg-teal-950/30 ring-2 ring-focus' : 'bg-subtle dark:bg-slate-800/50 hover:bg-muted dark:hover:bg-slate-800'
              }`}
            >
              <span className="inline-block w-6 h-6 rounded-full mb-2" style={{ background: t.primary }} />
              <p className="text-sm font-medium text-fg dark:text-slate-200">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      <Field label="Primary color">
        <input type="color" value={styling.primaryColor} onChange={(e) => onChange({ ...styling, primaryColor: e.target.value })} className="w-full h-10 rounded-lg cursor-pointer border-0" />
      </Field>
      <Field label={`Corner radius — ${styling.borderRadius || 12}px`}>
        <input type="range" min={4} max={24} value={styling.borderRadius || 12} onChange={(e) => onChange({ ...styling, borderRadius: Number(e.target.value) })} className="w-full accent-teal-600" />
      </Field>
      <Field label="Button text">
        <input value={styling.buttonText || 'Submit'} onChange={(e) => onChange({ ...styling, buttonText: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Logo URL">
        <input value={styling.logoUrl || ''} onChange={(e) => onChange({ ...styling, logoUrl: e.target.value })} placeholder="https://…" className={inputClass} />
      </Field>
    </div>
  );
}

const inputClass = 'w-full px-4 py-3 text-sm bg-subtle dark:bg-slate-800/80 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus/25';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-meta font-semibold text-fg-tertiary mb-1">{label}</label>
      {children}
    </div>
  );
}
