'use client';

import { formatDuration } from '@/lib/leak/rules';

/**
 * Per salesperson: what's open now and how their enquiries went over the scan
 * window. Numbers sit next to how many leads each person had, so a busy rep
 * isn't compared unfairly with a quiet one.
 */
export default function LeakTeam({ summary, onOpenQueue }) {
  const team = summary?.team || [];
  const scan = summary?.scan || {};
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Enquiries (90 days)" value={scan.enquiries ?? '—'} />
        <Stat label="Slipped" value={scan.leakPct != null ? `${scan.leakPct}%` : '—'} />
        <Stat label="First reply, typical" value={scan.firstReplyMedianMin != null ? formatDuration(scan.firstReplyMedianMin) : '—'} hint="business hours" />
        <Stat label="Replied within target" value={scan.withinSlaPct != null ? `${scan.withinSlaPct}%` : '—'} />
      </div>

      <div className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 overflow-hidden">
        {team.length === 0 ? (
          <p className="p-8 text-center text-sm text-fg-tertiary">Team numbers appear after the first scan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-subtle dark:bg-slate-800/60 text-xs text-fg-tertiary">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Salesperson</th>
                  <th className="text-right font-semibold px-4 py-2.5">Open now</th>
                  <th className="text-right font-semibold px-4 py-2.5">Leads (90 days)</th>
                  <th className="text-right font-semibold px-4 py-2.5">Slipped</th>
                  <th className="text-right font-semibold px-4 py-2.5 whitespace-nowrap">First reply</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Queue</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-slate-800">
                {team.map((t) => (
                  <tr key={t.ownerId || 'unassigned'}>
                    <td className="px-4 py-3 font-medium text-fg dark:text-white">{t.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={t.openNow ? 'font-semibold text-danger dark:text-rose-400' : 'text-fg-tertiary'}>{t.openNow}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary dark:text-fg-disabled">{t.leads}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary dark:text-fg-disabled">{t.leakPct != null ? `${t.leakPct}%` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-secondary dark:text-fg-disabled">{t.firstReplyMedianMin != null ? formatDuration(t.firstReplyMedianMin) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {t.openNow > 0 && (
                        <button type="button" onClick={() => onOpenQueue(t.ownerId || 'unassigned')} className="text-xs font-semibold text-accent-fg dark:text-accent-fg hover:underline whitespace-nowrap">
                          Open queue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-fg-tertiary">Leave and availability aren't tracked yet, so check before reading a high number as a problem.</p>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 p-4">
      <p className="text-2xl font-semibold text-fg dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-fg-tertiary">{label}{hint ? <span className="block text-fg-tertiary">{hint}</span> : null}</p>
    </div>
  );
}
