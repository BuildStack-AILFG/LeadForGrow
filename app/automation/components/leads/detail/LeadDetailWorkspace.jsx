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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[640px] flex flex-col">
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
            {t.id === 'whatsapp' && lead.messages?.length > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
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
