'use client';

import { memo } from 'react';
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

function TaskRow({ task, onMarkDone, onReschedule, onCommunicate, onDelete }) {
  const lead = task.leadId;
  const overdue = isOverdue(task.dueDate);
  const confirm = useConfirm();

  const handleDelete = async () => {
    if (!(await confirm({ title: 'Delete task', message: `Delete "${task.title}"?`, confirmLabel: 'Delete', danger: true }))) return;
    onDelete?.(task._id);
  };

  return (
    <tr className="group border-b border-line dark:border-slate-800/80 hover:bg-subtle/80 dark:hover:bg-slate-800/30 transition-colors">
      <td className="py-3 px-3 min-w-[200px]">
        <div className="flex items-start gap-2.5">
          <TaskTypeBadge type={task.type} showLabel={false} size="xs" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg dark:text-slate-100 truncate">{task.title}</p>
            {task.description && (
              <p className="text-meta text-fg-tertiary dark:text-fg-tertiary truncate mt-0.5">{task.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-3 min-w-[140px]">
        {lead ? (
          <div>
            <p className="text-sm text-fg dark:text-slate-200 truncate">{lead.name}</p>
            <p className="text-meta text-fg-tertiary tabular-nums">{lead.phone || '—'}</p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-meta font-medium text-warning bg-warning-subtle dark:bg-amber-950/30 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3" /> Lead deleted
          </span>
        )}
      </td>
      <td className="py-3 px-3">
        <TaskTypeBadge type={task.type} size="xs" />
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <p className="text-xs text-fg-secondary dark:text-fg-disabled tabular-nums">{formatDueDate(task.dueDate)}</p>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded inline-block mt-1 ${
            overdue
              ? 'bg-danger-subtle text-danger dark:bg-red-950/30 dark:text-red-400'
              : 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary'
          }`}
        >
          {getTimeUntil(task.dueDate)}
        </span>
      </td>
      <td className="py-3 px-3 text-xs text-fg-secondary dark:text-fg-tertiary">
        {assigneeName(task.assignedTo)}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center justify-end gap-0.5">
          {task.type === 'call' && (
            <button
              type="button"
              disabled={!lead}
              onClick={() => onCommunicate(task, 'call')}
              className="p-1.5 rounded text-fg-tertiary hover:text-accent-fg hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-40"
              title="Call"
            >
              <Phone className="w-3.5 h-3.5" />
            </button>
          )}
          {task.type === 'whatsapp' && (
            <button
              type="button"
              disabled={!lead}
              onClick={() => onCommunicate(task, 'whatsapp')}
              className="p-1.5 rounded text-fg-tertiary hover:text-accent-fg hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-40"
              title="WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {task.type === 'email' && (
            <button
              type="button"
              disabled={!lead}
              onClick={() => onCommunicate(task, 'email')}
              className="p-1.5 rounded text-fg-tertiary hover:text-info hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-40"
              title="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onMarkDone(task._id)}
            className="p-1.5 rounded text-fg-tertiary hover:text-accent-fg hover:bg-muted dark:hover:bg-slate-800 transition-opacity"
            title="Mark done"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onReschedule(task)}
            className="p-1.5 rounded text-fg-tertiary hover:text-accent-fg hover:bg-muted dark:hover:bg-slate-800 transition-opacity"
            title="Reschedule"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          {lead?._id && (
            <Link
              href={`/automation/leads/${lead._id}`}
              className="p-1.5 rounded text-fg-tertiary hover:text-accent-fg hover:bg-muted dark:hover:bg-slate-800 transition-opacity"
              title="Open lead"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 rounded text-fg-tertiary hover:text-danger hover:bg-muted dark:hover:bg-slate-800 transition-opacity"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(TaskRow);
