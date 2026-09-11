'use client';

import { Users, Building2, FileText, GitBranch, Crown, TrendingUp, ArrowUpRight } from 'lucide-react';
import { PLAN_LABELS, planBadgeClass } from '../constants';

const STAT_CARDS = [
  { key: 'users', label: 'Users', icon: Users, iconClass: 'text-teal-500' },
  { key: 'businesses', label: 'Businesses', icon: Building2, iconClass: 'text-emerald-500' },
  { key: 'forms', label: 'Forms', icon: FileText, iconClass: 'text-violet-500' },
  { key: 'leads', label: 'Leads', icon: TrendingUp, iconClass: 'text-amber-500' },
  { key: 'sequences', label: 'Sequences', icon: GitBranch, iconClass: 'text-cyan-500' },
  { key: 'agencies', label: 'Agencies', icon: Crown, iconClass: 'text-rose-500' },
];

export default function AdminDashboard({ dashboard, onSelectModel, loading }) {
  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboard) return null;

  const { counts, planBreakdown, recentUsers, recentBusinesses } = dashboard;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time snapshot of LeadForGrow</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <card.icon className={`w-4 h-4 ${card.iconClass} mb-2`} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts[card.key] ?? 0}</p>
            <p className="text-xs text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan breakdown */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" /> Businesses by plan
          </h3>
          <div className="space-y-2">
            {planBreakdown?.length ? planBreakdown.map((item) => {
              const total = counts.businesses || 1;
              const pct = Math.round((item.count / total) * 100);
              const label = PLAN_LABELS[item.plan?.toLowerCase?.()] || item.plan || 'Unknown';
              return (
                <div key={item.plan} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border capitalize min-w-[80px] ${planBadgeClass(item.plan)}`}>
                    {label}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-700 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">{item.count}</span>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-400">No businesses yet</p>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-teal-600 p-5 text-white">
          <h3 className="text-sm font-bold mb-4">Quick access</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { model: 'Business', label: 'Manage businesses' },
              { model: 'User', label: 'Manage users' },
              { model: 'Lead', label: 'View leads' },
              { model: 'AutomationSequence', label: 'Sequences' },
            ].map((item) => (
              <button
                key={item.model}
                type="button"
                onClick={() => onSelectModel(item.model)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors text-left"
              >
                {item.label}
                <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentTable
          title="Recent users"
          columns={['email', 'role', 'createdAt']}
          rows={recentUsers}
        />
        <RecentTable
          title="Recent businesses"
          columns={['businessName', 'plan', 'createdAt']}
          rows={recentBusinesses}
          planCol="plan"
        />
      </div>
    </div>
  );
}

function RecentTable({ title, columns, rows, planCol }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase">
              {columns.map((c) => (
                <th key={c} className="text-left px-5 py-2 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {!rows?.length ? (
              <tr><td colSpan={columns.length} className="px-5 py-6 text-slate-400 text-center">No records</td></tr>
            ) : rows.map((row) => (
              <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {columns.map((col) => (
                  <td key={col} className="px-5 py-2.5 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                    {planCol === col && row[col] ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border capitalize ${planBadgeClass(row[col], 'light')}`}>
                        {row[col]}
                      </span>
                    ) : col.includes('At') && row[col] ? (
                      new Date(row[col]).toLocaleDateString()
                    ) : (
                      String(row[col] ?? '—')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
