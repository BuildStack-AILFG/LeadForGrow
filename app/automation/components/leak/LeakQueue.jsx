'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Send, MoreHorizontal, ListChecks, UserPlus, PhoneCall, Clock, UserX, ThumbsDown,
  Loader2, CheckCircle2, BellOff,
} from 'lucide-react';
import { RULES, formatDuration } from '@/lib/leak/rules';
import { TemplateDialog, ReasonDialog, ReassignDialog } from './LeakDialogs';

const SEVERITY = {
  high: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export const ago = (d) => (d ? formatDuration((Date.now() - new Date(d).getTime()) / 60000) : '');

export default function LeakQueue({ lr, mode }) {
  const [dialog, setDialog] = useState(null); // { kind, flag }
  const counts = lr.counts || {};
  const total = counts.all || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'R2', 'R1', 'R3', 'R5', 'R4'].map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={lr.rule === r}
            onClick={() => lr.changeRule(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              lr.rule === r
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {r === 'all' ? `All ${total}` : `${RULES[r].label} ${counts[r] || 0}`}
          </button>
        ))}
        {mode === 'radar' && (
          <AssigneeFilter lr={lr} />
        )}
      </div>

      {lr.listLoading && !lr.flags.length ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
      ) : lr.flags.length === 0 ? (
        <EmptyState mode={mode} filtered={lr.rule !== 'all'} />
      ) : (
        <ul className="space-y-3">
          {lr.flags.map((f) => (
            <LeakCard key={f.leadId} flag={f} mode={mode} busy={!!lr.busy[f.leadId]} lr={lr} onDialog={(kind) => setDialog({ kind, flag: f })} />
          ))}
        </ul>
      )}

      {dialog?.kind === 'template' && (
        <TemplateDialog flag={dialog.flag} onClose={() => setDialog(null)} onSend={(t) => lr.sendTemplate(dialog.flag, t)} />
      )}
      {dialog?.kind === 'reassign' && (
        <ReassignDialog flag={dialog.flag} loadTeam={lr.ensureTeam} onClose={() => setDialog(null)} onPick={(m) => lr.reassign(dialog.flag, m)} />
      )}
      {['outside', 'snooze', 'unqualified', 'dismiss'].includes(dialog?.kind) && (
        <ReasonDialog
          kind={dialog.kind}
          flag={dialog.flag}
          onClose={() => setDialog(null)}
          onSubmit={({ note, hours }) => {
            const f = dialog.flag;
            if (dialog.kind === 'outside') return lr.workedOutside(f, note);
            if (dialog.kind === 'snooze') return lr.snooze(f, hours, note);
            if (dialog.kind === 'unqualified') return lr.markUnqualified(f, note);
            return lr.dismiss(f, note);
          }}
        />
      )}
    </div>
  );
}

function AssigneeFilter({ lr }) {
  const [members, setMembers] = useState([]);
  useEffect(() => { lr.ensureTeam().then(setMembers).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <select
      aria-label="Filter by salesperson"
      value={lr.assignee}
      onChange={(e) => lr.changeAssignee(e.target.value)}
      className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
    >
      <option value="all">Everyone</option>
      <option value="unassigned">Unassigned</option>
      {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
    </select>
  );
}

function LeakCard({ flag, mode, busy, lr, onDialog }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const canTemplate = !flag.lead.optedOutOfWhatsApp && Boolean(flag.lead.phone);
  const top = flag.flags[0]; // most urgent first
  const since = top.evidence?.awaitingReplySince || top.evidence?.createdAt || flag.detectedAt;

  return (
    <li className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/automation/leads/${flag.leadId}`} className="font-semibold text-slate-900 dark:text-white hover:text-teal-700 dark:hover:text-teal-400 truncate">
              {flag.lead.name || 'Unnamed lead'}
            </Link>
            {flag.flags.map((f) => (
              <span key={f.id} className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${SEVERITY[f.severity]}`}>{RULES[f.rule]?.label}</span>
            ))}
            {flag.inProgress && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded border bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> In progress
              </span>
            )}
            {flag.lead.optedOutOfWhatsApp && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 inline-flex items-center gap-1">
                <BellOff className="w-3 h-3" /> Opted out of WhatsApp
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">{top.reason}</p>
          {flag.flags.slice(1).map((f) => (
            <p key={f.id} className="mt-0.5 text-xs text-slate-500">{f.reason}</p>
          ))}
          <p className="mt-1 text-xs text-slate-500">
            {[flag.lead.source, flag.lead.stage, mode === 'radar' ? (flag.assignedTo?.name || 'Unassigned') : null].filter(Boolean).join(' · ')}
          </p>
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums" title={new Date(since).toLocaleString('en-IN')}>{ago(since)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canTemplate && (
          <button type="button" disabled={busy} onClick={() => onDialog('template')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send template
          </button>
        )}
        <Link href={`/automation/chat?leadId=${flag.leadId}`} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border ${canTemplate ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700'}`}>
          <MessageCircle className="w-4 h-4" /> Reply
        </Link>
        <button type="button" disabled={busy} onClick={() => lr.createTask(flag)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50">
          <ListChecks className="w-4 h-4" /> Follow-up task
        </button>
        <div className="relative ml-auto" ref={menuRef}>
          <button type="button" aria-haspopup="menu" aria-expanded={menu} disabled={busy} onClick={() => setMenu((m) => !m)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" aria-label="More actions">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menu && (
            <div role="menu" className="absolute right-0 z-20 mt-1 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg py-1">
              {[
                ['outside', PhoneCall, 'Worked outside CRM'],
                ...(mode === 'radar' ? [['reassign', UserPlus, 'Give to someone else']] : []),
                ['snooze', Clock, 'Snooze'],
                ['unqualified', UserX, 'Mark unqualified'],
                ['dismiss', ThumbsDown, 'Not a leak'],
              ].map(([kind, Icon, text]) => (
                <button key={kind} type="button" role="menuitem" onClick={() => { setMenu(false); onDialog(kind); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left">
                  <Icon className="w-4 h-4 text-slate-400" /> {text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function EmptyState({ mode, filtered }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-14 px-6 text-center">
      <CheckCircle2 className="w-8 h-8 text-teal-600 mx-auto" />
      <p className="mt-3 font-semibold text-slate-900 dark:text-white">
        {filtered ? 'Nothing here for this filter.' : mode === 'mine' ? 'Nothing is slipping on your leads.' : 'No enquiries are slipping right now.'}
      </p>
      <p className="mt-1 text-sm text-slate-500">New leaks appear here within 15 minutes.</p>
    </div>
  );
}
