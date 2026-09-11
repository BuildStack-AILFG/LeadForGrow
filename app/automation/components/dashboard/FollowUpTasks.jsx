'use client';

import Link from 'next/link';
import { CheckSquare, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import ChartCard from './primitives/ChartCard';

function taskMeta(task) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!due) return { label: 'No date', urgent: false };
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  if (dueDay < today) return { label: 'Overdue', urgent: true, Icon: AlertCircle };
  if (dueDay.getTime() === today.getTime()) return { label: 'Today', urgent: false, Icon: Clock };
  return {
    label: due.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    urgent: false,
    Icon: Clock
  };
}

export default function FollowUpTasks({ tasks = [] }) {
  const sorted = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <ChartCard
      title="Follow-ups & Tasks"
      subtitle="Due today and upcoming"
      action={
        <Link href="/automation/tasks" className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
          All tasks <ArrowRight className="w-3 h-3" />
        </Link>
      }
      className="h-full"
    >
      {sorted.length === 0 ? (
        <div className="py-8 text-center">
          <CheckSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No tasks due today</p>
          <Link href="/automation/tasks" className="text-xs text-teal-600 hover:underline mt-1 inline-block">
            Create a follow-up
          </Link>
        </div>
      ) : (
        <ul className="space-y-1">
          {sorted.slice(0, 6).map((task) => {
            const meta = taskMeta(task);
            const MetaIcon = meta.Icon || Clock;
            const leadName = task.leadId?.name || task.title || 'Follow-up';

            return (
              <li key={task._id}>
                <Link
                  href={task.leadId?._id ? `/automation/leads/${task.leadId._id}` : '/automation/tasks'}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      meta.urgent
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    <MetaIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{leadName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {task.description || task.type || 'Task'}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${
                      meta.urgent
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {meta.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </ChartCard>
  );
}
