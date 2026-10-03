'use client';

import { useState } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

/**
 * Recovery Ledger: flagged → acted on → recovered, the money that came back
 * (observed vs attributed, never mixed), and the comparison with the leaks
 * that were deliberately not shown.
 */
export default function LeakLedger({ ledger, days, onDays }) {
  const [method, setMethod] = useState(false);
  if (!ledger) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent-fg" /></div>;
  const s = ledger.shown;
  const h = ledger.holdout;
  const steps = [
    ['Flagged', s.flagged],
    ['Acted on', s.actioned],
    ['Recovered', s.recovered],
  ];
  const max = Math.max(1, s.flagged);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-fg-tertiary">Leaks found in the last</span>
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" aria-pressed={days === d} onClick={() => onDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${days === d ? 'bg-accent border-accent text-white' : 'border-line dark:border-slate-700 text-fg-secondary dark:text-fg-disabled bg-canvas dark:bg-slate-900'}`}>
            {d} days
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-fg dark:text-white mb-4">What happened to the leaks</h3>
          <ul className="space-y-3">
            {steps.map(([label, n]) => (
              <li key={label}>
                <div className="flex justify-between text-sm"><span className="text-fg-secondary dark:text-slate-200">{label}</span><span className="tabular-nums font-semibold text-fg dark:text-white">{n}</span></div>
                <div className="mt-1.5 h-2.5 rounded-full bg-muted dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-fg-tertiary">Recovered: the customer replied within 7 days, or the lead converted, a deal was won or a bill was paid within 30 days.</p>
        </section>

        <section className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-fg dark:text-white mb-4">Money that came back</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-semibold text-fg dark:text-white tabular-nums">{inr(ledger.revenue.observed)}</p>
              <p className="text-xs text-fg-tertiary">Observed: paid bills and won deals of flagged leads</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-accent-fg dark:text-accent-fg tabular-nums">{inr(ledger.revenue.attributed)}</p>
              <p className="text-xs text-fg-tertiary">Attributed: paid after your team acted in Leak Radar</p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-line dark:border-slate-800">
            <p className="text-sm font-semibold text-fg dark:text-slate-100">Did Leak Radar make the difference?</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <Compare label="Shown to your team" rate={s.recoveryRate} n={s.flagged} />
              <Compare label="Comparison group (not shown)" rate={h.recoveryRate} n={h.flagged} />
            </div>
            <p className="mt-3 text-xs text-fg-tertiary">
              {ledger.enoughData
                ? `Shown leaks recovered ${ledger.difference > 0 ? `${ledger.difference} points more` : ledger.difference < 0 ? `${Math.abs(ledger.difference)} points less` : 'the same'} than the comparison group.`
                : `Too few leaks to compare yet: each group needs at least ${ledger.minSample}.`}
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-line dark:border-slate-800 bg-subtle dark:bg-slate-900/60">
        <button type="button" onClick={() => setMethod((m) => !m)} aria-expanded={method} className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-fg-secondary dark:text-slate-200">
          How these numbers are worked out
          <ChevronDown className={`w-4 h-4 transition-transform ${method ? 'rotate-180' : ''}`} />
        </button>
        {method && (
          <ul className="px-5 pb-4 space-y-1.5 text-xs text-fg-secondary dark:text-fg-tertiary list-disc pl-9">
            <li>A share of leaks (set in Settings) is picked at random and not shown. Your team can still work them from the inbox as usual; they're the comparison.</li>
            <li>Observed revenue counts paid bills (or, where there's no bill, the won deal amount) within 30 days of the leak, once per lead.</li>
            <li>Attributed revenue counts only money that came in after someone acted on the leak in Leak Radar.</li>
            <li>Leaks marked "Not a leak" are left out everywhere.</li>
            <li>The comparison is shown once both groups have enough leaks; small numbers swing too much to mean anything.</li>
          </ul>
        )}
      </section>
    </div>
  );
}

function Compare({ label, rate, n }) {
  return (
    <div className="rounded-lg border border-line dark:border-slate-700 p-3">
      <p className="text-xl font-semibold text-fg dark:text-white tabular-nums">{rate != null ? `${rate}%` : '—'}</p>
      <p className="text-xs text-fg-tertiary">{label}<span className="block text-fg-tertiary">{n} leak{n === 1 ? '' : 's'}</span></p>
    </div>
  );
}
