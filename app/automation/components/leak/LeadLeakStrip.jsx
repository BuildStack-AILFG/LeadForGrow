'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radar } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { RULES } from '@/lib/leak/rules';

/**
 * On the lead page: this lead's open leaks, so whoever opens it sees what's
 * slipping before they call. Renders nothing when there are none (or Leak
 * Radar is off). One small indexed request per lead view.
 */
export default function LeadLeakStrip({ leadId }) {
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    let alive = true;
    authFetch(`/api/automation/leak/flags?leadId=${leadId}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.success) setFlags(d.data.items?.[0]?.flags || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, [leadId]);

  if (!flags.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
      <Radar className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
          {flags.length === 1 ? 'This enquiry is slipping' : `${flags.length} things are slipping on this enquiry`}
        </p>
        <ul className="mt-1 space-y-0.5">
          {flags.map((f) => (
            <li key={f.id} className="text-sm text-amber-900/90 dark:text-amber-100/90">
              <span className="font-medium">{RULES[f.rule]?.label}:</span> {f.reason}
            </li>
          ))}
        </ul>
      </div>
      <Link href="/automation/leak-radar" className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap">
        Open Leak Radar
      </Link>
    </div>
  );
}
