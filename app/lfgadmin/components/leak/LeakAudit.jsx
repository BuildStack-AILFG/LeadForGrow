'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  Droplets, Building2, FileSpreadsheet, Upload, Play, Loader2, ShieldCheck,
  SlidersHorizontal, ChevronDown, Lock, AlertTriangle,
} from 'lucide-react';
import { buildLeakReport, DEFAULT_LEAK_CONFIG, RULES } from '@/lib/leak/rules';
import { CSV_FIELDS, guessMapping, availableRules, rowsToRecords } from '@/lib/leak/csvSource';
import LeakReport from './LeakReport';

const PERIODS = [30, 60, 90, 180];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CSV_ROWS = 50000;

async function leakApi(password, payload) {
  const res = await fetch('/api/admin/leak-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

const card = 'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
const label = 'block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5';
const input = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500';

export default function LeakAudit({ password }) {
  const [source, setSource] = useState('client');
  const [businesses, setBusinesses] = useState([]);
  const [businessId, setBusinessId] = useState('');
  const [days, setDays] = useState(60);
  const [consent, setConsent] = useState(false);

  const [csv, setCsv] = useState(null); // { fileName, headers, rows }
  const [mapping, setMapping] = useState({});
  const [dateOrder, setDateOrder] = useState('auto');
  const fileRef = useRef(null);

  const [config, setConfig] = useState(DEFAULT_LEAK_CONFIG);
  const [showSettings, setShowSettings] = useState(false);

  const [dataset, setDataset] = useState(null); // { label, kind, records, available, notes, generatedAt, meta }
  const [dismissed, setDismissed] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    leakApi(password, { action: 'businesses' })
      .then((rows) => setBusinesses(rows || []))
      .catch((e) => setError(e.message));
  }, [password]);

  const report = useMemo(() => {
    if (!dataset) return null;
    return buildLeakReport(dataset.records, config, new Date(dataset.generatedAt), {
      available: dataset.available,
      dismissed,
    });
  }, [dataset, config, dismissed]);

  const runClient = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await leakApi(password, { action: 'run', businessId, days });
      setDismissed(new Set());
      setDataset({
        kind: 'client',
        label: data.business?.name || 'Business',
        records: data.records || [],
        available: undefined, // our own data supports every rule
        notes: data.notes || [],
        meta: data.meta,
        generatedAt: data.meta?.generatedAt || new Date().toISOString(),
        periodDays: days,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onFile = (file) => {
    if (!file) return;
    setError('');
    setDataset(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: ({ data, meta }) => {
        const headers = (meta.fields || []).filter(Boolean);
        if (!headers.length || !data.length) {
          setError('That file has no rows. Export the leads list as CSV with a header row.');
          return;
        }
        setCsv({ fileName: file.name, headers, rows: data.slice(0, MAX_CSV_ROWS), truncated: data.length > MAX_CSV_ROWS });
        setMapping(guessMapping(headers));
      },
      error: (err) => setError(`Couldn't read the file: ${err.message}`),
    });
  };

  const runCsv = () => {
    setError('');
    if (!mapping.createdAt) {
      setError('Pick the column that holds the lead created date.');
      return;
    }
    const { records, skipped, dateOrder: usedOrder } = rowsToRecords(csv.rows, mapping, {
      dateOrder,
      tzOffsetMinutes: config.businessHours.tzOffsetMinutes,
    });
    if (!records.length) {
      setError(`No row had a readable created date in "${mapping.createdAt}". Try another date format.`);
      return;
    }
    const available = availableRules(mapping);
    const notes = [];
    if (skipped) notes.push(`${skipped} row${skipped === 1 ? '' : 's'} skipped: no readable created date.`);
    if (csv.truncated) notes.push(`Only the first ${MAX_CSV_ROWS.toLocaleString('en-IN')} rows were audited.`);
    notes.push(`Dates read as ${usedOrder === 'DMY' ? 'day-month-year' : usedOrder === 'MDY' ? 'month-day-year' : 'year-month-day'}.`);
    const missing = Object.keys(RULES).filter((r) => !available.includes(r));
    if (missing.length) notes.push(`Not checked for lack of a column: ${missing.map((r) => `${r} ${RULES[r].label}`).join(', ')}.`);
    notes.push('This file was processed in your browser and was not uploaded.');
    setDismissed(new Set());
    setDataset({
      kind: 'csv',
      label: csv.fileName.replace(/\.csv$/i, ''),
      records,
      available,
      notes,
      generatedAt: new Date().toISOString(),
    });
  };

  const toggleDismissed = (id) => setDismissed((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const setCfg = (key, value) => setConfig((c) => ({ ...c, [key]: value }));
  const setBh = (key, value) => setConfig((c) => ({ ...c, businessHours: { ...c.businessHours, [key]: value } }));

  const canRunClient = businessId && consent && !loading;
  const csvRules = csv ? availableRules(mapping) : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start gap-3 print:hidden">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leak Audit</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Find the enquiries a business let slip, with the reason for each. Read-only: nothing is sent or changed.
          </p>
        </div>
      </div>

      <div className={`${card} p-5 space-y-5 print:hidden`}>
        {/* Source */}
        <div role="tablist" aria-label="Data source" className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[
            { id: 'client', icon: Building2, text: 'Existing client' },
            { id: 'csv', icon: FileSpreadsheet, text: 'Prospect CSV' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={source === t.id}
              onClick={() => { setSource(t.id); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                source === t.id
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.text}
            </button>
          ))}
        </div>

        {source === 'client' ? (
          <div className="grid sm:grid-cols-[1fr_180px_auto] gap-4 items-end">
            <div>
              <label className={label} htmlFor="leak-biz">Business</label>
              <select id="leak-biz" className={input} value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
                <option value="">Select a business…</option>
                {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="leak-days">Enquiries from the last</label>
              <select id="leak-days" className={input} value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {PERIODS.map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <button
              type="button"
              onClick={runClient}
              disabled={!canRunClient}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run audit
            </button>
            <label className="sm:col-span-3 flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>
                <ShieldCheck className="inline w-4 h-4 text-teal-600 mr-1 -mt-0.5" />
                The business owner has agreed in writing that we can audit their data.
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="w-full flex flex-col items-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors"
            >
              <Upload className="w-6 h-6 text-teal-600" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {csv ? csv.fileName : 'Drop the CRM export here, or click to choose'}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read in this browser only. The file is never uploaded.
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }}
            />

            {csv && (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Match the columns <span className="font-normal text-slate-500">· {csv.rows.length.toLocaleString('en-IN')} rows</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">We guessed from the headers. Only the created date is required; each extra column switches on more checks.</p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500">
                      <tr>
                        <th className="text-left font-semibold px-3 py-2">We need</th>
                        <th className="text-left font-semibold px-3 py-2">Column in their file</th>
                        <th className="text-left font-semibold px-3 py-2 hidden md:table-cell">First value</th>
                        <th className="text-left font-semibold px-3 py-2">Checks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {CSV_FIELDS.map((f) => (
                        <tr key={f.key}>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {f.label}{f.required && <span className="text-rose-500"> *</span>}
                          </td>
                          <td className="px-3 py-2 min-w-[180px]">
                            <select
                              aria-label={f.label}
                              className={`${input} py-1.5`}
                              value={mapping[f.key] || ''}
                              onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || undefined }))}
                            >
                              <option value="">— not in file —</option>
                              {csv.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500 max-w-[220px] truncate hidden md:table-cell">
                            {mapping[f.key] ? String(csv.rows.find((r) => r[mapping[f.key]])?.[mapping[f.key]] ?? '') : ''}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">{(f.rules || []).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="w-52">
                    <label className={label} htmlFor="leak-datefmt">Date format</label>
                    <select id="leak-datefmt" className={input} value={dateOrder} onChange={(e) => setDateOrder(e.target.value)}>
                      <option value="auto">Detect automatically</option>
                      <option value="DMY">Day-Month-Year (31/12/2026)</option>
                      <option value="MDY">Month-Day-Year (12/31/2026)</option>
                      <option value="YMD">Year-Month-Day (2026-12-31)</option>
                    </select>
                  </div>
                  <p className="text-xs text-slate-500 flex-1 min-w-[200px]">
                    Checks this file supports: {csvRules.length ? csvRules.map((r) => `${r} ${RULES[r].label}`).join(' · ') : 'none yet — map a first-contact, follow-up or last-activity column'}
                  </p>
                  <button
                    type="button"
                    onClick={runCsv}
                    disabled={!mapping.createdAt}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold"
                  >
                    <Play className="w-4 h-4" /> Run audit
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Rule settings */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            aria-expanded={showSettings}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-600" /> Targets, business hours and deal value
            <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </button>
          {showSettings && (
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <NumberField id="sla" text="First reply target (minutes)" value={config.firstReplySlaMinutes} onChange={(v) => setCfg('firstReplySlaMinutes', v)} />
              <NumberField id="wait" text="Waiting customer target (hours)" value={config.waitingSlaHours} onChange={(v) => setCfg('waitingSlaHours', v)} />
              <NumberField id="grace" text="Follow-up grace (hours)" value={config.followUpGraceHours} onChange={(v) => setCfg('followUpGraceHours', v)} />
              <NumberField id="stall" text="Gone quiet after (days)" value={config.stallDays} onChange={(v) => setCfg('stallDays', v)} />
              <NumberField id="att" text="Min attempts before lost" value={config.minAttemptsBeforeLost} onChange={(v) => setCfg('minAttemptsBeforeLost', v)} />
              <NumberField id="deal" text="Average deal value (₹)" value={config.avgDealValue} onChange={(v) => setCfg('avgDealValue', v)} />
              <NumberField id="conv" text="Their conversion rate (%)" value={config.conversionPct} onChange={(v) => setCfg('conversionPct', v)} />
              <div>
                <span className={label}>Business hours</span>
                <div className="flex items-center gap-2">
                  <input aria-label="Opens at hour" type="number" min={0} max={23} className={`${input} w-16`} value={config.businessHours.startHour} onChange={(e) => setBh('startHour', Number(e.target.value))} />
                  <span className="text-slate-400 text-sm">to</span>
                  <input aria-label="Closes at hour" type="number" min={1} max={24} className={`${input} w-16`} value={config.businessHours.endHour} onChange={(e) => setBh('endHour', Number(e.target.value))} />
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 ml-1">
                    <input type="checkbox" checked={config.businessHours.enabled} onChange={(e) => setBh('enabled', e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    On
                  </label>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <span className={label}>Working days</span>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d, i) => {
                    const on = config.businessHours.days.includes(i);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setBh('days', on ? config.businessHours.days.filter((x) => x !== i) : [...config.businessHours.days, i])}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                          on ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">Changes apply to the current result instantly. Times are in IST.</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}
      </div>

      {report && (
        <LeakReport
          report={report}
          dataset={dataset}
          onToggleDismissed={toggleDismissed}
        />
      )}
    </div>
  );
}

function NumberField({ id, text, value, onChange }) {
  return (
    <div>
      <label className={label} htmlFor={`leak-${id}`}>{text}</label>
      <input
        id={`leak-${id}`}
        type="number"
        min={0}
        className={input}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    </div>
  );
}
