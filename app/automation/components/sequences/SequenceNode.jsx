'use client';

import { motion } from 'framer-motion';
import {
  UserPlus, MessageCircle, Mail, UserCheck, Tag, CheckSquare, ArrowRight,
  Bell, Timer, Split, Calendar, Webhook, Flag, Sparkles, Brain, TrendingUp,
  Scan, Clock, Megaphone, FileInput, GitBranch, PhoneMissed, CreditCard,
  Copy, Trash2, GripVertical
} from 'lucide-react';
import { getNodeDef, getNodeStyle } from '@/lib/sequences/constants';

const ICONS = {
  UserPlus, MessageCircle, Mail, UserCheck, Tag, CheckSquare, ArrowRight, Bell,
  Timer, Split, Calendar, Webhook, Flag, Sparkles, Brain, TrendingUp, Scan, Clock,
  Megaphone, FileInput, GitBranch, PhoneMissed, CreditCard,
};

const NODE_W = 220;
const NODE_H = 72;

export { NODE_W, NODE_H };

export default function SequenceNode({
  node, selected, onSelect, onDragStart, onDuplicate, onDelete, connectingFrom,
}) {
  const def = getNodeDef(node.type);
  const Icon = ICONS[def.icon] || MessageCircle;
  const gradient = getNodeStyle(node.type);
  const isTrigger = node.type?.startsWith('trigger_');

  return (
    <motion.div
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`absolute select-none cursor-grab active:cursor-grabbing group ${selected ? 'z-20' : 'z-10'}`}
      style={{ left: node.position?.x ?? 0, top: node.position?.y ?? 0, width: NODE_W }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect?.(node.id);
        onDragStart?.(e, node.id);
      }}
    >
      <div className={`relative rounded-2xl overflow-hidden shadow-lg transition-all duration-200 ${
        selected ? 'ring-2 ring-focus ring-offset-2 ring-offset-[#eef1f8] dark:ring-offset-slate-950 scale-[1.02]' : 'hover:shadow-modal'
      } ${connectingFrom === node.id ? 'ring-2 ring-focus' : ''}`}>
        <div className={`h-1.5 bg-canvas ${gradient}`} />
        <div className="bg-canvas/95 dark:bg-slate-900/95 p-3 border border-line/80 dark:border-slate-700/80">
          <div className="flex items-start gap-2.5">
            <div className={`w-9 h-9 rounded-lg bg-canvas ${gradient} flex items-center justify-center shadow-popover shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-meta text-fg-tertiary font-semibold">
                {isTrigger ? 'Trigger' : def.category === 'ai' ? 'AI' : def.category || 'Action'}
              </p>
              <p className="text-sm font-semibold text-fg dark:text-white truncate">
                {node.data?.label || def.label}
              </p>
            </div>
            <GripVertical className="w-3.5 h-3.5 text-fg-disabled opacity-0 group-hover:opacity-100 shrink-0" />
          </div>
        </div>
      </div>

      {/* Connection handles */}
      {!isTrigger && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-line-strong border-2 border-white dark:border-slate-900" />
      )}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent border-2 border-white dark:border-slate-900" />

      {selected && (
        <div className="absolute -top-10 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate?.(node.id); }} className="p-1 rounded-lg bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-fg-tertiary hover:text-accent-fg">
            <Copy className="w-3 h-3" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete?.(node.id); }} className="p-1 rounded-lg bg-canvas dark:bg-slate-800 border border-line dark:border-slate-700 text-fg-tertiary hover:text-danger">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

export function getNodeCenter(node) {
  return {
    x: (node.position?.x ?? 0) + NODE_W / 2,
    y: (node.position?.y ?? 0) + NODE_H,
  };
}

export function getNodeTop(node) {
  return {
    x: (node.position?.x ?? 0) + NODE_W / 2,
    y: (node.position?.y ?? 0),
  };
}
