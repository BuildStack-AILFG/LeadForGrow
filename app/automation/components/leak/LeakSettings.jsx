'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const label = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5';
const input = 'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 dark:text-white';
const card = 'rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5';

export default function LeakSettings({ settings, onSave, onScan }) {
  const [form, setForm] = useState(settings);
  const [recipients, setRecipients] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    setForm(settings);
    setRecipients((settings?.digest?.recipients || []).join(', '));
  }, [settings]);

  if (!form) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setBh = (k, v) => setForm((f) => ({ ...f, businessHours: { ...f.businessHours, [k]: v } }));
  const num = (v) => (v === '' ? '' : Number(v));

  const save = async (patch) => {
    setSaving(true);
    try {
      await onSave(patch || {
        firstReplySlaMinutes: form.firstReplySlaMinutes,
        waitingSlaHours: form.waitingSlaHours,
        followUpGraceHours: form.followUpGraceHours,
        stallDays: form.stallDays,
        minAttemptsBeforeLost: form.minAttemptsBeforeLost,
        businessHours: form.businessHours,
        avgDealValue: form.avgDealValue || 0,
        conversionPct: form.conversionPct || 0,
        holdoutPct: form.holdoutPct,
        digest: { enabled: form.digest.enabled, recipients: recipients.split(/[,\s]+/).filter(Boolean) },
      });
    } catch (e) {
      // the hook already shows the error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <section className={`${card} flex flex-wrap items-center gap-4`}>
        <div className="flex-1 min-w-[220px]">
          <p className="font-semibold text-slate-900 dark:text-white">Leak Radar is {form.enabled ? 'on' : 'off'}</p>
          <p className="text-sm text-slate-500">
            {form.lastScanAt ? `Last checked ${new Date(form.lastScanAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}. Checks every 15 minutes.` : 'Checks every 15 minutes once it is on.'}
          </p>
        </div>
        {form.enabled && (
          <button type="button" disabled={scanning} onClick={async () => { setScanning(true); try { await onScan(); } finally { setScanning(false); } }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} /> Check now
          </button>
        )}
        <button type="button" disabled={saving} onClick={() => save({ enabled: !form.enabled })} className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${form.enabled ? 'border border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}>
          {form.enabled ? 'Turn off' : 'Turn on'}
        </button>
      </section>

      <section className={card}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Targets</h3>
        <p className="text-xs text-slate-500 mb-4">When an enquiry counts as slipping. Counted in business hours.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field id="sla" text="First reply within (minutes)" value={form.firstReplySlaMinutes} onChange={(v) => set('firstReplySlaMinutes', num(v))} />
          <Field id="wait" text="Answer a waiting customer within (hours)" value={form.waitingSlaHours} onChange={(v) => set('waitingSlaHours', num(v))} step="0.5" />
          <Field id="grace" text="Follow-up overdue after (hours)" value={form.followUpGraceHours} onChange={(v) => set('followUpGraceHours', num(v))} />
          <Field id="stall" text="Gone quiet after (days)" value={form.stallDays} onChange={(v) => set('stallDays', num(v))} />
          <Field id="attempts" text="Attempts before marking lost" value={form.minAttemptsBeforeLost} onChange={(v) => set('minAttemptsBeforeLost', num(v))} />
        </div>
      </section>

      <section className={card}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Business hours (IST)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input aria-label="Opens at hour" type="number" min={0} max={23} className={`${input} w-20`} value={form.businessHours.startHour} onChange={(e) => setBh('startHour', num(e.target.value))} />
          <span className="text-sm text-slate-500">:00 to</span>
          <input aria-label="Closes at hour" type="number" min={1} max={24} className={`${input} w-20`} value={form.businessHours.endHour} onChange={(e) => setBh('endHour', num(e.target.value))} />
          <span className="text-sm text-slate-500">:00</span>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 ml-2">
            <input type="checkbox" checked={form.businessHours.enabled} onChange={(e) => setBh('enabled', e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            Only count business hours
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d, i) => {
            const on = form.businessHours.days.includes(i);
            return (
              <button key={d} type="button" aria-pressed={on} onClick={() => setBh('days', on ? form.businessHours.days.filter((x) => x !== i) : [...form.businessHours.days, i])} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                {d}
              </button>
            );
          })}
        </div>
      </section>

      <section className={card}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Value at risk</h3>
        <p className="text-xs text-slate-500 mb-4">Optional. With these, Leak Radar shows a rough rupee figure for open leaks, clearly marked as an estimate.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field id="deal" text="Average deal value (₹)" value={form.avgDealValue} onChange={(v) => set('avgDealValue', num(v))} />
          <Field id="conv" text="Share of enquiries that usually buy (%)" value={form.conversionPct} onChange={(v) => set('conversionPct', num(v))} />
        </div>
      </section>

      <section className={card}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Comparison group</h3>
        <p className="text-xs text-slate-500 mb-4">
          This share of leaks is picked at random and not shown, so the Recovery Ledger can prove what Leak Radar changed. Your team still sees those customers in the inbox. Set 0 to see every leak.
        </p>
        <div className="flex items-center gap-3">
          <input aria-label="Comparison group percent" type="range" min={0} max={50} step={5} value={form.holdoutPct} onChange={(e) => set('holdoutPct', Number(e.target.value))} className="flex-1 accent-teal-600" />
          <span className="w-12 text-right text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">{form.holdoutPct}%</span>
        </div>
      </section>

      <section className={card}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily brief</h3>
        <p className="text-xs text-slate-500 mb-4">Five lines by email every morning after 8:00: what slipped, what's at risk, what was handled, who needs a hand, and where to start.</p>
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 mb-3">
          <input type="checkbox" checked={form.digest.enabled} onChange={(e) => set('digest', { ...form.digest, enabled: e.target.checked })} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
          Send the daily brief
        </label>
        <label className={label} htmlFor="leak-recipients">Send to (up to 5, comma separated; empty = the business owner)</label>
        <input id="leak-recipients" className={input} value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="owner@yourbusiness.com" />
      </section>

      <div className="flex justify-end">
        <button type="button" disabled={saving} onClick={() => save()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
        </button>
      </div>
    </div>
  );
}

function Field({ id, text, value, onChange, step }) {
  return (
    <div>
      <label className={label} htmlFor={`ls-${id}`}>{text}</label>
      <input id={`ls-${id}`} type="number" min={0} step={step} className={input} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
