'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * In-app replacement for window.confirm()/window.prompt().
 *
 * Native dialogs block the whole tab's JS thread — they can't be styled,
 * and they make the page untestable by browser automation. This renders
 * the same "confirm" / "ask for one value" interaction as a normal modal.
 *
 * mode: 'confirm' — just a message + Cancel/Confirm.
 *       'prompt'  — single-line text input + Cancel/Confirm.
 *       'textarea' — multi-line text input + Cancel/Confirm.
 *
 * onConfirm receives the entered value for 'prompt'/'textarea' (trimmed,
 * '' if left blank), or nothing for 'confirm'.
 */
export default function ConfirmDialog({
  open,
  mode = 'confirm',
  title,
  message,
  placeholder = '',
  defaultValue = '',
  required = false,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  saving = false,
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (open) setValue(defaultValue); }, [open, defaultValue]);

  if (!open || !mounted) return null;

  const isPrompt = mode === 'prompt' || mode === 'textarea';
  const canSubmit = !isPrompt || !required || value.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(isPrompt ? value.trim() : undefined);
  };

  const inputCls =
    'w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={saving ? undefined : onCancel} />
      <div className="relative w-full max-w-sm bg-canvas dark:bg-slate-900 rounded-lg shadow-modal border border-line dark:border-slate-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-slate-800">
          <h3 className="text-sm font-semibold text-fg dark:text-slate-100">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="p-1.5 rounded-md text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {message && <p className="text-sm text-fg-secondary dark:text-fg-tertiary">{message}</p>}
          {mode === 'prompt' && (
            <input
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className={inputCls}
            />
          )}
          {mode === 'textarea' && (
            <textarea
              autoFocus
              rows={3}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className={`${inputCls} resize-none`}
            />
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              style={danger ? { backgroundColor: '#b30000' } : undefined}
              className={`flex-1 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 ${
                danger ? 'hover:brightness-90' : 'bg-accent hover:bg-accent-hover'
              }`}
            >
              {saving ? 'Saving…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
