'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Map, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import PageLoader from '../components/PageLoader';
import Link from 'next/link';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';

const STATUS_ICON = {
  running: Clock,
  waiting: Clock,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: XCircle,
};

export default function JourneysPage() {
  const [loading, setLoading] = useState(true);
  const [journeys, setJourneys] = useState([]);

  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/automation/journeys');
      const data = await res.json();
      if (data.success) setJourneys(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJourneys(); }, [fetchJourneys]);

  useEffect(() => {
    const interval = setInterval(fetchJourneys, 15000);
    return () => clearInterval(interval);
  }, [fetchJourneys]);

  if (loading) {
    return (
      <PageLoader label="Loading customer journeys…" />
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-page font-semibold text-fg">Customer journeys</h1>
        <p className="mt-0.5 text-body text-fg-secondary">Where each lead is in its running sequences.</p>
      </div>

      <AutoPageIntro />

      {journeys.length === 0 ? (
        <div className="text-center py-16 rounded-lg border-2 border-dashed border-line dark:border-slate-700">
          <Map className="w-10 h-10 mx-auto text-fg-tertiary mb-3" />
          <p className="text-fg dark:text-white font-semibold mb-1">No active journeys yet</p>
          <p className="text-fg-tertiary text-sm max-w-sm mx-auto mb-5">
            Journeys appear here once a lead is enrolled in a Sequence. Build one to see it tracked live.
          </p>
          <Link
            href="/automation/sequences"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium"
          >
            Go to Sequences
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {journeys.map((j) => {
            const Icon = STATUS_ICON[j.status] || Clock;
            return (
              <div key={j.executionId} className="p-5 rounded-lg bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-fg dark:text-white">{j.sequenceName}</p>
                    <p className="text-xs text-fg-tertiary">Lead {j.leadId?.slice?.(-6) || j.leadId}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    j.completed ? 'bg-accent-subtle text-accent-fg' :
                    j.failed ? 'bg-danger-subtle text-danger' :
                    j.waiting ? 'bg-warning-subtle text-warning' :
                    'bg-accent-subtle text-accent-fg'
                  }`}>
                    <Icon className="w-3 h-3" /> {j.status}
                  </span>
                </div>

                <div className="relative">
                  <div className="h-2 rounded-full bg-muted dark:bg-slate-800 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${j.progress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-subtle dark:bg-slate-800/50">
                      <p className="text-fg-tertiary mb-0.5">Previous</p>
                      <p className="font-medium text-fg-secondary dark:text-fg-disabled truncate">{j.previousStage || '—'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-accent-subtle dark:bg-teal-950/30 border border-line dark:border-teal-800">
                      <p className="text-accent-fg mb-0.5">Current</p>
                      <p className="font-medium text-accent-fg dark:text-accent-fg truncate">{j.currentStage}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-subtle dark:bg-slate-800/50">
                      <p className="text-fg-tertiary mb-0.5">Next</p>
                      <p className="font-medium text-fg-secondary dark:text-fg-disabled truncate">{j.nextStage || '—'}</p>
                    </div>
                  </div>
                </div>

                {(j.logs || []).length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-fg-tertiary cursor-pointer flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> {j.logs.length} steps logged
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {j.logs.map((log, i) => (
                        <div key={i} className="text-meta text-fg-tertiary flex gap-2">
                          <span className={log.status === 'success' ? 'text-accent-fg' : log.status === 'failed' ? 'text-danger' : ''}>
                            {log.status}
                          </span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
