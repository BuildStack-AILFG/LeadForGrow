'use client';

import {
  ChevronLeft,
  Phone,
  UserPlus,
  Hand,
  Bot
} from 'lucide-react';
import StatusBadge from '../leads/StatusBadge';
import { assigneeName } from '../leads/utils';
import InboxActionsMenu from './InboxActionsMenu';
import { toneForName } from './ConversationItem';

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
      <div className="h-14 flex-shrink-0 border-b border-line dark:border-slate-800 bg-canvas dark:bg-slate-900 flex items-center px-4">
        <p className="text-sm text-fg-tertiary">Select a conversation</p>
      </div>
    );
  }

  const lead = chat.leadId || {};
  const assignee = chat.assignedTo || lead.assignedTo;
  const isIntervened =
    chat.status === 'intervened' || chat.inboxStatus === 'intervened';
  const canChat = chat.channel !== 'whatsapp' || isIntervened;

  return (
    <div className="h-14 flex-shrink-0 border-b border-line dark:border-slate-800 bg-canvas dark:bg-slate-900 flex items-center justify-between px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && (
          <button type="button" onClick={onBack} className="lg:hidden p-1.5 rounded-lg hover:bg-muted dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5 text-fg-secondary" />
          </button>
        )}
        <div className={`w-9 h-9 rounded-full ${toneForName(lead.name).bg} ${toneForName(lead.name).fg} flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-body font-semibold text-fg truncate">{lead.name}</h2>
            <StatusBadge status={lead.status} size="xs" />
          </div>
          <p className="text-meta text-fg-tertiary truncate">
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
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-accent-fg bg-accent-subtle dark:bg-teal-950/40 border border-line dark:border-teal-900 rounded hover:bg-accent-subtle"
          >
            <Hand className="w-3.5 h-3.5" /> Intervene
          </button>
        )}
        {chat.channel === 'whatsapp' && isIntervened && (
          <button
            type="button"
            onClick={onReleaseIntervene}
            title="Hand back to AI — the AI agent resumes replying"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-accent-fg bg-accent-subtle dark:bg-emerald-950/40 border border-line dark:border-emerald-900 rounded hover:bg-accent-subtle"
          >
            <Bot className="w-3.5 h-3.5" /> Resume AI
          </button>
        )}
        <button type="button" onClick={onCall} className="p-2 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" title="Call">
          <Phone className="w-4 h-4" />
        </button>
        <button type="button" onClick={onProfile} className="xl:hidden p-2 rounded-lg text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800" title="CRM profile">
          <UserPlus className="w-4 h-4" />
        </button>
        {/* Open lead / Mark won / Mark lost moved into the overflow menu below —
            keeping them always-visible icons here was crowding the header. */}
        <InboxActionsMenu
          chat={chat}
          onUpdate={onUpdateConversation}
          onClaim={onClaim}
          onAction={onAction}
          currentUserId={currentUserId}
          onWon={onWon}
          onLost={onLost}
          leadHref={lead._id ? `/automation/leads/${lead._id}` : null}
        />
      </div>
    </div>
  );
}
