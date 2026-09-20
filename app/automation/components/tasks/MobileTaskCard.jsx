'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  AlertCircle,
  Trash2
} from 'lucide-react';
import TaskTypeBadge from './TaskTypeBadge';
import { assigneeName } from '../leads/utils';
import { formatDueDate, getTimeUntil, isOverdue } from './utils';
import { useConfirm } from '@/app/components/ConfirmProvider';

export default function MobileTaskCard({ task, onMarkDone, onReschedule, onCommunicate, onDelete }) {
  const lead = task.leadId;
  const overdue = isOverdue(task.dueDate);
  const confirm = useConfirm();

  const handleDelete = async () => {
    if (!(await confirm({ title: 'Delete task', message: `Delete "${task.title}"?`, confirmLabel: 'Delete', danger: true }))) return;
    onDelete?.(task._id);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm ${
        overdue ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <TaskTypeBadge type={task.type} showLabel={false} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
            overdue
              ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {getTimeUntil(task.dueDate)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
        {lead ? (
          <>
            <span className="font-medium text-slate-700 dark:text-slate-300">{lead.name}</span>
            {lead.phone && <span className="tabular-nums">{lead.phone}</span>}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" /> Lead deleted
          </span>
        )}
        <span>·</span>
        <span>{assigneeName(task.assignedTo)}</span>
        <span>·</span>
        <span className="tabular-nums">{formatDueDate(task.dueDate)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {task.type === 'call' && (
          <button
            type="button"
            disabled={!lead}
            onClick={() => onCommunicate(task, 'call')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-ink bg-brand-tint dark:bg-teal-950/30 rounded disabled:opacity-40"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
        )}
        {task.type === 'whatsapp' && (
          <button
            type="button"
            disabled={!lead}
            onClick={() => onCommunicate(task, 'whatsapp')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 rounded disabled:opacity-40"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </button>
        )}
        {task.type === 'email' && (
          <button
            type="button"
            disabled={!lead}
            onClick={() => onCommunicate(task, 'email')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 rounded disabled:opacity-40"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
        )}
        <button
          type="button"
          onClick={() => onMarkDone(task._id)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </button>
        <button
          type="button"
          onClick={() => onReschedule(task)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded"
        >
          <Calendar className="w-3.5 h-3.5" /> Reschedule
        </button>
        {lead?._id && (
          <Link
            href={`/automation/leads/${lead._id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-ink bg-brand-tint dark:bg-teal-950/30 rounded"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Lead
          </Link>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
