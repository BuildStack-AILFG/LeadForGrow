'use client';

import Link from 'next/link';
import { Trophy, TrendingUp } from 'lucide-react';

function formatValue(amount, currency = 'INR') {
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';
  const n = Number(amount) || 0;
  if (n >= 100000) return `${sym}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toLocaleString()}`;
}

export default function CrmDealsWidget({ crmDashboard }) {
  if (!crmDashboard) return null;

  const { deals, recentWins, conversionRate, todayLeads, pipeline } = crmDashboard;
  const openDeals = deals?.openDeals ?? deals?.totalDeals ?? 0;
  const pipelineValue = deals?.openValue ?? deals?.totalValue ?? 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-white">CRM Overview</h3>
        <Link href="/automation/deals" className="text-xs text-emerald-600 hover:underline">View deals</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-500">Today&apos;s Leads</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{todayLeads || 0}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-xs text-slate-500">Open Deals</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{openDeals}</p>
        </div>
        <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg">
          <p className="text-xs text-slate-500">Revenue Won</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatValue(deals?.wonValue)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{deals?.wonCount || 0} deals closed</p>
        </div>
        <div className="p-3 bg-teal-50/60 dark:bg-teal-950/20 rounded-lg">
          <p className="text-xs text-slate-500">In Pipeline</p>
          <p className="text-lg font-bold text-teal-700 dark:text-teal-400">{formatValue(pipelineValue)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{openDeals} open deals</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Lead Conversion</p>
          <p className="text-lg font-bold text-emerald-600">{conversionRate || 0}%</p>
        </div>
      </div>

      {pipeline?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Deal pipeline</p>
          <div className="flex flex-wrap gap-1.5">
            {pipeline.slice(0, 6).map((s) => (
              <span key={s._id} className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                {String(s._id).replace(/_/g, ' ')} · {s.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {recentWins?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1"><Trophy className="w-3 h-3" /> Recent Wins</p>
          <div className="space-y-2">
            {recentWins.slice(0, 3).map((d) => (
              <Link key={d._id} href={`/automation/deals/${d._id}`} className="flex justify-between text-sm hover:text-emerald-600">
                <span className="truncate">{d.title}</span>
                <span className="font-medium text-emerald-600 ml-2">{formatValue(d.amount, d.currency)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
