'use client';

import { UserPlus, Mail, Trash2 } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import RoleMatrix from './RoleMatrix';
import { ROLES } from '../../hooks/usePermissions';
import { memberName } from '../team/constants';

const ROLE_COLORS = {
  owner: 'bg-warning-subtle text-warning dark:bg-amber-950/30 dark:text-amber-400',
  admin: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/30 dark:text-accent-fg',
  team_member: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/30 dark:text-accent-fg',
  manager: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/30 dark:text-accent-fg',
  agent: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/30 dark:text-accent-fg',
  viewer: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary'
};

function formatRole(role) {
  return (role || 'team_member').replace(/_/g, ' ');
}

function formatLastActive(member) {
  const at = member.userId?.lastActivityAt || member.metrics?.lastActivityAt;
  if (!at) return member.active !== false ? 'Active' : 'Inactive';
  const diff = Date.now() - new Date(at).getTime();
  if (diff < 60_000) return 'Now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hr ago`;
  return new Date(at).toLocaleDateString();
}

export default function TeamSettingsPanel({
  members,
  loading,
  roles,
  matrix,
  roleStats,
  onAdd,
  onRemove,
  onPermissionChange
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total members', value: roleStats.total },
          { label: 'Active', value: roleStats.active },
          { label: 'Seat limit', value: `${roleStats.total}/${roleStats.limit}` },
          { label: 'Available seats', value: Math.max(0, roleStats.limit - roleStats.total) }
        ].map((s) => (
          <div key={s.label} className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4">
            <p className="text-meta font-medium text-fg-tertiary">{s.label}</p>
            <p className="text-xl font-semibold text-fg dark:text-slate-50 tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <SettingsCard
        title="Team members"
        description={`${roleStats.total} of ${roleStats.limit} seats used`}
        footer={
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-fg dark:text-accent-fg hover:text-accent-fg dark:hover:text-accent-fg">
            <UserPlus className="w-3.5 h-3.5" /> Add team member
          </button>
        }
      >
        {loading ? (
          <p className="text-sm text-fg-tertiary dark:text-fg-tertiary py-6 text-center">Loading team…</p>
        ) : members.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-fg-secondary dark:text-fg-tertiary">No team members yet.</p>
            <button type="button" onClick={onAdd} className="mt-3 text-xs font-medium text-accent-fg dark:text-accent-fg hover:text-accent-fg dark:hover:text-accent-fg">
              Add your first team member
            </button>
          </div>
        ) : (
          <div className="space-y-2 -mt-2">
            {members.map((member) => {
              const name = memberName(member);
              const email = member.userId?.email || '';
              const isOwner = member.role === 'owner';

              return (
                <div key={member._id} className="flex items-center gap-3 py-3 border-b border-line dark:border-slate-800 last:border-0 group">
                  <div className="w-9 h-9 rounded-lg bg-accent-subtle dark:bg-teal-950/50 text-accent-fg dark:text-accent-fg flex items-center justify-center text-xs font-semibold">
                    {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg dark:text-slate-100 truncate">{name}</p>
                    <p className="text-xs text-fg-tertiary dark:text-fg-tertiary truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {email}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-meta font-semibold capitalize ${ROLE_COLORS[member.role] || ROLE_COLORS.team_member}`}>
                    {formatRole(member.role)}
                  </span>
                  <span className={`text-meta ${member.active !== false ? 'text-accent-fg dark:text-accent-fg' : 'text-fg-tertiary'}`}>
                    {formatLastActive(member)}
                  </span>
                  {!isOwner && (
                    <button type="button" onClick={() => onRemove(member._id)} className="opacity-0 group-hover:opacity-100 p-1 text-danger hover:text-danger dark:hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Role definitions" description="Overview of workspace roles">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => (
            <div key={role.id} className="p-3 rounded-lg border border-line dark:border-slate-700">
              <span className={`inline-block px-2 py-0.5 rounded text-meta font-semibold mb-1 ${ROLE_COLORS[role.id] || ROLE_COLORS.viewer}`}>{role.name}</span>
              <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">{role.description}</p>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="Permissions matrix" description="Configure access levels per role">
        <RoleMatrix roles={roles} matrix={matrix} onChange={onPermissionChange} />
      </SettingsCard>
    </div>
  );
}
