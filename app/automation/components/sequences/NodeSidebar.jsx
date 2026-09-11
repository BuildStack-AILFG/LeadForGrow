'use client';

import { useState } from 'react';
import {
  Zap, MessageCircle, Mail, Sparkles, Split, ChevronDown, ChevronRight
} from 'lucide-react';
import { TRIGGER_TYPES, ACTION_TYPES, AI_ACTION_TYPES } from '@/lib/sequences/constants';

const SECTIONS = [
  { id: 'triggers', label: 'Triggers', icon: Zap, items: TRIGGER_TYPES, iconClass: 'text-teal-500' },
  { id: 'actions', label: 'Actions', icon: MessageCircle, items: ACTION_TYPES.filter((a) => a.category === 'action'), iconClass: 'text-emerald-500' },
  { id: 'logic', label: 'Logic', icon: Split, items: ACTION_TYPES.filter((a) => a.category === 'logic' || a.category === 'end'), iconClass: 'text-amber-500' },
  { id: 'ai', label: 'AI Actions', icon: Sparkles, items: AI_ACTION_TYPES, iconClass: 'text-cyan-500' },
];

export default function NodeSidebar({ onAddNode }) {
  const [open, setOpen] = useState({ triggers: true, actions: true, logic: true, ai: true });

  const handleAdd = (type) => {
    const x = 200 + Math.random() * 200;
    const y = 120 + Math.random() * 200;
    onAddNode(type, { x, y });
  };

  return (
    <aside className="w-56 shrink-0 flex flex-col rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node library</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Click to add to canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {SECTIONS.map((sec) => (
          <div key={sec.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
            >
              {open[sec.id] ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <sec.icon className={`w-3.5 h-3.5 ${sec.iconClass}`} />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sec.label}</span>
            </button>
            {open[sec.id] && (
              <div className="pl-2 pb-2 space-y-0.5">
                {sec.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAdd(item.type)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-slate-600 dark:text-slate-400 hover:bg-gradient-to-r hover:from-teal-50 hover:to-indigo-50 dark:hover:from-teal-950/30 dark:hover:to-indigo-950/20 hover:text-teal-700 dark:hover:text-teal-300 transition-all"
                  >
                    {item.type.includes('whatsapp') ? <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> :
                      item.type.includes('email') ? <Mail className="w-3.5 h-3.5 text-violet-500" /> :
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />}
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
