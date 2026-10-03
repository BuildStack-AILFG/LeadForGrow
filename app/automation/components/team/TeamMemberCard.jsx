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
    <div className="group relative bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg p-4 hover:shadow-popover hover:border-line-strong dark:hover:border-slate-700 transition-all overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${color.bar} opacity-70`} />

      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-sm font-semibold ring-2 ${color.bg} ${color.text} ${color.ring}`}>
          {memberInitials(member)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg dark:text-slate-100 truncate">{name}</p>
              <p className="text-meta text-fg-tertiary dark:text-fg-tertiary truncate mt-0.5">
                {isOwner ? 'Account owner' : email || 'Invitation pending'}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0 ${
                active
                  ? 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/30 dark:text-accent-fg'
                  : 'bg-muted text-fg-tertiary dark:bg-slate-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent' : 'bg-slate-400'}`} />
              {active ? 'Active' : 'Away'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-line dark:border-slate-800">
        <div>
          <p className="text-meta font-medium text-fg-tertiary mb-1">Leads handled</p>
          <p className="text-lg font-semibold text-fg dark:text-slate-50 tabular-nums">{leads}</p>
        </div>
        <div>
          <p className="text-meta font-medium text-fg-tertiary mb-1">Role</p>
          <p className="text-xs font-medium text-fg-secondary dark:text-fg-disabled capitalize">{member.role?.replace('_', ' ') || 'Member'}</p>
        </div>
      </div>

      {(email || phone) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {email && (
            <span className="inline-flex items-center gap-1 text-meta text-fg-tertiary bg-subtle dark:bg-slate-800 px-2 py-1 rounded-md">
              <Mail className="w-3 h-3" /> {email}
            </span>
          )}
          {phone && (
            <span className="inline-flex items-center gap-1 text-meta text-fg-tertiary bg-subtle dark:bg-slate-800 px-2 py-1 rounded-md">
              <Phone className="w-3 h-3" /> {phone}
            </span>
          )}
        </div>
      )}

      {!isOwner && (
        <div className="mt-3 pt-3 border-t border-line dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onRemove(member._id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:text-danger dark:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove member
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(TeamMemberCard);
