'use client';

import Link from 'next/link';
import { CheckSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import DashboardCard from './primitives/DashboardCard';

function TaskRow({ task, variant }) {
  const colors = {
    overdue: 'border-danger/30 dark:border-red-900/30 bg-danger-subtle/30 dark:bg-red-950/10',
    today: 'border-line dark:border-slate-800',
    done: 'border-line dark:border-emerald-900/30 opacity-80',
  };

  return (
    <Link
      href="/automation/tasks"
      className={`block p-2.5 rounded-lg border ${colors[variant] || colors.today} hover:border-line dark:hover:border-emerald-800 transition-colors`}
    >
      <p className="text-sm font-medium text-fg dark:text-slate-200 truncate">{task.title || 'Task'}</p>
      {task.dueDate && (
        <p className="text-meta text-fg-tertiary dark:text-fg-tertiary mt-0.5">
          {variant === 'overdue' ? 'Overdue · ' : ''}
          {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </p>
      )}
    </Link>
  );
}

export default function DashboardTasksPanel({ tasks }) {
  const dueToday = tasks?.dueToday || [];
  const overdue = tasks?.overdue || [];
  const completed = tasks?.completedRecently || [];

  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-fg dark:text-white">Tasks</h2>
        <Link href="/automation/tasks" className="text-xs text-accent-fg dark:text-accent-fg hover:underline">All tasks</Link>
      </div>

      {overdue.length > 0 && (
        <div className="mb-4">
          <p className="text-meta font-semibold text-danger dark:text-red-400 mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Overdue ({overdue.length})
          </p>
          <div className="space-y-1.5">{overdue.slice(0, 4).map((t) => <TaskRow key={t._id} task={t} variant="overdue" />)}</div>
        </div>
      )}

      {dueToday.length > 0 && (
        <div className="mb-4">
          <p className="text-meta font-semibold text-fg-tertiary dark:text-fg-tertiary mb-2 flex items-center gap-1">
            <CheckSquare className="w-3 h-3" /> Due today
          </p>
          <div className="space-y-1.5">{dueToday.slice(0, 4).map((t) => <TaskRow key={t._id} task={t} variant="today" />)}</div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-meta font-semibold text-accent-fg dark:text-accent-fg mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completed today
          </p>
          <div className="space-y-1.5">{completed.slice(0, 3).map((t) => <TaskRow key={t._id} task={t} variant="done" />)}</div>
        </div>
      )}

      {overdue.length === 0 && dueToday.length === 0 && completed.length === 0 && (
        <p className="text-sm text-fg-tertiary dark:text-fg-tertiary py-6 text-center">No tasks for today</p>
      )}
    </DashboardCard>
  );
}
