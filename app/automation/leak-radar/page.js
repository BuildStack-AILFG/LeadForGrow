'use client';

import { useEffect, useState } from 'react';
import { Radar, Loader2, AlertTriangle, IndianRupee, CheckCircle2, Info } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import { useLeakRadar } from '../hooks/useLeakRadar';
import LeakQueue from '../components/leak/LeakQueue';
import LeakTeam from '../components/leak/LeakTeam';
import LeakLedger from '../components/leak/LeakLedger';
import LeakSettings from '../components/leak/LeakSettings';
import { ago } from '../components/leak/LeakQueue';

const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

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
    ? [['radar', 'Radar'], ['mine', `My leaks${s.mine ? ` ${s.mine}` : ''}`], ['team', 'Team'], ['ledger', 'Recovery ledger'], ['settings', 'Settings']]
    : [['mine', 'My leaks']];

  return (
    <div className="min-h-full bg-subtle dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-canvas border border-line flex items-center justify-center shrink-0">
            <Radar className="w-5 h-5 text-fg-secondary" />
          </div>
          <h1 className="text-page font-semibold text-fg text-brand-ink">Leak Radar</h1>
          {s?.enabled && s.lastScanAt && (
            <span className="ml-auto text-xs text-fg-tertiary hidden sm:block">Checked {ago(s.lastScanAt)} ago</span>
          )}
        </div>
        <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mb-6">Enquiries that are slipping, why, and what to do next.</p>

        <AutoPageIntro />

        {!s?.enabled ? (
          <OffState manager={s?.manager} onTurnOn={() => lr.saveSettings({ enabled: true }).catch(() => {})} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <Figure
                icon={AlertTriangle}
                tone="rose"
                value={s.open}
                label={s.manager ? 'Open leaks' : 'Your open leaks'}
                sub={s.bySeverity.high ? `${s.bySeverity.high} urgent` : 'none urgent'}
              />
              {s.manager ? (
                <Figure
                  icon={IndianRupee}
                  value={s.estimatedAtRisk != null ? inr(s.estimatedAtRisk) : '—'}
                  label="Estimated at risk"
                  sub={s.estimateInputs
                    ? `${s.estimateInputs.leads} leads × ${inr(s.estimateInputs.avgDealValue)} × ${s.estimateInputs.conversionPct}% (estimate)`
                    : 'Add your deal value in Settings'}
                />
              ) : (
                <Figure icon={Info} value={s.byRule.R2 || 0} label="Customers waiting for you" sub="answer these first" />
              )}
              {s.manager ? (
                <Figure
                  icon={CheckCircle2}
                  tone="teal"
                  value={lr.ledger ? inr(lr.ledger.revenue.observed) : '…'}
                  label="Recovered, last 30 days"
                  sub={lr.ledger ? `${lr.ledger.shown.recovered} of ${lr.ledger.shown.flagged} leaks recovered · observed` : 'loading'}
                />
              ) : (
                <Figure icon={CheckCircle2} tone="teal" value={s.bySeverity.low + s.bySeverity.medium} label="Less urgent" sub="follow-ups and quiet leads" />
              )}
            </div>

            <div role="tablist" aria-label="Leak Radar views" className="flex gap-1 overflow-x-auto border-b border-line dark:border-slate-800 mb-5">
              {tabs.map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={lr.tab === id}
                  onClick={() => lr.changeTab(id)}
                  className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                    lr.tab === id
                      ? 'border-accent text-accent-fg dark:text-accent-fg'
                      : 'border-transparent text-fg-tertiary hover:text-fg dark:hover:text-slate-200'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            {(lr.tab === 'radar' || lr.tab === 'mine') && <LeakQueue lr={lr} mode={lr.tab} />}
            {lr.tab === 'team' && (
              <LeakTeam summary={s} onOpenQueue={lr.openQueueFor} />
            )}
            {lr.tab === 'ledger' && <LeakLedger ledger={lr.ledger} days={lr.ledgerDays} onDays={lr.changeLedgerDays} />}
            {lr.tab === 'settings' && <LeakSettings settings={lr.settings} onSave={lr.saveSettings} onScan={lr.scanNow} />}
          </>
        )}
      </div>
    </div>
  );
}

function Figure({ icon: Icon, value, label, sub, tone }) {
  const color = tone === 'rose' ? 'text-danger' : 'text-accent-fg';
  return (
    <div className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 p-4">
      <Icon className={`w-4 h-4 mb-2 ${color}`} />
      <p className="text-2xl font-semibold text-fg dark:text-white tabular-nums">{value}</p>
      <p className="text-sm text-fg-secondary dark:text-fg-disabled">{label}</p>
      {sub && <p className="text-xs text-fg-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function OffState({ manager, onTurnOn }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 p-6 sm:p-8 max-w-2xl">
      <h2 className="text-title font-semibold text-fg dark:text-white text-balance">See every enquiry your team is about to lose</h2>
      <ul className="mt-4 space-y-2 text-sm text-fg-secondary dark:text-fg-disabled">
        <li><strong className="text-fg dark:text-white">No reply yet:</strong> nobody answered or called.</li>
        <li><strong className="text-fg dark:text-white">Customer waiting:</strong> they wrote back and nobody replied.</li>
        <li><strong className="text-fg dark:text-white">Follow-up overdue:</strong> a follow-up date passed with nothing done.</li>
        <li><strong className="text-fg dark:text-white">Gone quiet:</strong> still open, but untouched for two weeks.</li>
        <li><strong className="text-fg dark:text-white">Lost without trying:</strong> closed as lost after one attempt.</li>
      </ul>
      <p className="mt-4 text-sm text-fg-tertiary">Each salesperson gets their own queue with one-tap actions. Nothing is sent to customers automatically.</p>
      {manager ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => { setBusy(true); await onTurnOn(); setBusy(false); }}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />} Turn on Leak Radar
        </button>
      ) : (
        <p className="mt-6 text-sm font-medium text-fg-secondary dark:text-slate-200">Leak Radar is off. Ask your business owner to turn it on.</p>
      )}
    </div>
  );
}
