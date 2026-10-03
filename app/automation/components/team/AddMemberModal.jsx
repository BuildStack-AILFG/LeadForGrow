'use client';

import { X, CheckCircle2 } from 'lucide-react';

export default function AddMemberModal({
  open,
  saving,
  member,
  onChange,
  createdInfo,
  onClose,
  onSubmit
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg shadow-modal overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-slate-800">
          <h3 className="text-base font-semibold text-fg dark:text-slate-50">
            {createdInfo ? 'Member created' : 'Add team member'}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdInfo ? (
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-lg bg-accent-subtle/80 dark:bg-emerald-950/20 border border-line/80 dark:border-emerald-900/50 text-center">
              <CheckCircle2 className="w-8 h-8 text-accent-fg mx-auto mb-2" />
              <p className="text-sm font-medium text-fg dark:text-slate-200 mb-3">Share login credentials</p>
              <div className="space-y-2 text-left">
                <div className="p-3 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-emerald-900/50">
                  <p className="text-meta text-fg-tertiary font-medium">Email</p>
                  <p className="text-sm font-semibold text-fg dark:text-slate-100">{createdInfo.userId?.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-emerald-900/50">
                  <p className="text-meta text-fg-tertiary font-medium">Password</p>
                  <p className="text-sm font-semibold text-fg dark:text-slate-100 font-mono">{createdInfo.password}</p>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="w-full py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg">
              Done
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
            className="p-5 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">First name</label>
                <input
                  required
                  value={member.firstName}
                  onChange={(e) => onChange({ ...member, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Last name</label>
                <input
                  required
                  value={member.lastName}
                  onChange={(e) => onChange({ ...member, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Email</label>
              <input
                required
                type="email"
                value={member.email}
                onChange={(e) => onChange({ ...member, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Login password</label>
              <input
                type="text"
                value={member.password}
                onChange={(e) => onChange({ ...member, password: e.target.value })}
                placeholder="Set password for this member (auto-generated if empty)"
                className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800"
              />
              <p className="mt-1 text-meta text-fg-tertiary">Share this email and password so they can log in at /user/register?mode=login</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1">Phone</label>
              <input
                type="tel"
                value={member.phone}
                onChange={(e) => onChange({ ...member, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-line dark:border-slate-700 rounded-lg bg-subtle dark:bg-slate-800"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-fg-secondary bg-muted dark:bg-slate-800 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg disabled:opacity-50">
                {saving ? 'Adding…' : 'Add member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
