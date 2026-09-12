'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AutoPageIntro from '../components/shared/tour/AutoPageIntro';
import {
  Plus,
  Workflow,
  Search,
  Copy,
  Trash2,
  Upload,
  Play,
  FileDown,
  Zap,
  CheckCircle2,
  Activity,
  TrendingDown,
  Target,
  MessageCircle,
} from 'lucide-react';
import { authFetch } from '@/lib/apiClient';
import { useConfirm } from '@/app/components/ConfirmProvider';

const STATUS_STYLES = {
  draft: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
};

export default function WhatsAppFlowsPage() {
  const confirm = useConfirm();
  const router = useRouter();
  const [flows, setFlows] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [flowsRes, analyticsRes] = await Promise.all([
        authFetch(`/api/automation/whatsapp-flows${q ? `?q=${encodeURIComponent(q)}` : ''}`),
        authFetch('/api/automation/whatsapp-flows/analytics'),
      ]);
      const flowsData = await flowsRes.json();
      const analyticsData = await analyticsRes.json();
      if (flowsData.success) setFlows(flowsData.data || []);
      if (analyticsData.success) setAnalytics(analyticsData.data);
    } catch {
      toast.error('Failed to load flows');
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function createFlow() {
    setCreating(true);
    try {
      const res = await authFetch('/api/automation/whatsapp-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New WhatsApp Flow', triggerType: 'incoming_message' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Flow created');
      router.push(`/automation/whatsapp-flows/${data.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  }

  async function duplicateFlow(id) {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Duplicated');
      load();
    } catch (err) {
      toast.error(err.message || 'Duplicate failed');
    }
  }

  async function deleteFlow(id) {
    if (!(await confirm({ title: 'Delete flow', message: 'Delete this flow and all versions?', confirmLabel: 'Delete', danger: true }))) return;
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  }

  async function importFlow(file) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await authFetch('/api/automation/whatsapp-flows/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Imported');
      router.push(`/automation/whatsapp-flows/${data.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Import failed');
    }
  }

  async function exportFlow(id, name) {
    try {
      const res = await authFetch(`/api/automation/whatsapp-flows/${id}/export`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(name || 'flow').replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  }

  const stats = [
    { label: 'Total executions', value: analytics?.totalExecutions ?? 0, icon: Activity, iconClass: 'text-teal-500' },
    { label: 'Active flows', value: analytics?.activeFlows ?? 0, icon: Zap, iconClass: 'text-emerald-500' },
    { label: 'Completed', value: analytics?.completedFlows ?? 0, icon: CheckCircle2, iconClass: 'text-violet-500' },
    { label: 'Drop-off rate', value: analytics ? `${analytics.dropOffRate}%` : '0%', icon: TrendingDown, iconClass: 'text-amber-500' },
    { label: 'Conversion', value: analytics ? `${analytics.conversionRate}%` : '0%', icon: Target, iconClass: 'text-indigo-500' },
  ];

  return (
    <div className="min-h-full bg-[#f4f6fa] text-slate-900" data-theme="light">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium mb-3">
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Automation
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              WhatsApp Flows
            </h1>
            <p className="text-slate-500 mt-1 text-sm max-w-lg">
              Build premium no-code WhatsApp journeys — triggers, interactive messages, logic, and analytics for any business.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              Import
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && importFlow(e.target.files[0])}
              />
            </label>
            <button
              type="button"
              onClick={createFlow}
              disabled={creating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create flow
            </button>
          </div>
        </div>

        <AutoPageIntro />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-2xl bg-white/80 backdrop-blur border border-slate-200/80 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-4 h-4 ${s.iconClass}`} />
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search flows…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 lfg-skeleton" />
            ))}
          </div>
        ) : flows.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-sm mb-4">
              <Workflow className="w-8 h-8 text-white" />
            </div>
            <p className="text-slate-900 font-semibold text-lg">No flows yet</p>
            <p className="text-slate-500 text-sm mt-1 mb-5 max-w-sm mx-auto">
              Create your first WhatsApp automation flow — keywords, buttons, lists, and smart routing.
            </p>
            <button
              type="button"
              onClick={createFlow}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Create flow
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {flows.map((flow, i) => (
              <motion.div
                key={flow._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/automation/whatsapp-flows/${flow._id}`}
                        className="font-semibold text-slate-900 group-hover:text-teal-600 truncate transition-colors"
                      >
                        {flow.name}
                      </Link>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[flow.status] || STATUS_STYLES.draft}`}>
                        {flow.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {flow.description || `Trigger: ${String(flow.triggerType || '').replace(/_/g, ' ')}`}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                      <span>{flow.analytics?.totalExecutions || 0} runs</span>
                      <span>·</span>
                      <span>{flow.analytics?.completed || 0} completed</span>
                      <span>·</span>
                      <span>v{flow.publishedVersion || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
                  <Link
                    href={`/automation/whatsapp-flows/${flow._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => exportFlow(flow._id, flow.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Export"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateFlow(flow._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFlow(flow._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {analytics?.nodeAnalytics?.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Node analytics</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Node</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Entered</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Dropped</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.nodeAnalytics.slice(0, 12).map((n) => (
                    <tr key={`${n.flowId}-${n.nodeKey}`} className="border-t border-slate-100">
                      <td className="px-4 py-2.5 font-medium text-slate-900">{n.label}</td>
                      <td className="px-4 py-2.5 text-slate-500">{n.type}</td>
                      <td className="px-4 py-2.5 text-slate-700">{n.entered}</td>
                      <td className="px-4 py-2.5 text-slate-700">{n.completed}</td>
                      <td className="px-4 py-2.5 text-slate-700">{n.dropped}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
