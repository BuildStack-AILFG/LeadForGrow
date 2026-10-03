'use client';

import { PERMISSION_MODULES } from '../../hooks/usePermissions';

const LEVELS = [
  { id: 'none', label: 'None' },
  { id: 'view', label: 'View' },
  { id: 'edit', label: 'Edit' },
  { id: 'full', label: 'Full' }
];

const LEVEL_COLORS = {
  none: 'bg-muted text-fg-tertiary dark:bg-slate-800',
  view: 'bg-info-subtle text-info dark:bg-sky-950/40 dark:text-sky-400',
  edit: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg',
  full: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg'
};

export default function RoleMatrix({ roles, matrix, onChange }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line dark:border-slate-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-subtle dark:bg-slate-900/80 border-b border-line dark:border-slate-800">
            <th className="text-left px-4 py-3 font-semibold text-fg-secondary dark:text-fg-tertiary min-w-[140px]">Module</th>
            {roles.filter((r) => r.id !== 'owner').map((role) => (
              <th key={role.id} className="text-center px-3 py-3 font-semibold text-fg-secondary dark:text-fg-tertiary min-w-[100px]">
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_MODULES.map((mod, i) => (
            <tr key={mod.id} className={i % 2 === 0 ? 'bg-canvas dark:bg-slate-900' : 'bg-subtle dark:bg-slate-900/50'}>
              <td className="px-4 py-2.5 font-medium text-fg-secondary dark:text-fg-disabled">{mod.label}</td>
              {roles.filter((r) => r.id !== 'owner').map((role) => {
                const level = matrix[role.id]?.[mod.id] || 'none';
                return (
                  <td key={role.id} className="px-3 py-2 text-center">
                    <select
                      value={level}
                      onChange={(e) => onChange(role.id, mod.id, e.target.value)}
                      className={`px-2 py-1 rounded-md text-meta font-semibold border-0 cursor-pointer ${LEVEL_COLORS[level]}`}
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
      <p className="text-meta text-fg-tertiary px-4 py-2 border-t border-line dark:border-slate-800">
        Owner role has full access to all modules and cannot be modified.
      </p>
    </div>
  );
}
