'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  LayoutGrid,
  Gauge,
  ScrollText,
  Key,
  Plus,
  Loader2,
} from 'lucide-react';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useTeamWorkspace } from '../../hooks/useTeamWorkspace';
import EnterprisePermissionMatrix from './EnterprisePermissionMatrix';
import AddMemberModal from '../team/AddMemberModal';
import PageLoader from '../PageLoader';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

const SECTIONS = [
  { id: 'members', label: 'Team Members', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'features', label: 'Feature Access', icon: LayoutGrid },
  { id: 'policies', label: 'Access Policies', icon: Shield },
  { id: 'usage', label: 'Usage Limits', icon: Gauge },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
];

export default function TeamPermissionsWorkspace() {
  const [section, setSection] = useState('members');
  const ac = useAccessControl();
  const team = useTeamWorkspace();

  useEffect(() => {
    if (section === 'audit') ac.loadAudit();
  }, [section]);

  const handleToggle = (role, moduleId, action, enabled) => {
    const perms = { ...(role.permissions || {}) };
    const current = [...(perms[moduleId] || [])];
    if (enabled && !current.includes(action)) current.push(action);
    if (!enabled) {
      const idx = current.indexOf(action);
      if (idx >= 0) current.splice(idx, 1);
    }
    perms[moduleId] = current;
    ac.updateRolePermissions(String(role._id || role.id), perms);
  };

  if (ac.loading) {
    return (
      <PageLoader label="Loading team & permissions…" height="50vh" />
    );
  }

  const canManage = ac.access?.canManageAccess;

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] bg-[#f4f6fa] dark:bg-slate-950">
      <aside className="lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 mb-1">Admin Control</p>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Team & Permissions</h1>
        <nav className="space-y-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] text-slate-500 uppercase font-semibold">Plan</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
            {ac.access?.tierLabel || ac.access?.plan}
          </p>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-[1400px]">
        <AutoPageIntro />

        {!canManage && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-sm text-amber-800 dark:text-amber-200">
            View-only mode — contact your workspace owner to change permissions.
          </div>
        )}

        {section === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Team members</h2>
                <p className="text-sm text-slate-500">Invite, assign roles, suspend access</p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => team.setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Invite
                </button>
              )}
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              {team.team.map((m) => {
                const u = m.userId || {};
                const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Member';
                return (
                  <div key={m._id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    {canManage && (
                      <select
                        className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-950"
                        value={m.role === 'owner' ? 'owner' : m.role === 'admin' ? 'admin' : 'sales_agent'}
                        onChange={(e) =>
                          ac.updateMemberAccess(String(u._id || m.userId), { roleSlug: e.target.value })
                        }
                      >
                        {ac.roles.map((r) => (
                          <option key={r.slug} value={r.slug}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
            <AddMemberModal
              open={team.showAddModal}
              saving={team.saving}
              member={team.newMember}
              onChange={team.setNewMember}
              createdInfo={team.createdMemberInfo}
              onClose={team.closeModal}
              onSubmit={team.addMember}
            />
          </div>
        )}

        {section === 'roles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Roles</h2>
                <p className="text-sm text-slate-500">Built-in and custom workspace roles</p>
              </div>
              {canManage && ac.access?.tierFeatures?.custom_roles && (
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Role name');
                    if (name) ac.createRole(name, '');
                  }}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  + Custom role
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ac.roles.map((r) => (
                <div
                  key={r.slug}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  <span className="text-[10px] font-semibold uppercase text-indigo-600">{r.slug}</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">{r.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                  {r.systemRole && (
                    <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                      System
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(section === 'features' || section === 'policies') && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {section === 'features' ? 'Feature access matrix' : 'Access policies'}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Control view, create, edit, delete, export, and manage per module. Plan locks apply on top.
              </p>
            </div>
            {ac.saving && (
              <p className="text-xs text-indigo-600">Saving permissions…</p>
            )}
            <EnterprisePermissionMatrix
              roles={ac.roles}
              onToggle={canManage ? handleToggle : undefined}
              readOnly={!canManage}
            />
          </div>
        )}

        {section === 'usage' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Usage limits</h2>
            <p className="text-sm text-slate-500">Real-time usage vs plan quotas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ac.usageLimits.map((u) => {
                const pct = u.limit > 0 ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0;
                const warn = pct >= 85;
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{u.label}</span>
                      <span className="text-slate-500 tabular-nums">
                        {u.used} / {u.limit >= 999999 ? '∞' : u.limit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${warn ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {warn && (
                      <p className="text-[10px] text-amber-600 mt-2">Approaching limit — consider upgrading</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {section === 'audit' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Audit logs</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {ac.auditLogs.length === 0 ? (
                <p className="p-8 text-sm text-slate-500 text-center">No audit events yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                  {ac.auditLogs.map((log) => (
                    <div key={log._id} className="px-4 py-3 flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{log.description}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {log.action} · {log.actorEmail || 'System'} ·{' '}
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
