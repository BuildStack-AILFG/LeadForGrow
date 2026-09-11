'use client';

import { MessageCircle, Mail, Sparkles, CheckCircle2, XCircle, Clock } from 'lucide-react';
import PageLoader from '../PageLoader';

const STATUS_ICON = {
  success: CheckCircle2,
  failed: XCircle,
  running: Clock,
  skipped: Clock,
};

const TYPE_COLORS = {
  send_whatsapp: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  send_email: 'text-violet-500 bg-violet-50 dark:bg-violet-950/30',
  ai_whatsapp_reply: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
};

function LogIcon({ type }) {
  if (type?.includes('whatsapp') || type?.includes('ai_')) return MessageCircle;
  if (type?.includes('email')) return Mail;
  if (type?.startsWith('ai_')) return Sparkles;
  return Clock;
}

export default function ExecutionLogs({ executions, timeline, loading }) {
  if (loading) {
    return (
      <PageLoader label="Loading execution logs…" height="40vh" />
    );
  }

  const feed = timeline?.length ? timeline : executions?.flatMap((ex) =>
    (ex.logs || []).map((log) => ({ ...log, lead: ex.lead, executionStatus: ex.status }))
  ) || [];

  if (!feed.length) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-slate-500">No execution activity yet</p>
        <p className="text-xs text-slate-400 mt-1">Logs appear here when leads enter this sequence</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Live activity feed</h4>
        {feed.slice(0, 40).map((log, i) => {
          const Icon = LogIcon(log.nodeType);
          const StatusIcon = STATUS_ICON[log.status] || Clock;
          const colorClass = TYPE_COLORS[log.nodeType] || 'text-slate-500 bg-slate-50 dark:bg-slate-800';
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 dark:text-slate-200">{log.message || log.nodeType}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  {log.lead?.name && <span>{log.lead.name}</span>}
                  <StatusIcon className={`w-3 h-3 ${log.status === 'success' ? 'text-emerald-500' : log.status === 'failed' ? 'text-red-500' : 'text-slate-400'}`} />
                  <span>{log.executedAt ? new Date(log.executedAt).toLocaleString() : ''}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {executions?.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">Recent enrollments</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Lead</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Steps</th>
                  <th className="text-left px-4 py-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {executions.slice(0, 15).map((ex) => (
                  <tr key={ex._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{ex.lead?.name || 'Unknown'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ex.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        ex.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-teal-100 text-teal-700'
                      }`}>{ex.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{ex.logs?.length || 0}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{ex.startedAt ? new Date(ex.startedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
