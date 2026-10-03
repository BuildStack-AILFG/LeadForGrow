'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SegmentedControl from '@/app/components/ui/SegmentedControl';
import Skeleton from '@/app/components/ui/Skeleton';
import cx, { focusRing } from '@/app/components/ui/cx';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

/**
 * Recovery Ledger: flagged → acted on → recovered, the money that came back
 * (observed vs attributed, never mixed), and the comparison with the leaks
 * that were deliberately not shown.
 */
export default function LeakLedger({ ledger, days, onDays }) {
  const [method, setMethod] = useState(false);

  const header = (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-body text-fg-secondary">Leaks found in the last</span>
      <SegmentedControl
        size="sm"
        ariaLabel="Period"
        value={days}
        onChange={onDays}
        options={[7, 30, 90].map((d) => ({ value: d, label: `${d} days` }))}
      />
    </div>
  );

  if (!ledger) {
    return (
      <div className="space-y-4">
        {header}
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
      </div>
    );
  }

  const s = ledger.shown;
  const h = ledger.holdout;
  const steps = [
    ['Flagged', s.flagged],
    ['Acted on', s.actioned],
    ['Recovered', s.recovered],
  ];
  const max = Math.max(1, s.flagged);

  return (
    <div className="space-y-4">
      {header}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-line p-5">
          <h3 className="text-body font-semibold text-fg">What happened to the leaks</h3>
          <ul className="mt-4 space-y-4">
            {steps.map(([label, n], i) => (
              <li key={label}>
                <div className="flex justify-between text-body">
                  <span className="text-fg-secondary">{label}</span>
                  <span className="font-medium text-fg tabular">{n}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cx('h-full rounded-full', i === 2 ? 'bg-accent' : 'bg-fg-disabled')} style={{ width: `${(n / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-meta text-fg-tertiary">
            Recovered: the customer replied within 7 days, or the lead converted, a deal was won or a bill was paid within 30 days.
          </p>
        </section>

        <section className="rounded-lg border border-line p-5">
          <h3 className="text-body font-semibold text-fg">Money that came back</h3>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-meta text-fg-tertiary">Observed</dt>
              <dd className="mt-1 text-page font-semibold text-fg tabular">{inr(ledger.revenue.observed)}</dd>
              <dd className="mt-0.5 text-meta text-fg-tertiary">Paid bills and won deals of flagged leads</dd>
            </div>
            <div>
              <dt className="text-meta text-fg-tertiary">Attributed</dt>
              <dd className="mt-1 text-page font-semibold text-accent-fg tabular">{inr(ledger.revenue.attributed)}</dd>
              <dd className="mt-0.5 text-meta text-fg-tertiary">Paid after your team acted in Leak Radar</dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-line pt-4">
            <p className="text-body font-medium text-fg">Did Leak Radar make the difference?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Compare label="Shown to your team" rate={s.recoveryRate} n={s.flagged} />
              <Compare label="Comparison group (not shown)" rate={h.recoveryRate} n={h.flagged} />
            </div>
            <p className="mt-3 text-meta text-fg-tertiary">
              {ledger.enoughData
                ? `Shown leaks recovered ${ledger.difference > 0 ? `${ledger.difference} points more` : ledger.difference < 0 ? `${Math.abs(ledger.difference)} points less` : 'the same'} than the comparison group.`
                : `Too few leaks to compare yet: each group needs at least ${ledger.minSample}.`}
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-line">
        <button
          type="button"
          onClick={() => setMethod((m) => !m)}
          aria-expanded={method}
          className={cx('flex w-full items-center justify-between rounded-lg px-5 py-3 text-body font-medium text-fg-secondary hover:text-fg', focusRing)}
        >
          How these numbers are worked out
          <ChevronDown className={cx('h-4 w-4 transition-transform duration-[var(--duration-fast)]', method && 'rotate-180')} strokeWidth={1.75} />
        </button>
        {method && (
          <ul className="list-disc space-y-1.5 border-t border-line px-5 pb-4 pl-9 pt-3 text-dense text-fg-secondary">
            <li>A share of leaks (set in Settings) is picked at random and not shown. Your team can still work them from the inbox as usual; they’re the comparison.</li>
            <li>Observed revenue counts paid bills (or, where there’s no bill, the won deal amount) within 30 days of the leak, once per lead.</li>
            <li>Attributed revenue counts only money that came in after someone acted on the leak in Leak Radar.</li>
            <li>Leaks marked “Not a leak” are left out everywhere.</li>
            <li>The comparison is shown once both groups have enough leaks; small numbers swing too much to mean anything.</li>
          </ul>
        )}
      </section>
    </div>
  );
}

function Compare({ label, rate, n }) {
  return (
    <div className="rounded-md border border-line p-3">
      <p className="text-title font-semibold text-fg tabular">{rate != null ? `${rate}%` : '—'}</p>
      <p className="text-meta text-fg-tertiary">{label}</p>
      <p className="text-meta text-fg-tertiary">{n} leak{n === 1 ? '' : 's'}</p>
    </div>
  );
}
