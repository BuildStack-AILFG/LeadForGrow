'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';

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
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Schedule demo</h3>
          <button type="button" onClick={onCancel} disabled={saving} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Meeting details for <span className="font-medium">{name}</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Date *</label>
              <input type="date" required className={`${inputCls} mt-1`} value={form.meetingDate} onChange={(e) => setForm({ ...form, meetingDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Time *</label>
              <input type="time" required className={`${inputCls} mt-1`} value={form.meetingTime} onChange={(e) => setForm({ ...form, meetingTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Duration (minutes)</label>
            <input type="number" min="15" step="15" className={`${inputCls} mt-1`} value={form.meetingDuration} onChange={(e) => setForm({ ...form, meetingDuration: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500">Platform</label>
            <select className={`${inputCls} mt-1`} value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {form.meetingPlatform === 'custom' && (
            <div>
              <label className="text-xs font-medium text-slate-500">Meeting link</label>
              <input type="url" placeholder="https://..." className={`${inputCls} mt-1`} value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} disabled={saving} className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Schedule & notify'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
