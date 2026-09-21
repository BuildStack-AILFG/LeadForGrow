'use client';

import {
  ChevronLeft,
  Phone,
  Hand,
  Bot,
  PanelRight
} from 'lucide-react';
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
  profileOpen = false,
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
        <p className="text-sm text-slate-500 dark:text-slate-400">Select a conversation</p>
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
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        {/* Like WhatsApp: clicking the customer's photo / name opens (or closes) their profile panel. */}
        <button
          type="button"
          onClick={onProfile}
          title="Customer profile"
          aria-label="Open customer profile"
          className="flex items-center gap-2 min-w-0 flex-1 text-left rounded px-1 py-0.5 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
            {lead.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{lead.name}</h2>
              <StatusBadge status={lead.status} size="xs" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {lead.phone || lead.email || 'No contact'} · {assignee ? assigneeName(assignee) : 'Unassigned'}
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {chat.channel === 'whatsapp' && !isIntervened && !chat.isNew && (
          <button
            type="button"
            onClick={onIntervene}
            title="Take over — pauses the AI agent"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 rounded hover:bg-teal-100 dark:hover:bg-teal-900/30"
          >
            <Hand className="w-3.5 h-3.5" /> Intervene
          </button>
        )}
        {chat.channel === 'whatsapp' && isIntervened && (
          <button
            type="button"
            onClick={onReleaseIntervene}
            title="Hand back to AI — the AI agent resumes replying"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          >
            <Bot className="w-3.5 h-3.5" /> Resume AI
          </button>
        )}
        {lead.phone && (
          <button type="button" onClick={onCall} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Call">
            <Phone className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onProfile}
          aria-pressed={profileOpen}
          title={profileOpen ? 'Hide customer profile' : 'Show customer profile'}
          className={`p-2 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${profileOpen ? 'xl:bg-brand-tint xl:text-brand-ink' : ''}`}
        >
          <PanelRight className="w-4 h-4" />
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
