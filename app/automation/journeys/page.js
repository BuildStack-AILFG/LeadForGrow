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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 text-xs font-medium mb-3">
          <Map className="w-3.5 h-3.5" /> Customer Journeys
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Live journey tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time progress across all active workflow executions</p>
      </div>

      <AutoPageIntro />

      {journeys.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Map className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <p className="text-slate-900 dark:text-white font-semibold mb-1">No active journeys yet</p>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-5">
            Journeys appear here once a lead is enrolled in a Sequence. Build one to see it tracked live.
          </p>
          <Link
            href="/automation/sequences"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold"
          >
            Go to Sequences
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {journeys.map((j) => {
            const Icon = STATUS_ICON[j.status] || Clock;
            return (
              <div key={j.executionId} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{j.sequenceName}</p>
                    <p className="text-xs text-slate-500">Lead {j.leadId?.slice?.(-6) || j.leadId}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    j.completed ? 'bg-emerald-100 text-emerald-700' :
                    j.failed ? 'bg-red-100 text-red-700' :
                    j.waiting ? 'bg-amber-100 text-amber-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>
                    <Icon className="w-3 h-3" /> {j.status}
                  </span>
                </div>

                <div className="relative">
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-teal-700 transition-all duration-500"
                      style={{ width: `${j.progress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-slate-400 mb-0.5">Previous</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{j.previousStage || '—'}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                      <p className="text-teal-500 mb-0.5">Current</p>
                      <p className="font-medium text-teal-700 dark:text-teal-300 truncate">{j.currentStage}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-slate-400 mb-0.5">Next</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300 truncate">{j.nextStage || '—'}</p>
                    </div>
                  </div>
                </div>

                {(j.logs || []).length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-slate-500 cursor-pointer flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> {j.logs.length} steps logged
                    </summary>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {j.logs.map((log, i) => (
                        <div key={i} className="text-[11px] text-slate-500 flex gap-2">
                          <span className={log.status === 'success' ? 'text-emerald-500' : log.status === 'failed' ? 'text-red-500' : ''}>
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
