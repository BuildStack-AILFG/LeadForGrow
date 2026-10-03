'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent';

export default function QualifiedSummaryModal({ open, leadName, onConfirm, onCancel, saving }) {
  const [form, setForm] = useState({
    estimatedBudget: '',
    expectedTimeline: '',
    requirements: '',
    decisionMaker: '',
    nextFollowUpAt: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setForm({
        estimatedBudget: '',
        expectedTimeline: '',
        requirements: '',
        decisionMaker: '',
        nextFollowUpAt: '',
      });
    }
  }, [open]);

  if (!open || !mounted) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const budget = Number(form.estimatedBudget);
    if (!form.estimatedBudget.trim() || Number.isNaN(budget) || budget <= 0) return;
    onConfirm({
      dealAmount: budget,
      expectedTimeline: form.expectedTimeline.trim(),
      requirements: form.requirements.trim(),
      decisionMaker: form.decisionMaker.trim(),
      nextFollowUpAt: form.nextFollowUpAt || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={saving ? undefined : onCancel} />
      <div className="relative w-full max-w-md bg-canvas dark:bg-slate-900 rounded-lg shadow-modal border border-line dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-slate-800 sticky top-0 bg-canvas dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-semibold text-fg dark:text-slate-100">Qualification Summary</h3>
            <p className="text-xs text-fg-tertiary mt-0.5">{leadName || 'Lead'}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="p-1.5 rounded-md text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-50">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-xs text-fg-tertiary">
            Capture qualification details before marking this lead as Qualified. Use <strong>Convert to Deal</strong> when ready to move to the sales pipeline.
          </p>
          <div>
            <label className="text-xs font-medium text-fg-tertiary">Estimated Budget (INR) *</label>
            <input
              type="number"
              min="1"
              step="any"
              autoFocus
              required
              className={`${inputCls} mt-1`}
              value={form.estimatedBudget}
              onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
              placeholder="e.g. 50000"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fg-tertiary">Expected Timeline</label>
            <input
              className={`${inputCls} mt-1`}
              value={form.expectedTimeline}
              onChange={(e) => setForm({ ...form, expectedTimeline: e.target.value })}
              placeholder="e.g. Close within 30 days"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fg-tertiary">Requirements</label>
            <textarea
              rows={2}
              className={`${inputCls} mt-1 resize-none`}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="What does the prospect need?"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fg-tertiary">Decision Maker</label>
            <input
              className={`${inputCls} mt-1`}
              value={form.decisionMaker}
              onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })}
              placeholder="Name and role"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-fg-tertiary">Next Follow-up Date</label>
            <input
              type="datetime-local"
              className={`${inputCls} mt-1`}
              value={form.nextFollowUpAt}
              onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-line dark:border-slate-700 hover:bg-subtle dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.estimatedBudget.trim() || Number(form.estimatedBudget) <= 0}
              className="flex-1 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Mark as Qualified'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
