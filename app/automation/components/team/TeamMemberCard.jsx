'use client';

import { memo } from 'react';
import { Trash2, Mail, Phone } from 'lucide-react';
import { avatarColor, memberInitials, memberName } from './constants';

function TeamMemberCard({ member, index, onRemove }) {
  const color = avatarColor(index);
  const name = memberName(member);
  const email = member.userId?.email;
  const phone = member.userId?.phone;
  const isOwner = member.role === 'owner';
  const leads = member.metrics?.totalLeadsHandled || 0;
  const active = member.active !== false;

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color.bar} opacity-70`} />

      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold ring-2 ${color.bg} ${color.text} ${color.ring}`}>
          {memberInitials(member)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {isOwner ? 'Account owner' : email || 'Invitation pending'}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0 ${
                active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:text-slate-400 dark:bg-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {active ? 'Active' : 'Away'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">Leads handled</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{leads}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 mb-1">Role</p>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{member.role?.replace('_', ' ') || 'Member'}</p>
        </div>
      </div>

      {(email || phone) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {email && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
              <Mail className="w-3 h-3" /> {email}
            </span>
          )}
          {phone && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
              <Phone className="w-3 h-3" /> {phone}
            </span>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onRemove(member._id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:hover:text-red-300 dark:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove member
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(TeamMemberCard);
