'use client';

import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  AlertCircle,
  Trash2 } from 'lucide-react';
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
        overdue ? 'border-danger/30 dark:border-red-900/50' : 'border-line dark:border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <TaskTypeBadge type={task.type} showLabel={false} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg dark:text-slate-100">{task.title}</p>
          {task.description && (
            <p className="text-xs text-fg-tertiary dark:text-fg-tertiary mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
            overdue
              ? 'bg-danger-subtle text-danger dark:bg-red-950/30 dark:text-red-400'
              : 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary'
          }`}
        >
          {getTimeUntil(task.dueDate)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-fg-tertiary dark:text-fg-tertiary mb-3">
        {lead ? (
          <>
            <span className="font-medium text-fg-secondary dark:text-fg-disabled">{lead.name}</span>
            {lead.phone && <span className="tabular-nums">{lead.phone}</span>}
          </>
        ) : (
          <span className="inline-flex items-center gap-1 text-warning dark:text-amber-300 bg-warning-subtle dark:bg-amber-950/30 px-2 py-0.5 rounded">
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
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-accent-fg dark:text-accent-fg bg-accent-subtle dark:bg-emerald-950/30 rounded disabled:opacity-40"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
          </button>
        )}
        {task.type === 'email' && (
          <button
            type="button"
            disabled={!lead}
            onClick={() => onCommunicate(task, 'email')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-info dark:text-sky-300 bg-info-subtle dark:bg-sky-950/30 rounded disabled:opacity-40"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </button>
        )}
        <button
          type="button"
          onClick={() => onMarkDone(task._id)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-fg-secondary dark:text-slate-200 bg-muted dark:bg-slate-800 rounded"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </button>
        <button
          type="button"
          onClick={() => onReschedule(task)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-fg-secondary dark:text-slate-200 bg-muted dark:bg-slate-800 rounded"
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
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-danger dark:text-red-400 bg-danger-subtle dark:bg-red-950/30 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
