'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const MASK = '••••••••';
const isMask = (v) => typeof v === 'string' && (v === MASK || v.startsWith('••••'));

export default function IntegrationConfigForm({ integration, onSubmit, submitting, submitLabel = 'Save & connect' }) {
  const [values, setValues] = useState({});
  const [savedSecrets, setSavedSecrets] = useState({});
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    const initial = {};
    const saved = {};
    for (const field of integration?.fields || []) {
      const stored = integration?.credentials?.[field.key];
      const isSecretField = field.type === 'password' || field.secret;
      if (isSecretField && isMask(stored)) {
        // Field is already saved server-side. Leave the input blank so the
        // user can either (a) type a new value to replace it, or (b) leave
        // blank to keep the existing saved secret intact.
        initial[field.key] = '';
        saved[field.key] = true;
      } else {
        initial[field.key] = stored ?? field.default ?? '';
        saved[field.key] = false;
      }
    }
    setValues(initial);
    setSavedSecrets(saved);
  }, [integration?.id, integration?.credentials]);

  const handleChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only send fields the user actually filled — omitting empty secrets means
    // the backend preserves whatever is already saved.
    const payload = {};
    for (const field of integration.fields) {
      const val = values[field.key];
      const isSecretField = field.type === 'password' || field.secret;
      if (isSecretField && savedSecrets[field.key] && !val) {
        // Skip — user left the saved secret alone
        continue;
      }
      if (val !== undefined && val !== '') payload[field.key] = val;
    }
    onSubmit?.(payload);
  };

  if (!integration?.fields?.length) return null;

  const isOAuth = integration.authType === 'oauth';

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {integration.fields.map((field) => {
        if (field.readOnly) {
          return (
            <div key={field.key}>
              <label className="block text-meta font-semibold text-fg-tertiary mb-1">{field.label}</label>
              <p className="text-sm text-fg-secondary dark:text-fg-disabled">{values[field.key] || '—'}</p>
            </div>
          );
        }

        const isSecret = field.type === 'password' || field.secret;
        const alreadySaved = savedSecrets[field.key];
        const inputType = isSecret && !showSecrets[field.key] ? 'password' : field.type === 'number' ? 'number' : 'text';

        // Field is required for submission only when it's not already saved
        const effectiveRequired = field.required && !alreadySaved;

        const placeholder = alreadySaved
          ? 'Saved — leave blank to keep, type new value to replace'
          : field.placeholder || field.label;

        return (
          <div key={field.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-meta font-semibold text-fg-tertiary">
                {field.label}{field.required ? ' *' : ''}
              </label>
              {alreadySaved && (
                <span className="text-meta font-medium text-accent-fg flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
            {field.type === 'select' ? (
              <select
                value={values[field.key] ?? field.default ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3 py-2 text-xs border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-focus"
              >
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <input
                  type={inputType}
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={placeholder}
                  required={effectiveRequired}
                  disabled={submitting}
                  className={`w-full px-3 py-2 text-xs border rounded-lg bg-canvas dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 pr-9 ${
                    alreadySaved
                      ? 'border-line dark:border-emerald-900 placeholder:text-accent-fg/60'
                      : 'border-line dark:border-slate-700'
                  }`}
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => setShowSecrets((s) => ({ ...s, [field.key]: !s[field.key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-tertiary hover:text-fg-secondary"
                  >
                    {showSecrets[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!isOAuth && (
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md disabled:opacity-50"
        >
          {submitting ? 'Connecting…' : submitLabel}
        </button>
      )}
    </form>
  );
}
