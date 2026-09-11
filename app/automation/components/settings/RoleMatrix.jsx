'use client';

import { PERMISSION_MODULES } from '../../hooks/usePermissions';

const LEVELS = [
  { id: 'none', label: 'None' },
  { id: 'view', label: 'View' },
  { id: 'edit', label: 'Edit' },
  { id: 'full', label: 'Full' }
];

const LEVEL_COLORS = {
  none: 'bg-slate-100 text-slate-400 dark:bg-slate-800',
  view: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  edit: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  full: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
};

export default function RoleMatrix({ roles, matrix, onChange }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 min-w-[140px]">Module</th>
            {roles.filter((r) => r.id !== 'owner').map((role) => (
              <th key={role.id} className="text-center px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 min-w-[100px]">
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map((mod, i) => (
            <tr key={mod.id} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'}>
              <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{mod.label}</td>
              {roles.filter((r) => r.id !== 'owner').map((role) => {
                const level = matrix[role.id]?.[mod.id] || 'none';
                return (
                  <td key={role.id} className="px-3 py-2 text-center">
                    <select
                      value={level}
                      onChange={(e) => onChange(role.id, mod.id, e.target.value)}
                      className={`px-2 py-1 rounded-md text-[10px] font-semibold border-0 cursor-pointer ${LEVEL_COLORS[level]}`}
                    >
                      {LEVELS.map((l) => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </select>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-slate-400 px-4 py-2 border-t border-slate-100 dark:border-slate-800">
        Owner role has full access to all modules and cannot be modified.
      </p>
    </div>
  );
}
