'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, RefreshCw, Download, Loader2, CheckCircle2, Eye, AlertCircle, UserX, Send, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authFetch } from '@/lib/apiClient';
import { decodeMetaError, extractErrorCode } from '@/lib/whatsapp/metaErrors';
import PageLoader from '../components/PageLoader';

const STATUS_META = {
  sent: { label: 'Sent', color: 'text-slate-700', bg: 'bg-slate-100', Icon: Send },
  delivered: { label: 'Delivered', color: 'text-teal-700', bg: 'bg-teal-100', Icon: CheckCircle2 },
  read: { label: 'Read', color: 'text-emerald-700', bg: 'bg-emerald-100', Icon: Eye },
  failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100', Icon: AlertCircle },
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100', Icon: Loader2 },
  skipped: { label: 'Skipped', color: 'text-slate-500', bg: 'bg-slate-100', Icon: UserX },
  opted_out: { label: 'Opted out', color: 'text-purple-700', bg: 'bg-purple-100', Icon: UserX },
};

const FILTERS = ['all', 'delivered', 'read', 'failed', 'pending', 'sent'];

export default function BroadcastDetail({ broadcastId, onClose }) {
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/automation/broadcasts/${broadcastId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setBroadcast(data.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (broadcastId) load(); /* eslint-disable-next-line */ }, [broadcastId]);

  const stats = useMemo(() => {
    const recipients = broadcast?.recipients || [];
    const counts = { sent: 0, delivered: 0, read: 0, failed: 0, pending: 0, skipped: 0, opted_out: 0 };
    for (const r of recipients) counts[r.status] = (counts[r.status] || 0) + 1;
    counts.total = recipients.length;
    // "sent successfully" = delivered + read (they were also sent+delivered)
    counts.reached = counts.delivered + counts.read;
    return counts;
  }, [broadcast]);

  const filtered = useMemo(() => {
    const recipients = broadcast?.recipients || [];
    return recipients
      .filter((r) => filter === 'all' || r.status === filter)
      .filter((r) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (r.name || '').toLowerCase().includes(q) || (r.phone || '').includes(q);
      });
  }, [broadcast, filter, query]);

  const exportFailedCsv = () => {
    const failed = (broadcast?.recipients || []).filter((r) => r.status === 'failed');
    const rows = [['Name', 'Phone', 'Reason', 'Code', 'When']];
    for (const r of failed) {
      rows.push([r.name || '', r.phone || '', r.error || '', r.failureCode || '', r.failedAt ? new Date(r.failedAt).toISOString() : '']);
    }
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-${broadcast?.name || 'broadcast'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!broadcastId) return null;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto relative w-full max-w-3xl h-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {broadcast?.channel === 'email' ? <Mail className="w-4 h-4 text-violet-500" /> : <MessageCircle className="w-4 h-4 text-emerald-500" />}
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {broadcast?.name || (loading ? 'Loading…' : 'Broadcast')}
              </h2>
            </div>
            {broadcast?.content?.whatsappTemplateName && (
              <p className="text-xs text-slate-500 mt-1">
                Template: <span className="font-mono">{broadcast.content.whatsappTemplateName}</span>
                {broadcast.content.whatsappTemplateLanguage ? ` · ${broadcast.content.whatsappTemplateLanguage}` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1"><PageLoader label="Loading broadcast…" height="100%" /></div>
        ) : broadcast ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
              <StatTile label="Total" value={stats.total} />
              <StatTile label="Delivered" value={stats.delivered + stats.read} tone="blue" hint={stats.total ? `${Math.round(((stats.delivered + stats.read) / stats.total) * 100)}%` : null} />
              <StatTile label="Read" value={stats.read} tone="emerald" hint={stats.total ? `${Math.round((stats.read / stats.total) * 100)}%` : null} />
              <StatTile label="Failed" value={stats.failed} tone="red" hint={stats.total ? `${Math.round((stats.failed / stats.total) * 100)}%` : null} />
            </div>

            {stats.opted_out > 0 && (
              <div className="mx-5 mb-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 p-2 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <UserX className="w-3.5 h-3.5" />
                {stats.opted_out} recipients skipped — previously opted out
              </div>
            )}

            {broadcast?.abortReason && (
              <div className="mx-5 mb-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Broadcast auto-paused by quality guardrail</p>
                  <p className="mt-1">{broadcast.abortReason}</p>
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="px-5 pb-3 flex flex-wrap gap-2 items-center">
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                {FILTERS.map((f) => {
                  const count = f === 'all' ? stats.total : (stats[f] || 0);
                  return (
                    <button key={f} type="button" onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md ${
                        filter === f ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)} {count > 0 && <span className="text-slate-400">{count}</span>}
                    </button>
                  );
                })}
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name / phone"
                className="flex-1 min-w-[160px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
              {stats.failed > 0 && (
                <button type="button" onClick={exportFailedCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100">
                  <Download className="w-3.5 h-3.5" /> Export failed
                </button>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-16">No recipients match this view</p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase tracking-wide">
                      <tr>
                        <th className="text-left p-2 font-medium">Recipient</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-left p-2 font-medium">When</th>
                        <th className="text-left p-2 font-medium">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filtered.map((r, i) => {
                        const meta = STATUS_META[r.status] || STATUS_META.pending;
                        const Icon = meta.Icon;
                        return (
                          <tr key={r.leadId ? `${r.leadId}-${i}` : i} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                            <td className="p-2">
                              <p className="font-medium text-slate-900 dark:text-white truncate max-w-[180px]">{r.name || 'Unnamed'}</p>
                              <p className="text-[10px] text-slate-500">{r.phone || r.email}</p>
                            </td>
                            <td className="p-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
                                <Icon className="w-3 h-3" /> {meta.label}
                              </span>
                            </td>
                            <td className="p-2 text-slate-500 whitespace-nowrap">
                              {r.readAt ? relTime(r.readAt) : r.deliveredAt ? relTime(r.deliveredAt) : r.failedAt ? relTime(r.failedAt) : r.sentAt ? relTime(r.sentAt) : '—'}
                            </td>
                            <td className="p-2 text-slate-500 max-w-[280px]">
                              {r.error ? (
                                <FailureCell error={r.error} failureCode={r.failureCode} failureTitle={r.failureTitle} />
                              ) : r.status === 'opted_out' ? (
                                <span className="text-purple-700">Previously opted out</span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FailureCell({ error, failureCode, failureTitle }) {
  const code = failureCode || extractErrorCode(error);
  const decoded = code ? decodeMetaError(code, error) : null;
  const [expanded, setExpanded] = useState(false);

  if (!decoded?.isKnown) {
    return (
      <span className="text-red-600" title={error}>
        {failureTitle ? `${failureTitle}: ` : ''}{truncate(error, 80)}
      </span>
    );
  }

  return (
    <div className="text-red-700">
      <button type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-start gap-1 text-left hover:underline">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 border border-red-200 shrink-0 mt-0.5">
          {decoded.code}
        </span>
        <span className="font-medium">{decoded.title}</span>
      </button>
      {expanded && (
        <div className="mt-1.5 bg-red-50 border border-red-200 rounded-md p-2 space-y-1 text-[11px] text-slate-700">
          <p><span className="font-semibold text-slate-900">Why:</span> {decoded.explanation}</p>
          <p><span className="font-semibold text-slate-900">Fix:</span> {decoded.actionable}</p>
          {error && <p className="text-[10px] text-slate-500 font-mono truncate" title={error}>Raw: {error}</p>}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, tone = 'slate', hint }) {
  const toneMap = {
    slate: 'text-slate-900 dark:text-white',
    blue: 'text-teal-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900">
      <p className="text-[10px] uppercase font-medium text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${toneMap[tone]}`}>{value}</p>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function relTime(input) {
  if (!input) return '—';
  const d = new Date(input);
  const diff = Date.now() - d.getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
