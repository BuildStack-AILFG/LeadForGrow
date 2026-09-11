'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, AlertTriangle, MessageSquare, TrendingUp, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import DashboardCard from './primitives/DashboardCard';

function InsightTile({ icon: Icon, label, value, sub, color, href }) {
  const inner = (
  <div className={`p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors ${href ? 'cursor-pointer' : ''}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AiInsightsPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/ai/insights')
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatCur = (n) => {
    const v = Number(n) || 0;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toLocaleString()}`;
  };

  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">AI Insights</h2>
            <p className="text-xs text-slate-500">Powered by Grovia</p>
          </div>
        </div>
        <Link href="/automation/ai/knowledge" className="text-xs text-violet-600 hover:underline flex items-center gap-0.5">
          Knowledge <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : !data ? (
        <p className="text-sm text-slate-500 py-4">Insights unavailable</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InsightTile
              icon={Flame}
              label="Hot Leads"
              value={data.hotLeads?.length || 0}
              sub={data.hotLeads?.[0]?.name ? `${data.hotLeads[0].name} — ${data.hotLeads[0].action}` : 'No hot leads'}
              color="text-orange-600 bg-orange-50 dark:bg-orange-950/30"
              href="/automation/leads"
            />
            <InsightTile
              icon={AlertTriangle}
              label="Deals at Risk"
              value={data.dealsAtRisk?.length || 0}
              sub={data.dealsAtRisk?.[0]?.title || 'Pipeline healthy'}
              color="text-red-600 bg-red-50 dark:bg-red-950/30"
              href="/automation/deals"
            />
            <InsightTile
              icon={MessageSquare}
              label="Customers Waiting"
              value={data.customersWaiting || 0}
              sub="Unread conversations"
              color="text-teal-600 bg-teal-50 dark:bg-teal-950/30"
              href="/automation/chat"
            />
            <InsightTile
              icon={TrendingUp}
              label="Pipeline Value"
              value={formatCur(data.pipelineValue)}
              sub={`${data.stats?.activeDeals || 0} active deals`}
              color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
              href="/automation/pipelines"
            />
          </div>

          {data.nextBestActions?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Next Best Actions</p>
              <ul className="space-y-1.5">
                {data.nextBestActions.slice(0, 3).map((a, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                    <span className="text-violet-500 font-medium shrink-0">{a.leadName}</span>
                    <span className="truncate">{a.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </DashboardCard>
  );
}
