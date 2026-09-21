'use client';

import { useState } from 'react';
import {
  Zap,
  MessageSquare,
  Image as ImageIcon,
  Film,
  List,
  FileText,
  GitBranch,
  Webhook,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TRIGGER_TYPES, ACTION_TYPES, LOGIC_TYPES } from '@/lib/whatsappFlows/constants';

const MESSAGE_TYPES = new Set([
  'action_send_text',
  'action_send_buttons',
  'action_send_image',
  'action_send_video',
  'action_send_list',
  'action_send_template',
]);

const ITEM_ICON = {
  action_send_text: MessageSquare,
  action_send_buttons: MessageSquare,
  action_send_image: ImageIcon,
  action_send_video: Film,
  action_send_list: List,
  action_send_template: FileText,
  logic_if_else: GitBranch,
  action_webhook: Webhook,
};

function PaletteRow({ item, onAdd }) {
  const Icon = ITEM_ICON[item.type] || Sparkles;
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', item.type);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onAdd(item.type)}
      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[12.5px] text-slate-600 dark:text-slate-300 hover:bg-brand-tint hover:text-brand-ink transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

export default function NodePalette({ onAdd, hasTrigger }) {
  const [messagesOpen, setMessagesOpen] = useState(true);
  const messageItems = ACTION_TYPES.filter((a) => MESSAGE_TYPES.has(a.type));
  const otherActionItems = ACTION_TYPES.filter((a) => !MESSAGE_TYPES.has(a.type));

  return (
    <aside className="w-56 shrink-0 flex flex-col rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hidden md:flex">
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">Actions</h3>
        </div>
        <p className="text-[10px] text-slate-400">Drag or click to add</p>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
        {!hasTrigger && (
          <div className="mb-1">
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Triggers
            </div>
            <div className="space-y-0.5">
              {TRIGGER_TYPES.map((item) => (
                <PaletteRow key={item.type} item={item} onAdd={onAdd} />
              ))}
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setMessagesOpen((v) => !v)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
          >
            {messagesOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Messages</span>
          </button>
          {messagesOpen && (
            <div className="pl-4 space-y-0.5">
              {messageItems.map((item) => (
                <PaletteRow key={item.type} item={item} onAdd={onAdd} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 space-y-0.5">
          {LOGIC_TYPES.map((item) => (
            <PaletteRow key={item.type} item={item} onAdd={onAdd} />
          ))}
          {otherActionItems.map((item) => (
            <PaletteRow key={item.type} item={item} onAdd={onAdd} />
          ))}
        </div>
      </div>
    </aside>
  );
}
