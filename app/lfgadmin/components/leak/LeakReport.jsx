'use client';

import { useMemo, useState } from 'react';
import { Download, Printer, ExternalLink, Info, Undo2, XCircle, Target, Users, Clock, PhoneOff, Inbox } from 'lucide-react';
import { RULES, RULE_IDS, formatDuration } from '@/lib/leak/rules';

const PAGE = 50;
const card = 'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800';
const SEVERITY_CHIP = {
  high: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};
const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—');
const GO_LEAK_PCT = 10;
const MAX_FALSE_POSITIVE_PCT = 15;

export default function LeakReport({ report, dataset, onToggleDismissed }) {
  const [rule, setRule] = useState('all');
  const [showDismissed, setShowDismissed] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const t = report.totals;
  const available = new Set(report.available);

  const rows = useMemo(() => report.items.filter((i) =>
    (showDismissed || !i.dismissed) && (rule === 'all' || i.flags.some((f) => f.rule === rule))), [report.items, rule, showDismissed]);

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Lead', 'Phone', 'Owner', 'Source', 'Stage', 'Enquiry date', 'Rules', 'Reasons', 'Owner says not a leak'];
    const lines = report.items.map((i) => [
      i.name, i.phone, i.owner, i.source, i.stage, new Date(i.createdAt).toISOString().slice(0, 10),
      i.flags.map((f) => f.rule).join(' '), i.flags.map((f) => f.reason).join(' | '), i.dismissed ? 'yes' : '',
    ].map(esc).join(','));
    const blob = new Blob([[header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leak-audit-${dataset.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const period = dataset.periodDays ? `last ${dataset.periodDays} days` : 'the uploaded file';
  const aboveGo = t.leakPct >= GO_LEAK_PCT;

  return (
    <section aria-label="Leak audit result" className="space-y-6">
      {/* Headline */}
      <div className={`${card} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              {dataset.label} · {period}
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-balance">
              {t.leaked.toLocaleString('en-IN')} of {t.enquiries.toLocaleString('en-IN')} enquiries ({t.leakPct}%) slipped.
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t.neverContacted
                ? `${t.neverContacted.toLocaleString('en-IN')} never got a reply or a call.`
                : 'Every enquiry got some contact.'}
              {t.firstReplyMedianMin != null && ` Typical first reply: ${formatDuration(t.firstReplyMedianMin)} of business time.`}
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-sm font-semibold text-white">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${aboveGo ? SEVERITY_CHIP.high : SEVERITY_CHIP.low}`}>
            {aboveGo ? `Leak rate at or above ${GO_LEAK_PCT}%: counts toward "go"` : `Leak rate below ${GO_LEAK_PCT}%`}
          </span>
          {t.flagged > 0 && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${t.falsePositivePct < MAX_FALSE_POSITIVE_PCT ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900' : SEVERITY_CHIP.medium}`}>
              Owner marked {t.dismissed} of {t.flagged} as not a leak: {t.falsePositivePct}% false positives (target under {MAX_FALSE_POSITIVE_PCT}%)
            </span>
          )}
        </div>
      </div>

      {/* Numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile icon={Inbox} text="Enquiries" value={t.enquiries.toLocaleString('en-IN')} />
        <Tile icon={XCircle} text="Slipped" value={`${t.leaked.toLocaleString('en-IN')}`} sub={`${t.leakPct}%`} tone="rose" />
        <Tile icon={PhoneOff} text="Never contacted" value={t.neverContacted.toLocaleString('en-IN')} tone="rose" />
        <Tile icon={Clock} text="First reply, typical" value={t.firstReplyMedianMin != null ? formatDuration(t.firstReplyMedianMin) : '—'} sub={t.firstReplyP90Min != null ? `slowest 10%: ${formatDuration(t.firstReplyP90Min)}` : undefined} />
        <Tile icon={Target} text={`Replied within ${formatDuration(report.config.firstReplySlaMinutes)}`} value={t.withinSlaPct != null ? `${t.withinSlaPct}%` : '—'} sub={t.contacted ? `of ${t.contacted} contacted` : undefined} />
      </div>

      {t.estimatedAtRisk != null && (
        <div className={`${card} p-5 flex flex-wrap items-center gap-4`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Estimate</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{inr(t.estimatedAtRisk)} at risk</p>
          </div>
          <p className="text-sm text-slate-500 flex-1 min-w-[240px]">
            {t.openLeaked} open leaked enquiries × {inr(report.config.avgDealValue)} average deal × {report.config.conversionPct}% conversion.
            An estimate from the owner's own numbers, not money already lost.
          </p>
        </div>
      )}

      {/* Why */}
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className={`${card} p-5`}>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Why they slipped</h3>
          <ul className="space-y-3">
            {RULE_IDS.map((r) => {
              const n = report.byRule[r];
              const pct = t.enquiries ? Math.round((n / t.enquiries) * 100) : 0;
              const on = available.has(r);
              return (
                <li key={r} className={on ? '' : 'opacity-50'}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-800 dark:text-slate-200">
                      <span className="text-xs font-bold text-slate-400 mr-1.5">{r}</span>{RULES[r].label}
                    </span>
                    <span className="tabular-nums text-slate-600 dark:text-slate-300">{on ? n.toLocaleString('en-IN') : 'not in data'}</span>
                  </div>
                  {on && (
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className={`${card} p-5`}>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-teal-600" /> By salesperson</h3>
          <BreakdownTable
            rows={report.byOwner.slice(0, 8)}
            first={(o) => o.owner}
            cols={[
              ['Leads', (o) => o.leads],
              ['Slipped', (o) => `${o.leaked} (${o.leakPct}%)`],
              ['First reply', (o) => (o.firstReplyMedianMin != null ? formatDuration(o.firstReplyMedianMin) : '—')],
            ]}
          />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-5 mb-3">By source</h3>
          <BreakdownTable
            rows={report.bySource.slice(0, 6)}
            first={(s) => s.source}
            cols={[['Leads', (s) => s.leads], ['Slipped', (s) => `${s.leaked} (${s.leakPct}%)`]]}
          />
        </div>
      </div>

      {/* The list */}
      <div className={`${card} overflow-hidden`}>
        <div className="p-4 flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mr-2">Slipped enquiries</h3>
          <div className="flex flex-wrap gap-1.5 print:hidden">
            {['all', ...report.available].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={rule === r}
                onClick={() => { setRule(r); setVisible(PAGE); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  rule === r ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {r === 'all' ? 'All' : `${r} ${RULES[r].short}`}
              </button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 print:hidden">
            <input type="checkbox" checked={showDismissed} onChange={(e) => setShowDismissed(e.target.checked)} className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
            Show ones marked not a leak
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Nothing slipped for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Lead</th>
                  <th className="text-left font-semibold px-4 py-2.5">Why</th>
                  <th className="text-left font-semibold px-4 py-2.5 whitespace-nowrap">Enquired</th>
                  <th className="text-left font-semibold px-4 py-2.5">Owner</th>
                  <th className="px-4 py-2.5 print:hidden"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.slice(0, visible).map((i) => (
                  <tr key={i.id} className={i.dismissed ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 align-top min-w-[160px]">
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                        {i.link ? (
                          <a href={i.link} target="_blank" rel="noreferrer" className="hover:text-teal-700 dark:hover:text-teal-400 inline-flex items-center gap-1">
                            {i.name} <ExternalLink className="w-3 h-3 print:hidden" />
                          </a>
                        ) : i.name}
                      </div>
                      <div className="text-xs text-slate-500">{[i.phone, i.source, i.stage].filter(Boolean).join(' · ')}</div>
                    </td>
                    <td className="px-4 py-3 align-top min-w-[260px]">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {i.flags.map((f) => (
                          <span key={f.rule + (f.kind || '')} className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${SEVERITY_CHIP[f.severity]}`}>
                            {f.rule} {RULES[f.rule].short}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{i.flags[0].reason}</p>
                      {i.flags.slice(1).map((f) => (
                        <p key={f.rule} className="text-xs text-slate-500 mt-0.5">{f.reason}</p>
                      ))}
                    </td>
                    <td className="px-4 py-3 align-top whitespace-nowrap text-slate-600 dark:text-slate-300 tabular-nums">{shortDate(i.createdAt)}</td>
                    <td className="px-4 py-3 align-top text-slate-600 dark:text-slate-300">{i.owner || 'Unassigned'}</td>
                    <td className="px-4 py-3 align-top text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => onToggleDismissed(i.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                      >
                        {i.dismissed ? <><Undo2 className="w-3 h-3" /> Undo</> : 'Not a leak'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > visible && (
          <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800 print:hidden">
            <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline">
              Show {Math.min(PAGE, rows.length - visible)} more of {rows.length - visible}
            </button>
          </div>
        )}
      </div>

      {dataset.notes?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2"><Info className="w-3.5 h-3.5" /> About this data</p>
          <ul className="space-y-1 text-xs text-slate-500 list-disc pl-5">
            {dataset.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

function Tile({ icon: Icon, text, value, sub, tone }) {
  return (
    <div className={`${card} p-4`}>
      <Icon className={`w-4 h-4 mb-2 ${tone === 'rose' ? 'text-rose-500' : 'text-teal-600'}`} />
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{text}{sub ? <span className="block text-slate-400">{sub}</span> : null}</p>
    </div>
  );
}

function BreakdownTable({ rows, first, cols }) {
  if (!rows.length) return <p className="text-sm text-slate-400">No data</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-slate-500">
          <tr>
            <th className="text-left font-semibold pb-2 pr-3">Name</th>
            {cols.map(([h]) => <th key={h} className="text-right font-semibold pb-2 pl-3 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((r) => (
            <tr key={first(r)}>
              <td className="py-1.5 pr-3 text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{first(r)}</td>
              {cols.map(([h, fn]) => <td key={h} className="py-1.5 pl-3 text-right tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">{fn(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
