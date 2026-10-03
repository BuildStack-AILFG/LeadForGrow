'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, MinusCircle } from 'lucide-react';

const STATE = {
  ok: { label: 'Operational', Icon: CheckCircle2, cls: 'text-emerald-700', dot: 'bg-emerald-500' },
  degraded: { label: 'Degraded', Icon: AlertTriangle, cls: 'text-amber-700', dot: 'bg-amber-500' },
  down: { label: 'Not responding', Icon: XCircle, cls: 'text-rose-700', dot: 'bg-rose-500' },
  off: { label: 'Not in use', Icon: MinusCircle, cls: 'text-[#6B7280]', dot: 'bg-[#D1D5DB]' },
  checking: { label: 'Checking…', Icon: Loader2, cls: 'text-[#6B7280]', dot: 'bg-[#D1D5DB]' },
};

const fromService = (s) => {
  if (!s) return 'down';
  if (s.status === 'healthy') return 'ok';
  if (s.status === 'not_configured') return 'off';
  return 'degraded';
};

/** Live check against /api/health — what this page shows is what the server reports right now, nothing more. */
export default function StatusBoard() {
  const [result, setResult] = useState({ state: 'checking' });

  const check = useCallback(async () => {
    setResult({ state: 'checking' });
    const started = performance.now();
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const json = await res.json();
      const ms = Math.round(performance.now() - started);
      const services = json?.data?.services || {};
      setResult({ state: 'done', ms, at: new Date(), app: res.ok ? 'ok' : 'degraded', db: fromService(services.mongodb), queue: fromService(services.redis) });
    } catch {
      setResult({ state: 'done', at: new Date(), app: 'down', db: 'down', queue: 'down' });
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const checking = result.state === 'checking';
  const rows = [
    ['Website & app', 'Pages, sign-in and the CRM', checking ? 'checking' : result.app],
    ['Database', 'Leads, conversations and settings', checking ? 'checking' : result.db],
    ['Background jobs', 'Scheduled sends and queued work', checking ? 'checking' : result.queue],
  ];
  const states = rows.map((r) => r[2]);
  const overall = checking ? 'checking' : states.includes('down') ? 'down' : states.includes('degraded') ? 'degraded' : 'ok';
  const headline = { ok: 'All checked services are operational', degraded: 'Some services are degraded', down: 'We can’t reach LeadForGrow right now', checking: 'Running live checks…' }[overall];
  const O = STATE[overall];

  return (
    <div>
      <div className={`flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between ${overall === 'ok' ? 'bg-emerald-50 ring-1 ring-emerald-200' : overall === 'checking' ? 'bg-[#F5F6F2]' : 'bg-amber-50 ring-1 ring-amber-200'}`}>
        <p className={`flex items-center gap-3 text-lg font-semibold ${O.cls}`}>
          <O.Icon className={`h-6 w-6 ${checking ? 'animate-spin' : ''}`} aria-hidden /> {headline}
        </p>
        <button onClick={check} disabled={checking} className="inline-flex items-center gap-2 self-start rounded-full border border-[#0B1712]/15 bg-white px-4 py-2 text-sm font-medium text-[#0B1712] hover:bg-[#F0F9F5] disabled:opacity-50 sm:self-auto">
          <RefreshCw className="h-4 w-4" /> Check again
        </button>
      </div>

      <ul className="mt-6 divide-y divide-[#E4E7E1] rounded-2xl border border-[#E4E7E1]" aria-live="polite">
        {rows.map(([name, desc, s]) => {
          const S = STATE[s];
          return (
            <li key={name} className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="font-semibold text-[#0B1712]">{name}</p>
                <p className="text-sm text-[#6B7280]">{desc}</p>
              </div>
              <span className={`flex shrink-0 items-center gap-2 text-sm font-medium ${S.cls}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${S.dot}`} /> {S.label}
              </span>
            </li>
          );
        })}
      </ul>

      {result.at && (
        <p className="mt-3 text-xs text-[#6B7280]">
          Checked {result.at.toLocaleString('en-IN')}{result.ms ? ` · response in ${result.ms} ms` : ''}
        </p>
      )}
    </div>
  );
}
