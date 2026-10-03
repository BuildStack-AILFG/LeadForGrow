'use client';

import { ACTIONS, FLAT_MODULES } from '@/lib/access/catalog';

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
  manage: 'Manage',
};

export default function EnterprisePermissionMatrix({ roles, onToggle, readOnly }) {
  const editableRoles = roles.filter((r) => r.slug !== 'owner' && r.active !== false);

  const hasAction = (role, moduleId, action) => {
    const perms = role.permissions || {};
    return (perms[moduleId] || []).includes(action);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-line dark:border-slate-800 bg-canvas dark:bg-slate-900">
      <table className="w-full text-xs min-w-[900px]">
        <thead>
          <tr className="bg-subtle dark:bg-slate-900/80 border-b border-line dark:border-slate-800">
            <th className="text-left px-4 py-3 font-semibold text-fg-secondary sticky left-0 bg-subtle dark:bg-slate-900 z-10 min-w-[180px]">
              Module
            </th>
            {editableRoles.map((role) => (
              <th key={role.id || role.slug} colSpan={ACTIONS.length} className="text-center px-2 py-3 border-l border-line dark:border-slate-800">
                <span className="font-semibold text-fg-secondary dark:text-fg-disabled">{role.name}</span>
              </th>
            ))}
          </tr>
          <tr className="bg-subtle dark:bg-slate-900/60 border-b border-line">
            <th className="sticky left-0 bg-subtle dark:bg-slate-900/60 z-10" />
            {editableRoles.map((role) =>
              ACTIONS.map((a) => (
                <th key={`${role.slug}-${a}`} className="px-1 py-1 text-meta font-medium text-fg-tertiary border-l border-line dark:border-slate-800 first:border-l-slate-200">
                  {ACTION_LABELS[a]?.slice(0, 3)}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {FLAT_MODULES.map((mod, i) => (
            <tr
              key={mod.id}
              className={i % 2 === 0 ? 'bg-canvas dark:bg-slate-900' : 'bg-subtle/40 dark:bg-slate-900/40'}
            >
              <td className="px-4 py-2 font-medium text-fg-secondary dark:text-fg-disabled sticky left-0 bg-inherit z-10 border-r border-line dark:border-slate-800">
                <span className="block text-meta text-fg-tertiary">{mod.groupLabel}</span>
                {mod.label}
              </td>
              {editableRoles.map((role) =>
                ACTIONS.map((action) => {
                  const on = hasAction(role, mod.id, action);
                  return (
                    <td key={`${role.slug}-${mod.id}-${action}`} className="text-center px-1 py-1 border-l border-slate-50 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => onToggle?.(role, mod.id, action, !on)}
                        className={`w-6 h-6 rounded-md transition-colors ${
                          on
                            ? 'bg-accent text-white'
                            : 'bg-muted dark:bg-slate-800 text-transparent hover:bg-muted'
                        } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={`${role.name}: ${ACTION_LABELS[action]} ${mod.label}`}
                      >
                        {on && '✓'}
                      </button>
                    </td>
                  );
                })
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-meta text-fg-tertiary px-4 py-2 border-t border-line dark:border-slate-800">
        Owner has full access. Plan limits may still lock features regardless of role permissions.
      </p>
    </div>
  );
}
