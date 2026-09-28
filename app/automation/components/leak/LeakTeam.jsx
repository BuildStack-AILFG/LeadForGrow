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

      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {team.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Team numbers appear after the first scan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">Salesperson</th>
                  <th className="text-right font-semibold px-4 py-2.5">Open now</th>
                  <th className="text-right font-semibold px-4 py-2.5">Leads (90 days)</th>
                  <th className="text-right font-semibold px-4 py-2.5">Slipped</th>
                  <th className="text-right font-semibold px-4 py-2.5 whitespace-nowrap">First reply</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Queue</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {team.map((t) => (
                  <tr key={t.ownerId || 'unassigned'}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{t.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={t.openNow ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-slate-500'}>{t.openNow}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{t.leads}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{t.leakPct != null ? `${t.leakPct}%` : '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{t.firstReplyMedianMin != null ? formatDuration(t.firstReplyMedianMin) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {t.openNow > 0 && (
                        <button type="button" onClick={() => onOpenQueue(t.ownerId || 'unassigned')} className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap">
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
      <p className="text-xs text-slate-500">Leave and availability aren't tracked yet, so check before reading a high number as a problem.</p>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{label}{hint ? <span className="block text-slate-400">{hint}</span> : null}</p>
    </div>
  );
}
