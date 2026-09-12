'use client';

import {
  ChevronLeft,
  Phone,
  Calendar,
  UserPlus,
  Trophy,
  XCircle,
  Info,
  Hand,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '../leads/StatusBadge';
import { assigneeName } from '../leads/utils';
import InboxActionsMenu from './InboxActionsMenu';

export default function ChatHeader({
  chat,
  onBack,
  onCall,
  onAssign,
  onSchedule,
  onWon,
  onLost,
  onProfile,
  onIntervene,
  onReleaseIntervene,
  onUpdateConversation,
  onClaim,
  onAction,
  currentUserId,
  showBack
}) {
  if (!chat) {
    return (
      <div className="h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4">
        <p className="text-sm text-slate-500">Select a conversation</p>
      </div>
    );
  }

  const lead = chat.leadId || {};
  const assignee = chat.assignedTo || lead.assignedTo;
  const isIntervened =
    chat.status === 'intervened' || chat.inboxStatus === 'intervened';
  const canChat = chat.channel !== 'whatsapp' || isIntervened;

  return (
    <div className="h-14 flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && (
          <button type="button" onClick={onBack} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{lead.name}</h2>
            <StatusBadge status={lead.status} size="xs" />
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {lead.phone || lead.email || 'No contact'} · {assignee ? assigneeName(assignee) : 'Unassigned'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {chat.channel === 'whatsapp' && !isIntervened && (
          <button
            type="button"
            onClick={onIntervene}
            title="Take over — pauses the AI agent"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded hover:bg-teal-100"
          >
            <Hand className="w-3.5 h-3.5" /> Intervene
          </button>
        )}
        {chat.channel === 'whatsapp' && isIntervened && (
          <button
            type="button"
            onClick={onReleaseIntervene}
            title="Hand back to AI — the AI agent resumes replying"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded hover:bg-emerald-100"
          >
            <Bot className="w-3.5 h-3.5" /> Resume AI
          </button>
        )}
        <button type="button" onClick={onCall} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Call">
          <Phone className="w-4 h-4" />
        </button>
        <Link href={`/automation/leads/${lead._id}`} className="hidden md:block p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Open lead">
          <Info className="w-4 h-4" />
        </Link>
        <button type="button" onClick={onWon} className="hidden sm:block p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" title="Mark won">
          <Trophy className="w-4 h-4" />
        </button>
        <button type="button" onClick={onLost} className="hidden sm:block p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30" title="Mark lost">
          <XCircle className="w-4 h-4" />
        </button>
        <button type="button" onClick={onProfile} className="xl:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="CRM profile">
          <UserPlus className="w-4 h-4" />
        </button>
        <InboxActionsMenu
          chat={chat}
          onUpdate={onUpdateConversation}
          onClaim={onClaim}
          onAction={onAction}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}
