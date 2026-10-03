'use client';

import { Users, UserPlus } from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';
import { getPlanLabel } from '@/lib/plans';

export default function TeamGrid({ team, userPlan, maxTeamMembers = 1, onAdd, onRemove }) {
  if (team.length === 0) {
    return (
      <div className="bg-canvas dark:bg-slate-900 border border-dashed border-line dark:border-slate-700 rounded-lg p-12 text-center">
        <div className="w-12 h-12 rounded-lg bg-canvas border border-line dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-fg-secondary dark:text-accent-fg" />
        </div>
        <p className="text-sm font-semibold text-fg dark:text-slate-200">No team members yet</p>
        <p className="text-xs text-fg-tertiary mt-1 max-w-sm mx-auto">Add sales staff to distribute leads and track performance.</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-md"
        >
          <UserPlus className="w-4 h-4" /> Add first member
        </button>
      </div>
    );
  }

  const limit = maxTeamMembers ?? 1;
  const atLimit = team.length >= limit;

  return (
    <div>
      <div className={`mb-4 flex items-center justify-between px-4 py-3 rounded-xl border ${
        atLimit
          ? 'bg-warning-subtle/80 dark:bg-amber-950/20 border-warning/30 dark:border-amber-900/50'
          : 'bg-subtle dark:bg-slate-800/50 border-line dark:border-slate-700'
      }`}>
        <p className="text-xs font-medium text-fg-secondary dark:text-fg-disabled">
          {getPlanLabel(userPlan)} plan · up to {limit} team member{limit !== 1 ? 's' : ''}
        </p>
        <span className={`text-xs font-semibold tabular-nums ${atLimit ? 'text-warning dark:text-amber-400' : 'text-fg-secondary dark:text-fg-tertiary'}`}>
          {team.length} / {limit}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map((member, i) => (
          <TeamMemberCard key={member._id} member={member} index={i} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
