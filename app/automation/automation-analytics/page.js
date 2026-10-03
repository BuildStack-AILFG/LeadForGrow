'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, GitBranch, Send, Activity, Clock, CheckCircle2, Inbox } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import PageLoader from '../components/PageLoader';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';

const ACCENTS = {
  teal: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg',
  emerald: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg',
  amber: 'bg-warning-subtle text-warning dark:bg-amber-950/40 dark:text-amber-400',
  violet: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/40 dark:text-accent-fg',
};

function StatCard({ label, value, icon: Icon, accent = 'teal' }) {
  return (
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4 hover:shadow-popover transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary">{label}</p>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ACCENTS[accent]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-2xl font-semibold text-fg dark:text-slate-50 tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

function SectionCard({ title, icon: Icon, count, children }) {
  return (
    <section className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line dark:border-slate-800">
        <h2 className="font-semibold text-fg dark:text-white flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-fg-tertiary" /> {title}
        </h2>
        {count != null && (
          <span className="text-meta font-medium text-fg-tertiary dark:text-fg-tertiary tabular-nums">{count}</span>
        )}
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, label, hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <span className="w-11 h-11 rounded-lg bg-muted dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-fg-tertiary" />
      </span>
      <p className="text-sm font-medium text-fg-secondary dark:text-fg-disabled">{label}</p>
      {hint && <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-1 max-w-[240px]">{hint}</p>}
    </div>
  );
}

function Row({ name, meta, badge, badgeAccent = 'slate' }) {
  const badgeCls = {
    teal: 'text-accent-fg bg-accent-subtle dark:bg-teal-950/40 dark:text-accent-fg',
    slate: 'text-fg-secondary bg-muted dark:bg-slate-800 dark:text-fg-disabled',
  }[badgeAccent];
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-subtle dark:hover:bg-slate-800/50 transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg dark:text-slate-100 truncate">{name}</p>
        {meta && <p className="text-meta text-fg-tertiary dark:text-fg-tertiary mt-0.5">{meta}</p>}
      </div>
      {badge != null && (
        <span className={`shrink-0 text-meta font-semibold px-2 py-0.5 rounded-full tabular-nums ${badgeCls}`}>{badge}</span>
      )}
    </div>
  );
}

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
  const workflows = data?.workflows || [];
  const broadcasts = data?.broadcasts || [];

  return (
    <div className="min-h-full bg-subtle dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/automation-analytics-icon.webp" alt="" className="w-9 h-9 shrink-0 object-contain" />
          <h1 className="text-page font-semibold text-fg text-brand-ink">Automation Analytics</h1>
        </div>
        <p className="text-sm text-fg-tertiary dark:text-fg-tertiary mb-6">Platform-wide workflow performance</p>

        <AutoPageIntro />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total runs" value={(o.totalRuns ?? 0).toLocaleString('en-IN')} icon={Activity} accent="teal" />
          <StatCard label="Success rate" value={`${o.conversionRate || 0}%`} icon={CheckCircle2} accent="emerald" />
          <StatCard label="Open executions" value={(o.openExecutions ?? 0).toLocaleString('en-IN')} icon={GitBranch} accent="amber" />
          <StatCard label="Avg duration" value={o.avgDurationMs ? `${Math.round(o.avgDurationMs / 1000)}s` : '—'} icon={Clock} accent="violet" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Workflows" icon={GitBranch} count={workflows.length || null}>
            {workflows.length === 0 ? (
              <EmptyState icon={GitBranch} label="No workflow runs yet" hint="Once your automation rules start firing, each one's run count shows up here." />
            ) : (
              <div className="space-y-0.5">
                {workflows.map((w) => (
                  <Row
                    key={w.id}
                    name={w.name}
                    meta={`${w.completed ?? 0} completed`}
                    badge={`${w.runs ?? 0} runs`}
                    badgeAccent="slate"
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Broadcasts" icon={Send} count={broadcasts.length || null}>
            {broadcasts.length === 0 ? (
              <EmptyState icon={Inbox} label="No broadcasts yet" hint="Send a WhatsApp or email campaign and its delivery totals appear here." />
            ) : (
              <div className="space-y-0.5">
                {broadcasts.map((b) => (
                  <Row
                    key={b.id}
                    name={b.name}
                    badge={`${(b.sent ?? 0).toLocaleString('en-IN')} sent`}
                    badgeAccent="teal"
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
