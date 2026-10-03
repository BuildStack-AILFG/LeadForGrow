'use client';

import { X } from 'lucide-react';

export default function DealCreateModal({ open, editing, form, onChange, onClose, onSubmit, stages = [], saving }) {
  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 text-dense border border-line rounded-lg bg-canvas text-fg placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-line focus:border-line-strong';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/40 p-4">
      <div className="bg-canvas rounded-lg w-full max-w-lg border border-line overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="text-title font-semibold text-fg">
              {editing ? 'Edit Deal' : 'New Deal'}
            </h2>
            <p className="text-meta text-fg-tertiary mt-0.5">
              {editing ? 'Update deal details and stage' : 'Add a deal to your pipeline'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-fg-tertiary hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-meta font-medium text-fg-tertiary mb-1.5 block">
              Deal title *
            </label>
            <input
              placeholder="e.g. CRM Setup — Acme Corp"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-meta font-medium text-fg-tertiary mb-1.5 block">Amount</label>
              <input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={(e) => onChange({ ...form, amount: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-meta font-medium text-fg-tertiary mb-1.5 block">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => onChange({ ...form, currency: e.target.value })}
                className={inputCls}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-meta font-medium text-fg-tertiary mb-1.5 block">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => onChange({ ...form, stage: e.target.value })}
                className={inputCls}
              >
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-meta font-medium text-fg-tertiary mb-1.5 block">Expected close</label>
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => onChange({ ...form, expectedCloseDate: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-line flex justify-end gap-2 bg-subtle">
          <button type="button" onClick={onClose} className="px-4 py-2 text-dense font-medium border border-line rounded-lg hover:bg-canvas">
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="px-4 py-2 text-dense font-medium text-white bg-accent hover:bg-[#1F2937] rounded-md disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create deal'}
          </button>
        </div>
      </div>
    </div>
  );
}
