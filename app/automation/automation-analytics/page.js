'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, BarChart3, GitBranch, Send, Activity } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';

export default function AutomationAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/automation/analytics');
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return <PageLoader label="Loading analytics…" />;
  }

  const o = data?.overview || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Automation Analytics</h1>
      <p className="text-sm text-slate-500 mb-8">Platform-wide workflow performance</p>

      <AutoPageIntro />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total runs', value: o.totalRuns, icon: Activity, color: 'blue' },
          { label: 'Success rate', value: `${o.conversionRate || 0}%`, icon: BarChart3, color: 'emerald' },
          { label: 'Open executions', value: o.openExecutions, icon: GitBranch, color: 'amber' },
          { label: 'Avg duration', value: o.avgDurationMs ? `${Math.round(o.avgDurationMs / 1000)}s` : '—', icon: Activity, color: 'violet' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{s.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> Workflows
          </h2>
          <div className="space-y-2">
            {(data?.workflows || []).map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <span className="text-slate-700 dark:text-slate-300 truncate">{w.name}</span>
                <span className="text-xs text-slate-500 shrink-0 ml-2">{w.runs} runs · {w.completed} done</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4" /> Broadcasts
          </h2>
          <div className="space-y-2">
            {(data?.broadcasts || []).length === 0 ? (
              <p className="text-sm text-slate-500">No broadcasts yet</p>
            ) : (
              data.broadcasts.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{b.name}</span>
                  <span className="text-xs text-slate-500">{b.sent} sent</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
