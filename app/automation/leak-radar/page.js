'use client';

import { useEffect, useState } from 'react';
import { Radar, Loader2 } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import { useLeakRadar } from '../hooks/useLeakRadar';
import LeakQueue, { ago } from '../components/leak/LeakQueue';
import LeakTeam from '../components/leak/LeakTeam';
import LeakLedger from '../components/leak/LeakLedger';
import LeakSettings from '../components/leak/LeakSettings';
import PageHeader from '@/app/components/ui/PageHeader';
import Tabs from '@/app/components/ui/Tabs';
import MetricStrip from '@/app/components/ui/MetricStrip';
import Button from '@/app/components/ui/Button';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

/**
 * Leak Radar — enquiries that are slipping, why, and what to do next.
 * Layout follows the app's list-page pattern: page header with tabs, one
 * metric strip, then the active view (queue table / team / ledger / settings).
 * Data and actions are unchanged (useLeakRadar).
 */
export default function LeakRadarPage() {
  const lr = useLeakRadar();
  const s = lr.summary;

  // Managers get the "recovered" figure from the ledger (loaded once, not polled).
  useEffect(() => {
    if (s?.manager && s.enabled && !lr.ledger) lr.changeLedgerDays(lr.ledgerDays);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.manager, s?.enabled]);

  if (lr.loading || !lr.tab) return <PageLoader label="Loading Leak Radar…" />;

  const tabs = s?.manager
    ? [
        { value: 'radar', label: 'Radar' },
        { value: 'mine', label: 'My leaks', count: s.mine || undefined },
        { value: 'team', label: 'Team' },
        { value: 'ledger', label: 'Recovery ledger' },
        { value: 'settings', label: 'Settings' },
      ]
    : [{ value: 'mine', label: 'My leaks' }];

  const metrics = !s?.enabled
    ? []
    : [
        {
          label: s.manager ? 'Open leaks' : 'Your open leaks',
          value: s.open,
          note: s.bySeverity.high ? `${s.bySeverity.high} urgent` : 'None urgent',
        },
        s.manager
          ? {
              label: 'Estimated at risk',
              value: s.estimatedAtRisk != null ? inr(s.estimatedAtRisk) : '—',
              note: s.estimateInputs
                ? `${s.estimateInputs.leads} leads × ${inr(s.estimateInputs.avgDealValue)} × ${s.estimateInputs.conversionPct}%`
                : 'Add your deal value in Settings',
            }
          : { label: 'Customers waiting for you', value: s.byRule.R2 || 0, note: 'Answer these first' },
        s.manager
          ? {
              label: 'Recovered, last 30 days',
              value: lr.ledger ? inr(lr.ledger.revenue.observed) : '…',
              note: lr.ledger ? `${lr.ledger.shown.recovered} of ${lr.ledger.shown.flagged} leaks recovered` : 'Loading',
            }
          : { label: 'Less urgent', value: s.bySeverity.low + s.bySeverity.medium, note: 'Follow-ups and quiet leads' },
      ];

  return (
    <div className="min-h-full bg-canvas">
      <PageHeader
        title="Leak radar"
        description="Enquiries that are slipping, why, and what to do next."
        actions={s?.enabled && s.lastScanAt ? <span className="text-dense text-fg-tertiary">Checked {ago(s.lastScanAt)} ago</span> : null}
        tabs={s?.enabled ? <Tabs ariaLabel="Leak Radar views" tabs={tabs} value={lr.tab} onChange={lr.changeTab} /> : null}
      />

      <div className="px-4 py-6 sm:px-6">
        <AutoPageIntro />

        {!s?.enabled ? (
          <OffState manager={s?.manager} onTurnOn={() => lr.saveSettings({ enabled: true }).catch(() => {})} />
        ) : (
          <>
            {lr.tab !== 'settings' && <MetricStrip metrics={metrics} className="mb-6" />}
            {(lr.tab === 'radar' || lr.tab === 'mine') && <LeakQueue lr={lr} mode={lr.tab} />}
            {lr.tab === 'team' && <LeakTeam summary={s} onOpenQueue={lr.openQueueFor} />}
            {lr.tab === 'ledger' && <LeakLedger ledger={lr.ledger} days={lr.ledgerDays} onDays={lr.changeLedgerDays} />}
            {lr.tab === 'settings' && <LeakSettings settings={lr.settings} onSave={lr.saveSettings} onScan={lr.scanNow} />}
          </>
        )}
      </div>
    </div>
  );
}

const RULE_LIST = [
  ['No reply yet', 'nobody answered or called.'],
  ['Customer waiting', 'they wrote back and nobody replied.'],
  ['Follow-up overdue', 'a follow-up date passed with nothing done.'],
  ['Gone quiet', 'still open, but untouched for two weeks.'],
  ['Lost without trying', 'closed as lost after one attempt.'],
];

function OffState({ manager, onTurnOn }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="max-w-2xl rounded-lg border border-line p-6">
      <h2 className="text-title font-semibold text-fg">See every enquiry your team is about to lose</h2>
      <dl className="mt-4 divide-y divide-line rounded-md border border-line">
        {RULE_LIST.map(([term, desc]) => (
          <div key={term} className="flex gap-3 px-3 py-2 text-body">
            <dt className="w-40 shrink-0 font-medium text-fg">{term}</dt>
            <dd className="text-fg-secondary">{desc}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-body text-fg-secondary">Each salesperson gets their own queue with one-tap actions. Nothing is sent to customers automatically.</p>
      {manager ? (
        <Button
          variant="primary"
          size="lg"
          className="mt-5"
          loading={busy}
          icon={busy ? Loader2 : Radar}
          onClick={async () => { setBusy(true); await onTurnOn(); setBusy(false); }}
        >
          Turn on Leak Radar
        </Button>
      ) : (
        <p className="mt-5 text-body font-medium text-fg-secondary">Leak Radar is off. Ask your business owner to turn it on.</p>
      )}
    </div>
  );
}
