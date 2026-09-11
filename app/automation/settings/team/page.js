'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { SettingsTabs, SettingsCard } from '../../components/settings/SettingsCard';
import TeamSettingsPanel from '../../components/settings/TeamSettingsPanel';
import RoleMatrix from '../../components/settings/RoleMatrix';
import AddMemberModal from '../../components/team/AddMemberModal';
import { usePermissions } from '../../hooks/usePermissions';
import { useTeamWorkspace } from '../../hooks/useTeamWorkspace';

const TABS = [
  { id: 'members', label: 'Members' },
  { id: 'roles', label: 'Roles & Permissions' }
];

export default function TeamSettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') || 'members';
  const { roles, matrix, updatePermission } = usePermissions();
  const ws = useTeamWorkspace();

  const setTab = (id) => router.replace(`/automation/settings/team?tab=${id}`);

  if (tab === 'roles') {
    return (
      <div className="space-y-5">
        <SettingsTabs tabs={TABS} active={tab} onChange={setTab} />
        <SettingsCard title="Role definitions" description="Overview of workspace roles">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {roles.map((role) => (
              <div key={role.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 mb-1">{role.name}</span>
                <p className="text-xs text-slate-500">{role.description}</p>
              </div>
            ))}
          </div>
        </SettingsCard>
        <SettingsCard title="Permissions matrix" description="Configure access levels per role">
          <RoleMatrix roles={roles} matrix={matrix} onChange={updatePermission} />
        </SettingsCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SettingsTabs tabs={TABS} active={tab} onChange={setTab} />
      <TeamSettingsPanel
        members={ws.team}
        loading={ws.loading}
        roles={roles}
        matrix={matrix}
        roleStats={{
          total: ws.stats.total,
          active: ws.stats.active,
          pending: 0,
          limit: ws.maxTeamMembers
        }}
        onAdd={() => ws.setShowAddModal(true)}
        onRemove={ws.deleteMember}
        onPermissionChange={updatePermission}
      />

      <AddMemberModal
        open={ws.showAddModal}
        saving={ws.saving}
        member={ws.newMember}
        onChange={ws.setNewMember}
        createdInfo={ws.createdMemberInfo}
        onClose={ws.closeModal}
        onSubmit={ws.addMember}
      />
    </div>
  );
}
