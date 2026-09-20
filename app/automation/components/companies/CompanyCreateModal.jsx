'use client';

import { X } from 'lucide-react';
import { INDUSTRIES, COMPANY_STATUSES, EMPTY_FORM } from './constants';

export default function CompanyCreateModal({ open, form, onChange, onClose, onSubmit, saving, teamMembers = [] }) {
  if (!open) return null;

  const inputCls = 'w-full px-3 py-2 text-[13px] border border-[#E5E7EB] dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#101828]/10 focus:border-[#D0D5DD] dark:focus:border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/40 dark:bg-slate-700 backdrop-blur-[2px] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_20px_40px_rgba(16,24,40,0.14)] w-full max-w-lg border border-[#E5E7EB] dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] dark:border-slate-700">
          <div>
            <h2 className="text-[16px] font-semibold text-[#101828] dark:text-slate-100">Add Company</h2>
            <p className="text-[12px] text-[#667085] dark:text-slate-300 mt-0.5">Create a new business account</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[#98A2B3] dark:text-slate-400 hover:bg-[#F2F4F7] dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <input placeholder="Company name *" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className={inputCls} />
          <select value={form.industry} onChange={(e) => onChange({ ...form, industry: e.target.value })} className={inputCls}>
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={form.status || 'prospect'} onChange={(e) => onChange({ ...form, status: e.target.value })} className={inputCls}>
            {COMPANY_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <input placeholder="Website" value={form.website} onChange={(e) => onChange({ ...form, website: e.target.value })} className={inputCls} />
          <input placeholder="Email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} className={inputCls} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} className={inputCls} />
          <input placeholder="GST Number" value={form.gstNumber || ''} onChange={(e) => onChange({ ...form, gstNumber: e.target.value })} className={inputCls} />
          <textarea placeholder="Description" rows={3} value={form.description || ''} onChange={(e) => onChange({ ...form, description: e.target.value })} className={inputCls} />
        </div>

        <div className="px-5 py-4 border-t border-[#E5E7EB] dark:border-slate-700 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-medium border border-[#E5E7EB] dark:border-slate-700 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-slate-800">Cancel</button>
          <button type="button" onClick={onSubmit} disabled={saving} className="px-4 py-2 text-[13px] font-semibold text-white bg-[#101828] dark:bg-slate-700 hover:bg-[#1F2937] rounded-lg disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Company'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { EMPTY_FORM };
