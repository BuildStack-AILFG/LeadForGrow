'use client';

import { useState } from 'react';
import { Zap, MessageCircle, Split, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { TRIGGER_TYPES, ACTION_TYPES, LOGIC_TYPES } from '@/lib/whatsappFlows/constants';

const SECTIONS = [
  { id: 'triggers', label: 'Triggers', icon: Zap, items: TRIGGER_TYPES, iconClass: 'text-teal-500' },
  { id: 'actions', label: 'Actions', icon: MessageCircle, items: ACTION_TYPES, iconClass: 'text-emerald-500' },
  { id: 'logic', label: 'Logic', icon: Split, items: LOGIC_TYPES, iconClass: 'text-amber-500' },
];

export default function NodePalette({ onAdd }) {
  const [open, setOpen] = useState({ triggers: true, actions: true, logic: true });

  return (
    <aside className="w-56 shrink-0 flex flex-col rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm overflow-hidden hidden md:flex">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node library</h3>
        <p className="text-[11px] text-slate-500 mt-0.5">Drag or click to add</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {SECTIONS.map((sec) => (
          <div key={sec.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left"
            >
              {open[sec.id] ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <sec.icon className={`w-3.5 h-3.5 ${sec.iconClass}`} />
              <span className="text-xs font-semibold text-slate-700">{sec.label}</span>
            </button>
            {open[sec.id] && (
              <div className="pl-2 pb-2 space-y-0.5">
                {sec.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', item.type);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => onAdd(item.type)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-slate-600 hover:bg-gradient-to-r hover:from-teal-50 hover:to-indigo-50 hover:text-teal-700 transition-all"
                  >
                    {item.type.includes('whatsapp') || item.type.includes('send') ? (
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : item.type.includes('trigger') ? (
                      <Zap className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
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
