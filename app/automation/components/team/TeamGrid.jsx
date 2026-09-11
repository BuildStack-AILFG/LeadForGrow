'use client';

import { Users, UserPlus } from 'lucide-react';
import TeamMemberCard from './TeamMemberCard';
import { getPlanLabel } from '@/lib/plans';

export default function TeamGrid({ team, userPlan, maxTeamMembers = 1, onAdd, onRemove }) {
  if (team.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No team members yet</p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Add sales staff to distribute leads and track performance.</p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
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
          ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
      }`}>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {getPlanLabel(userPlan)} plan · up to {limit} team member{limit !== 1 ? 's' : ''}
        </p>
        <span className={`text-xs font-semibold tabular-nums ${atLimit ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
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
