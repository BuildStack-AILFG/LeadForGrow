'use client';

import { useState, useEffect } from 'react';
import LeadActivityTab, { LeadNotesTab, LeadTasksTab } from './LeadDetailTabs';
import LeadWhatsAppPanel, { LeadCallsTab, ChannelMark } from './LeadWhatsAppPanel';
import { CHANNEL_LABELS, getMessageChannels, getPrimaryChannel } from './leadChannels';

const TABS = [
  { id: 'whatsapp', label: 'Messages' }, // id kept for the existing tab state; label/icon follow the lead's channel
  { id: 'activity', label: 'Activity' },
  { id: 'notes', label: 'Notes' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'calls', label: 'Calls' }
];

export default function LeadDetailWorkspace({
  lead,
  tasks,
  teamMembers,
  updating,
  sendingChat,
  onSendWhatsApp,
  onAddNote,
  onCreateTask,
  onCompleteTask,
  draft = null
}) {
  const [tab, setTab] = useState('whatsapp');
  useEffect(() => {
    if (draft?.text) setTab('whatsapp');
  }, [draft]);
  const hasCalls = (lead.activities || []).some((a) => a.type === 'contacted' || a.type === 'call');
  const visibleTabs = TABS.filter((t) => t.id !== 'calls' || lead.phone || hasCalls);
  const messages = (lead.messages || []).filter((m) => !m.isInternal);
  const threadChannels = getMessageChannels(messages);
  const primaryChannel = getPrimaryChannel(lead, messages);
  // One channel → name it ("Instagram"); several → generic "Messages".
  const messagesLabel = threadChannels.length > 1 ? 'Messages' : CHANNEL_LABELS[threadChannels[0] || primaryChannel];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm overflow-hidden min-h-[640px] flex flex-col flex-1">
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.id === 'whatsapp' && <ChannelMark channel={threadChannels.length > 1 ? null : (threadChannels[0] || primaryChannel)} className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
            {t.id === 'whatsapp' ? messagesLabel : t.label}
            {t.id === 'whatsapp' && messages.length > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                {messages.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {tab === 'whatsapp' && (
          <LeadWhatsAppPanel
            lead={lead}
            messages={lead.messages || []}
            onSend={onSendWhatsApp}
            draft={draft}
            sending={sendingChat}
          />
        )}
        {tab === 'activity' && <LeadActivityTab activities={lead.activities || []} />}
        {tab === 'notes' && (
          <LeadNotesTab notes={lead.notes || []} onAdd={onAddNote} updating={updating} />
        )}
        {tab === 'tasks' && (
          <LeadTasksTab
            tasks={tasks}
            teamMembers={teamMembers}
            onCreate={onCreateTask}
            onComplete={onCompleteTask}
          />
        )}
        {tab === 'calls' && <LeadCallsTab activities={lead.activities || []} />}
      </div>
    </div>
  );
}
