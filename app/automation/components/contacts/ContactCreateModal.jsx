'use client';

import { X } from 'lucide-react';
import { CONTACT_TYPES, EMPTY_FORM } from './constants';

export default function ContactCreateModal({ open, form, onChange, onClose, onSubmit, saving, teamMembers = [], companies = [] }) {
  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-[#E5E7EB] dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#101828]/10 focus:border-[#D0D5DD] dark:focus:border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/40 dark:bg-slate-700 backdrop-blur-[2px] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_20px_40px_rgba(16,24,40,0.14)] w-full max-w-lg border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-slate-700">
          <div>
            <h2 className="text-[16px] font-semibold text-[#101828] dark:text-slate-100">Add Contact</h2>
            <p className="text-[12px] text-[#667085] dark:text-slate-300 mt-0.5">Create a new personal or business contact</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#98A2B3] dark:text-slate-400 hover:bg-[#F2F4F7] dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="First name *" value={form.firstName} onChange={(e) => onChange({ ...form, firstName: e.target.value })} className={inputCls} />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => onChange({ ...form, lastName: e.target.value })} className={inputCls} />
          </div>
          <select value={form.type || 'personal'} onChange={(e) => onChange({ ...form, type: e.target.value })} className={inputCls}>
            {CONTACT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className={inputCls} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} className={inputCls} />
          <input placeholder="Job title" value={form.jobTitle} onChange={(e) => onChange({ ...form, jobTitle: e.target.value })} className={inputCls} />
          {companies.length > 0 && (
            <select value={form.companyId || ''} onChange={(e) => onChange({ ...form, companyId: e.target.value })} className={inputCls}>
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          )}
          {teamMembers.length > 0 && (
            <select value={form.ownerId || ''} onChange={(e) => onChange({ ...form, ownerId: e.target.value })} className={inputCls}>
              <option value="">Default owner (you)</option>
              {(teamMembers || []).map((m) => {
                const id = m.userId?._id || m.userId || m._id;
                const label = [m.userId?.firstName || m.firstName, m.userId?.lastName || m.lastName].filter(Boolean).join(' ') || m.userId?.email || m.email;
                return <option key={id} value={id}>{label}</option>;
              })}
            </select>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#E5E7EB] dark:border-slate-700 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium border border-[#E5E7EB] dark:border-slate-700 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-slate-800">Cancel</button>
          <button type="button" onClick={onSubmit} disabled={saving} className="px-4 py-2 text-[13px] font-semibold text-white bg-[#101828] dark:bg-slate-700 hover:bg-[#1F2937] rounded-lg disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { EMPTY_FORM };
