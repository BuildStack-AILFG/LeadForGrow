'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-canvas dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-focus focus:border-accent';

const PLATFORMS = [
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'custom', label: 'Custom Link' },
];

export default function DemoScheduledModal({ open, leadName, entityName, onConfirm, onCancel, saving }) {
  const name = entityName || leadName || 'this deal';
  const [form, setForm] = useState({
    meetingDate: '',
    meetingTime: '',
    meetingDuration: '30',
    meetingPlatform: 'google_meet',
    meetingLink: '',
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) {
      setForm({
        meetingDate: '',
        meetingTime: '',
        meetingDuration: '30',
        meetingPlatform: 'google_meet',
        meetingLink: '',
      });
    }
  }, [open]);

  if (!open || !mounted) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.meetingDate || !form.meetingTime) return;
    onConfirm({
      ...form,
      meetingDuration: `${form.meetingDuration} min`,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={saving ? undefined : onCancel} />
      <div className="relative w-full max-w-md bg-canvas dark:bg-slate-900 rounded-lg shadow-modal border border-line dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line dark:border-slate-800 sticky top-0 bg-canvas dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-fg dark:text-slate-100">Schedule demo</h3>
          <button type="button" onClick={onCancel} disabled={saving} className="p-1.5 rounded-md text-fg-tertiary dark:text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-sm text-fg-secondary dark:text-fg-tertiary">
            Meeting details for <span className="font-medium">{name}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Date *</label>
              <input type="date" required className={`${inputCls} mt-1`} value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Time *</label>
              <input type="time" required className={`${inputCls} mt-1`} value={form.meetingTime} onChange={(e) => setForm({ ...form, meetingTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Duration (minutes)</label>
            <input type="number" min="15" step="15" className={`${inputCls} mt-1`} value={form.meetingDuration} onChange={(e) => setForm({ ...form, meetingDuration: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Platform</label>
            <select className={`${inputCls} mt-1`} value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {form.meetingPlatform === 'custom' && (
            <div>
              <label className="text-xs font-medium text-fg-tertiary dark:text-fg-tertiary">Meeting link</label>
              <input type="url" placeholder="https://..." className={`${inputCls} mt-1`} value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-2 text-sm font-medium rounded-lg border border-line dark:border-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50">
              {saving ? 'Saving…' : 'Schedule & notify'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
