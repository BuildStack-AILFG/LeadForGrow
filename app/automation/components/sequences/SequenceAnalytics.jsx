'use client';

import { motion } from 'framer-motion';
import { Users, CheckCircle2, Activity, TrendingUp, AlertTriangle, IndianRupee, Trophy } from 'lucide-react';
import PageLoader from '../PageLoader';

export default function SequenceAnalytics({ analytics, loading }) {
  if (loading) {
    return (
      <PageLoader label="Loading sequence analytics…" height="40vh" />
    );
  }

  if (!analytics) {
    return <p className="text-sm text-slate-500 text-center py-12">No analytics yet — activate your sequence to start tracking.</p>;
  }

  const cards = [
    { label: 'Enrolled', value: analytics.enrolled, icon: Users, iconClass: 'text-teal-500' },
    { label: 'Completion rate', value: `${analytics.completionRate}%`, icon: CheckCircle2, iconClass: 'text-emerald-500' },
    { label: 'Active runs', value: analytics.activeRuns, icon: Activity, iconClass: 'text-amber-500' },
    { label: 'Response rate', value: `${analytics.responseRate}%`, icon: TrendingUp, iconClass: 'text-violet-500' },
    { label: 'Failed', value: analytics.failed, icon: AlertTriangle, iconClass: 'text-red-500' },
  ];

  const revenue = analytics.revenue;

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <c.icon className={`w-4 h-4 ${c.iconClass} mb-2`} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Revenue generated', value: `₹${(revenue.generated || 0).toLocaleString('en-IN')}`, icon: IndianRupee },
            { label: 'Deals won', value: revenue.dealsWon || 0, icon: Trophy },
            { label: 'Avg deal value', value: `₹${(revenue.avgDealValue || 0).toLocaleString('en-IN')}`, icon: IndianRupee },
            { label: 'ROI', value: revenue.roi || 0, icon: TrendingUp },
          ].map((c) => (
            <div key={c.label} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <c.icon className="w-4 h-4 text-emerald-500 mb-2" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">{c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {analytics.abTest?.enabled && analytics.abTest.variants?.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">A/B test results</h4>
          {analytics.abTest.comparison?.winnerName && (
            <p className="text-xs text-emerald-600 mb-3">
              Leading variant: {analytics.abTest.comparison.winnerName}
              {analytics.abTest.comparison.liftPercent > 0 && ` (+${analytics.abTest.comparison.liftPercent}% lift)`}
            </p>
          )}
          <div className="space-y-2">
            {analytics.abTest.variants.map((v) => (
              <div key={v.variantId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="font-medium">{v.name}</span>
                <span className="text-slate-500">
                  {v.enrolled} enrolled · {v.replies} replies · ₹{(v.revenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.byStatus && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Execution status breakdown</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(analytics.byStatus).map(([status, count]) => (
              <span key={status} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
