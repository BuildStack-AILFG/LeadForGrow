'use client';

import { useState } from 'react';
import LeadActivityTab, { LeadNotesTab, LeadTasksTab } from './LeadDetailTabs';
import LeadWhatsAppPanel, { LeadCallsTab } from './LeadWhatsAppPanel';

const TABS = [
  { id: 'whatsapp', label: 'WhatsApp' },
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
  onCompleteTask
}) {
  const [tab, setTab] = useState('whatsapp');

  return (
    <div className="bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg overflow-hidden min-h-[640px] flex flex-col">
      <div className="flex border-b border-line dark:border-slate-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-accent text-accent-fg'
                : 'border-transparent text-fg-tertiary hover:text-fg-secondary dark:hover:text-fg-disabled'
            }`}
          >
            {t.label}
            {t.id === 'whatsapp' && lead.messages?.length > 0 && (
              <span className="ml-1.5 text-meta px-1.5 py-0.5 rounded-full bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg">
                {lead.messages.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="p-5 flex-1">
        {tab === 'whatsapp' && (
          <LeadWhatsAppPanel
            lead={lead}
            messages={lead.messages || []}
            onSend={onSendWhatsApp}
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
