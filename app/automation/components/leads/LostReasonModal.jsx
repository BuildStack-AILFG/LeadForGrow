'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { LOST_REASONS, UNQUALIFIED_REASONS } from '@/lib/crm/crmSettings';

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';

export default function LostReasonModal({ open, leadName, entityName, variant = 'lost', onConfirm, onCancel, saving }) {
  const name = entityName || leadName || 'Deal';
  const reasons = variant === 'unqualified' ? UNQUALIFIED_REASONS : LOST_REASONS;
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setReason('');
      setComments('');
    }
  }, [open, variant]);

  if (!open || !mounted) return null;

  const isOther = reason === 'other';
  const canSubmit = reason && (!isOther || comments.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm({
      reason,
      comments: comments.trim() || undefined,
    });
  };

  const title = variant === 'unqualified' ? 'Mark as Unqualified' : 'Mark as Lost';
  const submitLabel = variant === 'unqualified' ? 'Mark as Unqualified' : 'Mark as Lost';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={saving ? undefined : onCancel} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{name}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {variant === 'unqualified'
              ? 'Select why this lead is not a fit. This helps improve lead quality and reporting.'
              : 'Select why this lead was lost. A reason is required for pipeline reporting.'}
          </p>
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reason *</legend>
            <div className="space-y-1.5">
              {reasons.map((r) => (
                <label
                  key={r.key}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    reason === r.key
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="lostReason"
                    value={r.key}
                    checked={reason === r.key}
                    onChange={() => setReason(r.key)}
                    className="text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-800 dark:text-slate-200">{r.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isOther ? 'Details *' : 'Additional notes'}
            </label>
            <textarea
              rows={3}
              className={`${inputCls} mt-1 resize-none`}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={isOther ? 'Describe the reason…' : 'Optional context for your team'}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
