'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Loader2, Save, Building2, Phone, Mail, MapPin, Hash, Globe,
  ImagePlus, ImageIcon, Receipt,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

/**
 * /automation/settings/bill-header
 *
 * Single place to set the business's customer-facing info: logo, name,
 * phone, email, address, website, GSTIN. Every bill PDF reads from these
 * fields — set once, applied everywhere. Also drives the header block on
 * future customer-facing docs (quotes, receipts).
 */
export default function BillHeaderSettingsPage() {
  const confirm = useConfirm();
  const [form, setForm] = useState({
    businessName: '', phone: '', email: '', address: '', gstin: '', website: '',
    logo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/business/bill-header');
        const data = await res.json();
        if (data.success) setForm((f) => ({ ...f, ...(data.data || {}) }));
      } catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.businessName?.trim()) return toast.error('Business name is required');
    setSaving(true);
    try {
      const res = await authFetch('/api/business/bill-header', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { toast.success('Bill header saved — will show on every bill'); setForm((f) => ({ ...f, ...data.data })); }
      else toast.error(data.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleLogoFile = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return toast.error('PNG, JPG or WebP only');
    if (file.size > 2 * 1024 * 1024) return toast.error('Max 2 MB');
    setLogoBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authFetch('/api/business/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setForm((f) => ({ ...f, logo: data.data.logo })); toast.success('Logo updated'); }
      else toast.error(data.error || 'Upload failed');
    } finally { setLogoBusy(false); }
  };

  const handleLogoRemove = async () => {
    if (!(await confirm({ title: 'Remove logo', message: 'Remove your logo? Bills will show your business name only.', confirmLabel: 'Remove', danger: true }))) return;
    setLogoBusy(true);
    try {
      await authFetch('/api/business/logo', { method: 'DELETE' });
      setForm((f) => ({ ...f, logo: '' }));
      toast.success('Logo removed');
    } finally { setLogoBusy(false); }
  };

  if (loading) {
    return <div className="min-h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950 p-5">
      <div className="max-w-3xl mx-auto">
        <Link href="/automation/bills" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to bills
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-slate-500" /> Bill header settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">Set your business info once — it appears on every bill PDF you send.</p>
        </div>

        {/* Logo card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Logo</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
              {form.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo} alt="Business logo" className="w-full h-full object-contain" />
              ) : <ImageIcon className="w-7 h-7 text-slate-300" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                  {logoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {form.logo ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                         onChange={(e) => handleLogoFile(e.target.files?.[0])} disabled={logoBusy} />
                </label>
                {form.logo && (
                  <button type="button" onClick={handleLogoRemove} disabled={logoBusy}
                          className="text-xs text-slate-500 hover:text-red-600">Remove</button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">PNG / JPG / WebP · max 2 MB · appears top-left of every bill</p>
            </div>
          </div>
        </div>

        {/* Business info card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Business info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={Building2} label="Business name *" value={form.businessName}
                   onChange={(v) => setForm({ ...form, businessName: v })} placeholder="Your business name" />
            <Field icon={Globe} label="Website" value={form.website}
                   onChange={(v) => setForm({ ...form, website: v })} placeholder="yourbusiness.com" />
            <Field icon={Phone} label="Phone" value={form.phone}
                   onChange={(v) => setForm({ ...form, phone: v })} placeholder="+91 98765 43210" />
            <Field icon={Mail} label="Email" value={form.email}
                   onChange={(v) => setForm({ ...form, email: v })} placeholder="hello@yourbusiness.com" type="email" />
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                        rows={2} maxLength={300}
                        placeholder="Your full business address"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none" />
              <p className="text-[10px] text-slate-400 mt-1 text-right">{form.address.length}/300</p>
            </div>
            {/* GSTIN placeholder uses the official example from cbic-gst.gov.in
                docs — syntactically valid but obviously fake ("AAAAA" / "0000")
                so it never gets mistaken for a real business's number. */}
            <Field icon={Hash} label="GSTIN (optional, prints on every bill)" value={form.gstin}
                   onChange={(v) => setForm({ ...form, gstin: v.toUpperCase() })} placeholder="22AAAAA0000A1Z5" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save bill header
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
             className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
    </div>
  );
}
