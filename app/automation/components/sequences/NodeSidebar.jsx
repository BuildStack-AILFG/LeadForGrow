'use client';

import { useState } from 'react';
import {
  Zap, MessageCircle, Mail, Sparkles, Split, ChevronDown, ChevronRight
} from 'lucide-react';
import { TRIGGER_TYPES, ACTION_TYPES, AI_ACTION_TYPES } from '@/lib/sequences/constants';

const SECTIONS = [
  { id: 'triggers', label: 'Triggers', icon: Zap, items: TRIGGER_TYPES, iconClass: 'text-accent-fg' },
  { id: 'actions', label: 'Actions', icon: MessageCircle, items: ACTION_TYPES.filter((a) => a.category === 'action'), iconClass: 'text-accent-fg' },
  { id: 'logic', label: 'Logic', icon: Split, items: ACTION_TYPES.filter((a) => a.category === 'logic' || a.category === 'end'), iconClass: 'text-warning' },
  { id: 'ai', label: 'AI Actions', icon: Sparkles, items: AI_ACTION_TYPES, iconClass: 'text-accent-fg' },
];

export default function NodeSidebar({ onAddNode }) {
  const [open, setOpen] = useState({ triggers: true, actions: true, logic: true, ai: true });

  const handleAdd = (type) => {
    const x = 200 + Math.random() * 200;
    const y = 120 + Math.random() * 200;
    onAddNode(type, { x, y });
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col rounded-lg bg-canvas/90 dark:bg-slate-900/90 border border-line dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-line dark:border-slate-800">
        <h3 className="text-xs font-semibold text-fg-tertiary">Node library</h3>
        <p className="text-meta text-fg-tertiary mt-0.5">Click to add to canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {SECTIONS.map((sec) => (
          <div key={sec.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-subtle dark:hover:bg-slate-800/50 text-left"
            >
              {open[sec.id] ? <ChevronDown className="w-3.5 h-3.5 text-fg-tertiary" /> : <ChevronRight className="w-3.5 h-3.5 text-fg-tertiary" />}
              <sec.icon className={`w-3.5 h-3.5 ${sec.iconClass}`} />
              <span className="text-xs font-semibold text-fg-secondary dark:text-fg-disabled">{sec.label}</span>
            </button>
            {open[sec.id] && (
              <div className="pl-2 pb-2 space-y-0.5">
                {sec.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAdd(item.type)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-fg-secondary dark:text-fg-tertiary bg-canvas hover:text-accent-fg dark:hover:text-accent-fg transition-all"
                  >
                    {item.type.includes('whatsapp') ? <MessageCircle className="w-3.5 h-3.5 text-accent-fg" /> :
                      item.type.includes('email') ? <Mail className="w-3.5 h-3.5 text-accent-fg" /> :
                      <Sparkles className="w-3.5 h-3.5 text-fg-tertiary" />}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
