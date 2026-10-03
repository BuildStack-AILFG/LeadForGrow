'use client';

import { useTeamWorkspace } from '../hooks/useTeamWorkspace';
import TeamHeader from '../components/team/TeamHeader';
import TeamStatCards from '../components/team/TeamStatCards';
import AssignmentStrategy from '../components/team/AssignmentStrategy';
import TeamGrid from '../components/team/TeamGrid';
import AddMemberModal from '../components/team/AddMemberModal';
import TeamSkeleton from '../components/team/TeamSkeleton';

export default function TeamPage() {
  const ws = useTeamWorkspace();

  if (ws.loading) return <TeamSkeleton />;

  return (
    <div className="min-h-full bg-canvas">
      <div className="px-4 sm:px-6 pb-8">
        <TeamHeader
          total={ws.stats.total}
          active={ws.stats.active}
          onAdd={() => ws.setShowAddModal(true)}
          onRefresh={ws.refresh}
          refreshing={ws.refreshing}
        />

        <div className="mt-4 space-y-4">
          <TeamStatCards stats={ws.stats} />

          <AssignmentStrategy
            value={ws.assignmentStrategy}
            onChange={ws.setAssignmentStrategy}
            onSave={ws.saveStrategy}
            saving={ws.saving}
          />

          <div>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-fg dark:text-slate-50">Team members</h2>
              <p className="text-xs text-fg-tertiary dark:text-fg-tertiary">Manage access and track performance</p>
            </div>
            <TeamGrid
              team={ws.team}
              userPlan={ws.userPlan}
              maxTeamMembers={ws.maxTeamMembers}
              onAdd={() => ws.setShowAddModal(true)}
              onRemove={ws.deleteMember}
            />
          </div>
        </div>
      </div>

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
