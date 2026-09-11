'use client';

import { TrendingUp, Eye, Percent, Users } from 'lucide-react';
import SubmissionsTable from './SubmissionsTable';
import { calcConversionRate } from './constants';

export default function AnalyticsView({ form, submissions, submissionsLoading, stats }) {
  const rate = form ? calcConversionRate(form) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">Track performance for {form?.name}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Submissions', value: form?.submissionCount || 0, icon: TrendingUp },
          { label: 'Conversion', value: `${rate}%`, icon: Percent },
          { label: 'Est. views', value: (form?.submissionCount || 0) * 3, icon: Eye },
          { label: 'Total forms', value: stats.totalForms, icon: Users },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm">
              <Icon className="w-4 h-4 text-teal-600 mb-2" />
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          );
        })}
      </div>

      <SubmissionsTable submissions={submissions} loading={submissionsLoading} formName={form?.name} />
    </div>
  );
}
