'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  Plus, Search, Receipt, Send, Download, CheckCircle2, XCircle, Trash2,
  ArrowLeft, Loader2, Copy, User, Phone, ChevronRight, ImagePlus, ImageIcon,
  Link2, CreditCard, ExternalLink,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import PageLoader from '../PageLoader';
import ConfirmDialog from '../shared/ConfirmDialog';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

/**
 * BillsWorkspace — list + editor + detail in a single component switched by
 * a URL query param. Keeps navigation snappy (no full-page reload between
 * list and editor) and lets us pre-fill the editor from chat / deal entry
 * points via /automation/bills?new=1&leadId=...&amount=....
 */
export default function BillsWorkspace() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get('view') || 'list';
  const billId = params.get('id') || null;
  const isNew = params.get('new') === '1';

  if (isNew) return <BillEditor onCancel={() => router.push('/automation/bills')} />;
  if (view === 'detail' && billId) return <BillDetail billId={billId} onBack={() => router.push('/automation/bills')} />;
  return <BillsList onNew={() => router.push('/automation/bills?new=1')} onOpen={(id) => router.push(`/automation/bills?view=detail&id=${id}`)} />;
}

// ── LIST ────────────────────────────────────────────────────────────────

function BillsList({ onNew, onOpen }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('search', search.trim());
      if (status !== 'all') qs.set('status', status);
      const res = await authFetch(`/api/automation/bills?${qs}`);
      const data = await res.json();
      if (data.success) setBills(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const summary = useMemo(() => {
    let total = 0, paid = 0, sent = 0, draft = 0;
    for (const b of bills) {
      total += Number(b.total || 0);
      if (b.status === 'paid') paid += Number(b.total || 0);
      if (b.status === 'sent') sent += Number(b.total || 0);
      if (b.status === 'draft') draft += 1;
    }
    return { total, paid, sent, draft };
  }, [bills]);

  if (loading && !bills.length) return <PageLoader label="Loading bills…" />;

  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950 p-5">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bills</h1>
            <p className="text-sm text-slate-500 mt-1">Send professional-looking bills to customers via WhatsApp.</p>
          </div>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow"
          >
            <Plus className="w-4 h-4" /> New bill
          </button>
        </div>

        <AutoPageIntro />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total billed"    value={`₹${summary.total.toLocaleString('en-IN')}`} tone="slate" />
          <StatCard label="Paid"            value={`₹${summary.paid.toLocaleString('en-IN')}`}  tone="emerald" />
          <StatCard label="Sent — awaiting" value={`₹${summary.sent.toLocaleString('en-IN')}`}  tone="amber" />
          <StatCard label="Drafts"          value={summary.draft}                                 tone="slate" />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by bill number, customer name, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
        </div>

        {bills.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No bills yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Create your first bill and send it directly to the customer on WhatsApp.</p>
            <button type="button" onClick={onNew} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" /> Create bill
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Bill #</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b._id}
                      onClick={() => onOpen(b._id)}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{b.billNumber}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{b.customerName}<div className="text-xs text-slate-400">{b.customerPhone}</div></td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">₹{Number(b.total).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusPill status={b.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-2 text-slate-300"><ChevronRight className="w-4 h-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EDITOR ─────────────────────────────────────────────────────────────

function BillEditor({ existingBill, onCancel, onSaved }) {
  const params = useSearchParams();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => {
    if (existingBill) return existingBill;
    return {
      customerName: params.get('name') || '',
      customerPhone: params.get('phone') || '',
      customerEmail: params.get('email') || '',
      leadId: params.get('leadId') || undefined,
      dealId: params.get('dealId') || undefined,
      lineItems: [
        { description: params.get('desc') || '', quantity: 1, rate: Number(params.get('amount')) || 0 },
      ],
      discount: 0,
      taxRate: 0,
      gstNumber: '',
      notes: '',
    };
  });

  const totals = useMemo(() => {
    const subtotal = (form.lineItems || []).reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
    const disc = Math.max(0, Math.min(Number(form.discount) || 0, subtotal));
    const afterDisc = subtotal - disc;
    const tax = afterDisc * ((Number(form.taxRate) || 0) / 100);
    return { subtotal, discount: disc, tax, total: afterDisc + tax };
  }, [form.lineItems, form.discount, form.taxRate]);

  const updateItem = (i, patch) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));
  };
  const addItem = () => setForm((f) => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, rate: 0 }] }));
  const removeItem = (i) => setForm((f) => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) }));

  const canSave = form.customerName.trim() && form.lineItems.some((it) => it.description.trim());

  const handleSave = async (thenSend = false) => {
    if (!canSave) return toast.error('Add customer name and at least one line item');
    setSaving(true);
    try {
      const res = await authFetch('/api/automation/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success(`Bill ${data.data.billNumber} saved`);
      if (thenSend) {
        router.push(`/automation/bills?view=detail&id=${data.data._id}&autoSend=1`);
      } else if (onSaved) {
        onSaved(data.data);
      } else {
        router.push(`/automation/bills?view=detail&id=${data.data._id}`);
      }
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950 p-5">
      <div className="max-w-4xl mx-auto">
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to bills
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">New bill</h2>
          <p className="text-xs text-slate-500 mb-5">The bill number is generated automatically when you save.</p>

          <BillHeaderPreview />

          <SectionLabel>Customer</SectionLabel>
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <TextField icon={User} placeholder="Customer name *" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} />
            <TextField icon={Phone} placeholder="WhatsApp phone (with country code)" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
          </div>

          <SectionLabel>Line items</SectionLabel>
          <div className="space-y-2 mb-2">
            {form.lineItems.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={it.description}
                  onChange={(e) => updateItem(i, { description: e.target.value })}
                  placeholder="Description (e.g. Sensor / Scanning / Labour)"
                  className="col-span-6 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  value={it.quantity}
                  onChange={(e) => updateItem(i, { quantity: e.target.value })}
                  placeholder="Qty"
                  className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right tabular-nums"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={it.rate}
                  onChange={(e) => updateItem(i, { rate: e.target.value })}
                  placeholder="Rate ₹"
                  className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right tabular-nums"
                />
                <div className="col-span-1 text-right text-sm tabular-nums font-medium">
                  ₹{((Number(it.quantity) || 0) * (Number(it.rate) || 0)).toLocaleString('en-IN')}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={form.lineItems.length === 1}
                  className="col-span-1 p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="text-xs font-semibold text-blue-600 hover:text-blue-700 mb-5">
            + Add another item
          </button>

          <div className="grid sm:grid-cols-2 gap-6 mb-5">
            <div>
              <SectionLabel>Adjustments</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Discount (₹)</label>
                  <input type="number" min="0" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
                         className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right tabular-nums" />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Tax %</label>
                  <input type="number" min="0" max="100" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                         className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-right tabular-nums" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-slate-500">GSTIN (optional, displays on PDF)</label>
                <input type="text" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                       className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
              </div>
            </div>
            <div>
              <SectionLabel>Totals</SectionLabel>
              <TotalsRow label="Subtotal" value={totals.subtotal} />
              {totals.discount > 0 && <TotalsRow label="Discount" value={-totals.discount} />}
              {(Number(form.taxRate) || 0) > 0 && <TotalsRow label={`Tax (${form.taxRate}%)`} value={totals.tax} />}
              <div className="border-t border-slate-200 dark:border-slate-800 mt-2 pt-2">
                <TotalsRow label="Total" value={totals.total} big />
              </div>
            </div>
          </div>

          <SectionLabel>Notes (optional)</SectionLabel>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Thanks for your business! Payment via UPI or cash on delivery."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mb-5"
          />

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleSave(false)} disabled={!canSave || saving}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save as draft'}
              </button>
              <button type="button" onClick={() => handleSave(true)} disabled={!canSave || saving || !form.customerPhone}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Save & send on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DETAIL ──────────────────────────────────────────────────────────────

function BillDetail({ billId, onBack }) {
  const params = useSearchParams();
  const router = useRouter();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/automation/bills/${billId}`);
      const data = await res.json();
      if (data.success) setBill(data.data);
      else toast.error(data.error || 'Failed to load bill');
    } catch { toast.error('Failed to load bill'); }
    finally { setLoading(false); }
  }, [billId]);

  useEffect(() => { load(); }, [load]);

  // Auto-send when arriving from Save & send flow
  useEffect(() => {
    if (params.get('autoSend') === '1' && bill && bill.status === 'draft') {
      handleSend();
      router.replace(`/automation/bills?view=detail&id=${billId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill?._id]);

  const handleSend = async () => {
    setBusy('send');
    try {
      const res = await authFetch(`/api/automation/bills/${billId}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { toast.success('Bill sent on WhatsApp'); load(); }
      else toast.error(data.error || 'Send failed');
    } finally { setBusy(''); }
  };
  const submitMarkPaid = async (note) => {
    setBusy('paid');
    try {
      const res = await authFetch(`/api/automation/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', paymentNote: note || '' }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Marked as paid'); setMarkPaidOpen(false); load(); }
      else toast.error(data.error || 'Failed');
    } finally { setBusy(''); }
  };
  const submitVoid = async () => {
    setBusy('void');
    try {
      const res = await authFetch(`/api/automation/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void' }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Voided'); setVoidOpen(false); load(); }
      else toast.error(data.error || 'Failed');
    } finally { setBusy(''); }
  };

  if (loading || !bill) return <PageLoader label="Loading bill…" />;

  return (
    <div className="min-h-full bg-[#f4f6fa] dark:bg-slate-950 p-5">
      <div className="max-w-3xl mx-auto">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to bills
        </button>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">Bill</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{bill.billNumber}</h1>
          </div>
          <StatusPill status={bill.status} big />
        </div>

        <div className="grid gap-2 mb-4">
          <div className="flex items-center gap-2">
            {bill.status === 'draft' && (
              <button type="button" onClick={handleSend} disabled={busy === 'send' || !bill.customerPhone}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">
                {busy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send on WhatsApp
              </button>
            )}
            {bill.status === 'sent' && (
              <button type="button" onClick={handleSend} disabled={busy === 'send'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold">
                {busy === 'send' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Resend
              </button>
            )}
            {bill.status !== 'paid' && bill.status !== 'void' && (
              <button type="button" onClick={() => setMarkPaidOpen(true)} disabled={busy === 'paid'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Mark as paid
              </button>
            )}
            <a href={`/api/automation/bills/${billId}/pdf`} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold">
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <PaymentLinkButton bill={bill} onUpdated={load} />
            {bill.status !== 'void' && bill.status !== 'paid' && (
              <button type="button" onClick={() => setVoidOpen(true)} disabled={busy === 'void'}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                <XCircle className="w-4 h-4" /> Void
              </button>
            )}
          </div>
          {bill.pdfUrl && (
            <div className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
              <span>PDF hosted at:</span>
              <a href={bill.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{bill.pdfUrl}</a>
              <button type="button" onClick={() => { navigator.clipboard.writeText(bill.pdfUrl); toast.success('Copied'); }}
                      className="text-slate-400 hover:text-slate-700"><Copy className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex justify-between text-sm mb-5">
            <div>
              <div className="text-xs text-slate-500 uppercase">Billed to</div>
              <div className="font-semibold text-slate-900 dark:text-white">{bill.customerName}</div>
              {bill.customerPhone && <div className="text-slate-500 text-xs">{bill.customerPhone}</div>}
              {bill.customerEmail && <div className="text-slate-500 text-xs">{bill.customerEmail}</div>}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase">Date</div>
              <div className="text-slate-700 dark:text-slate-300">{new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              {bill.sentAt && <div className="text-xs text-slate-500 mt-2">Sent {new Date(bill.sentAt).toLocaleString('en-IN')}</div>}
              {bill.paidAt && <div className="text-xs text-emerald-600 mt-1">Paid {new Date(bill.paidAt).toLocaleString('en-IN')}{bill.paymentNote ? ` · ${bill.paymentNote}` : ''}</div>}
            </div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2 w-16">Qty</th>
                <th className="text-right py-2 w-24">Rate</th>
                <th className="text-right py-2 w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.lineItems.map((it) => (
                <tr key={it._id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="py-2">{it.description}</td>
                  <td className="py-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="py-2 text-right tabular-nums">₹{Number(it.rate).toLocaleString('en-IN')}</td>
                  <td className="py-2 text-right tabular-nums font-medium">₹{Number(it.amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ml-auto w-64 space-y-1 text-sm">
            <TotalsRow label="Subtotal" value={bill.subtotal} />
            {bill.discount > 0 && <TotalsRow label="Discount" value={-bill.discount} />}
            {bill.taxRate > 0 && <TotalsRow label={`Tax (${bill.taxRate}%)`} value={bill.taxAmount} />}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-2"><TotalsRow label="Total" value={bill.total} big /></div>
          </div>

          {(bill.notes || bill.gstNumber) && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
              {bill.notes && <div><span className="font-semibold text-slate-700 dark:text-slate-400">Notes:</span> {bill.notes}</div>}
              {bill.gstNumber && <div><span className="font-semibold text-slate-700 dark:text-slate-400">GSTIN:</span> {bill.gstNumber}</div>}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={markPaidOpen}
        mode="prompt"
        title="Mark as paid"
        message="Payment note (e.g. UPI ref, Cash) — optional."
        placeholder="e.g. UPI ref 4xxxxx"
        confirmLabel="Mark as paid"
        saving={busy === 'paid'}
        onConfirm={submitMarkPaid}
        onCancel={() => setMarkPaidOpen(false)}
      />
      <ConfirmDialog
        open={voidOpen}
        mode="confirm"
        title="Void this bill?"
        message="It stays in history but is marked cancelled."
        confirmLabel="Void bill"
        danger
        saving={busy === 'void'}
        onConfirm={submitVoid}
        onCancel={() => setVoidOpen(false)}
      />
    </div>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────

function StatCard({ label, value, tone = 'slate' }) {
  const toneMap = {
    slate:   'text-slate-900 dark:text-slate-100',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    amber:   'text-amber-700 dark:text-amber-300',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-bold tabular-nums mt-0.5 ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status, big = false }) {
  const map = {
    draft:  { label: 'Draft',  cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    sent:   { label: 'Sent',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
    viewed: { label: 'Viewed', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' },
    paid:   { label: 'Paid',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    void:   { label: 'Void',   cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  };
  const m = map[status] || map.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded uppercase tracking-wide font-semibold ${m.cls} ${big ? 'text-xs px-3 py-1' : 'text-[10px]'}`}>
      {m.label}
    </span>
  );
}

function TotalsRow({ label, value, big = false }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'text-base font-bold' : 'text-sm'}`}>
      <span className={big ? 'text-slate-900 dark:text-white' : 'text-slate-500'}>{label}</span>
      <span className="tabular-nums">{value < 0 ? '- ' : ''}₹{Math.abs(Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{children}</div>;
}

/**
 * PaymentLinkButton — Send a Razorpay Payment Link for a bill.
 *
 * Three states:
 *   1. Razorpay not connected → button opens the Connect Razorpay modal
 *   2. Connected, no active link on bill → button says "Send payment link"
 *   3. Link already exists → button says "Copy payment link" + shows status
 *
 * All state is fetched lazily so the button doesn't hammer /razorpay-credentials
 * on every bill-detail render.
 */
function PaymentLinkButton({ bill, onUpdated }) {
  const [rzp, setRzp] = useState(null);         // { enabled, keyId, hasSecret } | null
  const [loading, setLoading] = useState(false);
  const [showConnect, setShowConnect] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/business/razorpay-credentials');
        const data = await res.json();
        if (data.success) setRzp(data.data);
      } catch { setRzp({ enabled: false }); }
    })();
  }, []);

  const link = bill.paymentLink?.shortUrl;
  const linkStatus = bill.paymentLink?.status;

  const handleSendLink = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/automation/bills/${bill._id}/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendOnWhatsApp: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.whatsapp?.sent ? 'Payment link created + sent on WhatsApp' : 'Payment link created');
        onUpdated?.();
      } else {
        toast.error(data.error || 'Failed to create link');
      }
    } finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Payment link copied');
  };

  if (rzp === null) {
    return (
      <button disabled className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold opacity-50">
        <Loader2 className="w-4 h-4 animate-spin" /> Payment link
      </button>
    );
  }
  if (!rzp.enabled) {
    return (
      <>
        <button type="button" onClick={() => setShowConnect(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-100">
          <CreditCard className="w-4 h-4" /> Connect Razorpay to send a payment link
        </button>
        {showConnect && <ConnectRazorpayModal onClose={() => setShowConnect(false)} onConnected={() => { setShowConnect(false); setRzp({ enabled: true }); }} />}
      </>
    );
  }
  if (link) {
    return (
      <div className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
        <Link2 className="w-4 h-4 text-emerald-600" />
        <a href={link} target="_blank" rel="noopener noreferrer"
           className="text-sm font-medium text-emerald-700 hover:underline flex items-center gap-1 max-w-[220px] truncate">
          {link} <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
        <button type="button" onClick={handleCopy} className="p-1 text-slate-400 hover:text-slate-700" title="Copy link">
          <Copy className="w-3.5 h-3.5" />
        </button>
        {linkStatus && (
          <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
            linkStatus === 'paid' ? 'bg-emerald-100 text-emerald-700'
              : linkStatus === 'cancelled' || linkStatus === 'expired' ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-600'
          }`}>{linkStatus}</span>
        )}
      </div>
    );
  }
  return (
    <button type="button" onClick={handleSendLink} disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
      Send payment link on WhatsApp
    </button>
  );
}

function ConnectRazorpayModal({ onClose, onConnected }) {
  const [form, setForm] = useState({ keyId: '', keySecret: '', webhookSecret: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.keyId.trim() || !form.keySecret.trim()) {
      return toast.error('Both Key ID and Key Secret are required');
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/business/razorpay-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { toast.success('Razorpay connected'); onConnected?.(); }
      else toast.error(data.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Connect your Razorpay account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Money goes directly to your bank account. LeadForGrow never holds funds.
            </p>
          </div>
        </div>

        <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 mb-4 pl-5 list-decimal">
          <li>Open <a href="https://dashboard.razorpay.com/app/website-app-settings/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Razorpay → Settings → API Keys</a></li>
          <li>Click <strong>Generate Key</strong> and copy the Key ID + Key Secret</li>
          <li>Paste them below</li>
        </ol>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Key ID</label>
            <input value={form.keyId} onChange={(e) => setForm({ ...form, keyId: e.target.value })}
                   placeholder="rzp_live_XXXXXXXXXXXX"
                   className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Key Secret</label>
            <input type="password" value={form.keySecret} onChange={(e) => setForm({ ...form, keySecret: e.target.value })}
                   placeholder="Never shown again — kept encrypted"
                   className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Webhook Secret <span className="text-slate-400 font-normal">(optional — enables auto-mark-paid)</span></label>
            <input type="password" value={form.webhookSecret} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
                   placeholder="From Razorpay → Webhooks"
                   className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono" />
            <p className="text-[10px] text-slate-500 mt-1">
              Add a webhook in Razorpay dashboard pointing to <code className="text-[10px]">/api/webhooks/razorpay</code> with events: <code>payment_link.paid</code>, <code>payment_link.expired</code>, <code>payment_link.cancelled</code>. Paste the shared secret here so LFG can verify events.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Connect Razorpay
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * BillHeaderPreview — read-only summary of the business info that will
 * print on this bill's PDF. Set once in Settings → Bill Header, applies to
 * every bill.
 *
 * When missing key fields (no logo, no phone / email), shows an inline
 * nudge to complete the header setup. Always links to the settings page
 * so the owner can update without leaving via nav.
 */
function BillHeaderPreview() {
  const [header, setHeader] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/business/bill-header');
        const data = await res.json();
        if (data.success) setHeader(data.data || {});
      } catch { setHeader({}); }
    })();
  }, []);

  if (header === null) {
    return (
      <div className="mb-5 h-16 rounded-xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
    );
  }

  const missing = [];
  if (!header.logo) missing.push('logo');
  if (!header.phone && !header.email) missing.push('contact');
  if (!header.address) missing.push('address');

  return (
    <div className="mb-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
          {header.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={header.logo} alt="Business logo" className="w-full h-full object-contain" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {header.businessName || 'Business name not set'}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">Bill header</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {[header.phone, header.email, header.address].filter(Boolean).join(' · ') || 'Add your phone, email, and address to print on every bill'}
          </div>
        </div>
        <Link href="/automation/settings/bill-header"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-300 shrink-0">
          {missing.length > 0 ? 'Complete setup' : 'Edit'}
        </Link>
      </div>
      {missing.length > 0 && (
        <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
          Missing: {missing.join(', ')} — bills will still generate but header will look incomplete
        </div>
      )}
    </div>
  );
}

function TextField({ icon: Icon, placeholder, value, onChange }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm`}
      />
    </div>
  );
}
