'use client';

import { TABLE_COLUMNS } from './constants';
import TaskRow from './TaskRow';

export default function TaskTable({ tasks, onMarkDone, onReschedule, onCommunicate }) {
  return (
    <div className="bg-[#F8F9FA] dark:bg-slate-900 border border-[#E8ECEF] dark:border-slate-800 rounded-[4px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#F8F9FA] dark:bg-slate-900/95 border-b border-[#E5E5E7] dark:border-slate-800">
            <tr>
              {TABLE_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="py-3.5 px-3 text-[14px] font-semibold text-[#0A0B10] dark:text-slate-200 whitespace-nowrap border-r border-white dark:border-transparent"
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
                <td colSpan={TABLE_COLUMNS.length} className="py-16 text-center text-sm text-slate-500">
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
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
