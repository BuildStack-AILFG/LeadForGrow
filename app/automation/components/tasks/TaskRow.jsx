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
  AlertCircle
} from 'lucide-react';
import TaskTypeBadge from './TaskTypeBadge';
import { assigneeName } from '../leads/utils';
import { formatDueDate, getTimeUntil, isOverdue } from './utils';

function TaskRow({ task, onMarkDone, onReschedule, onCommunicate }) {
  const lead = task.leadId;
  const overdue = isOverdue(task.dueDate);

  return (
    <tr className="group border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
      <td className="py-3 px-3 min-w-[200px]">
        <div className="flex items-start gap-2.5">
          <TaskTypeBadge type={task.type} showLabel={false} size="xs" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{task.title}</p>
            {task.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{task.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-3 min-w-[140px]">
        {lead ? (
          <div>
            <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{lead.name}</p>
            <p className="text-[11px] text-slate-400 tabular-nums">{lead.phone || '—'}</p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3 h-3" /> Lead deleted
          </span>
        )}
      </td>
      <td className="py-3 px-3">
        <TaskTypeBadge type={task.type} size="xs" />
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <p className="text-xs text-slate-700 dark:text-slate-300 tabular-nums">{formatDueDate(task.dueDate)}</p>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mt-1 ${
            overdue
              ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          }`}
        >
          {getTimeUntil(task.dueDate)}
        </span>
      </td>
      <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400">
        {assigneeName(task.assignedTo)}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center justify-end gap-0.5">
          {task.type === 'call' && (
            <button
              type="button"
              disabled={!lead}
              onClick={() => onCommunicate(task, 'call')}
              className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
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
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
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
              className="p-1.5 rounded-md text-slate-400 hover:text-violet-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              title="Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onMarkDone(task._id)}
            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Mark done"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onReschedule(task)}
            className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Reschedule"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
          {lead?._id && (
            <Link
              href={`/automation/leads/${lead._id}`}
              className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Open lead"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(TaskRow);
