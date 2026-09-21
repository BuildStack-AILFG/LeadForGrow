'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import DashboardCard from './primitives/DashboardCard';
import { formatCurrency } from '@/lib/crm/formatCurrency';

function Metric({ label, value, sub }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums mt-1">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function RevenueSnapshot({ revenue, currency = 'INR' }) {
  if (!revenue) return null;

  const monthUp = (revenue.monthChange ?? 0) >= 0;

  return (
    <DashboardCard padding="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Revenue Snapshot</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">From real deal records — never mixed</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Metric label="Pipeline Revenue" value={formatCurrency(revenue.pipelineRevenue, currency)} sub="Open deals only" />
        <Metric label="Won Revenue" value={formatCurrency(revenue.wonRevenue, currency)} sub={`${revenue.wonCount || 0} deals won`} />
        <Metric label="Lost Revenue" value={formatCurrency(revenue.lostRevenue, currency)} sub={`${revenue.lostCount || 0} deals lost`} />
        <Metric label="Expected Revenue" value={formatCurrency(revenue.expectedRevenue, currency)} sub="Pipeline × probability" />
        <Metric label="Conversion Rate" value={`${revenue.conversionRate || 0}%`} sub="Won vs closed" />
        <Metric label="Avg Deal Size" value={formatCurrency(revenue.avgDealSize, currency)} sub="Won deals" />
      </div>

      <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Won this month</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatCurrency(revenue.wonThisMonth, currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">vs last month</p>
          <p className={`text-sm font-semibold inline-flex items-center gap-1 ${monthUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {monthUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatCurrency(revenue.wonLastMonth, currency)}
            <span className="text-xs">({revenue.monthChange >= 0 ? '+' : ''}{revenue.monthChange}%)</span>
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
