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
        selected ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-[#eef1f8] dark:ring-offset-slate-950 scale-[1.02]' : 'hover:shadow-xl'
      } ${connectingFrom === node.id ? 'ring-2 ring-emerald-400' : ''}`}>
        <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-3 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-start gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {isTrigger ? 'Trigger' : def.category === 'ai' ? 'AI' : def.category || 'Action'}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {node.data?.label || def.label}
              </p>
            </div>
            <GripVertical className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0" />
          </div>
        </div>
      </div>

      {/* Connection handles */}
      {!isTrigger && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-300 border-2 border-white dark:border-slate-900" />
      )}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-teal-500 border-2 border-white dark:border-slate-900 shadow-sm" />

      {selected && (
        <div className="absolute -top-10 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate?.(node.id); }} className="p-1 rounded-lg bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600">
            <Copy className="w-3 h-3" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete?.(node.id); }} className="p-1 rounded-lg bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-500">
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
