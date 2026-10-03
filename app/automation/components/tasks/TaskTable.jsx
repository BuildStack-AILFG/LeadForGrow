'use client';

import { TABLE_COLUMNS } from './constants';
import TaskRow from './TaskRow';

export default function TaskTable({ tasks, onMarkDone, onReschedule, onCommunicate, onDelete }) {
  return (
    <div className="bg-subtle dark:bg-slate-900 border border-line dark:border-slate-800 rounded-[4px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-subtle dark:bg-slate-900/95 border-b border-line dark:border-slate-800">
            <tr>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="py-3.5 px-3 text-body font-semibold text-fg dark:text-slate-200 whitespace-nowrap border-r border-white dark:border-transparent"
                  style={{ minWidth: col.minWidth }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="py-16 text-center text-sm text-fg-tertiary">
                  No tasks match this filter.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  onMarkDone={onMarkDone}
                  onReschedule={onReschedule}
                  onCommunicate={onCommunicate}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
