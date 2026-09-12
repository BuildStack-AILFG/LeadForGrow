'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Pin, PinOff, Star, Archive, ArchiveRestore, ShieldAlert, ShieldCheck,
  MoreVertical, UserCheck, XCircle, CheckCircle, Clock, Mail, Download, Trash2, Eye,
} from 'lucide-react';

// Snooze presets — mirrors what Gmail/Front offer.
const SNOOZE_PRESETS = [
  { id: '1h', label: 'For 1 hour', ms: 60 * 60 * 1000 },
  { id: '3h', label: 'For 3 hours', ms: 3 * 60 * 60 * 1000 },
  { id: 'tomorrow', label: 'Until tomorrow 9 AM', ms: 0, computeAt: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.getTime() - Date.now();
    } },
  { id: 'nextweek', label: 'Until next Monday 9 AM', ms: 0, computeAt: () => {
      const d = new Date();
      const daysUntilMon = ((1 - d.getDay() + 7) % 7) || 7;
      d.setDate(d.getDate() + daysUntilMon);
      d.setHours(9, 0, 0, 0);
      return d.getTime() - Date.now();
    } },
];

export default function InboxActionsMenu({ chat, onUpdate, onClaim, onAction, currentUserId }) {
  const [open, setOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!chat?._id || String(chat._id).startsWith('temp_')) return null;

  const isAssignedToMe =
    chat.assignedTo?._id === currentUserId || chat.assignedTo === currentUserId;
  const isClosed = chat.status === 'closed';

  const actions = [
    { id: 'pin', label: chat.isPinned ? 'Unpin' : 'Pin', icon: chat.isPinned ? PinOff : Pin, onClick: () => onUpdate({ isPinned: !chat.isPinned }) },
    { id: 'favorite', label: chat.isFavorite ? 'Remove favorite' : 'Favorite', icon: Star, onClick: () => onUpdate({ isFavorite: !chat.isFavorite }), active: chat.isFavorite },
    { id: 'archive', label: chat.isArchived ? 'Unarchive' : 'Archive', icon: chat.isArchived ? ArchiveRestore : Archive, onClick: () => onUpdate({ isArchived: !chat.isArchived }) },
    { id: 'spam', label: chat.isSpam ? 'Not spam' : 'Mark spam', icon: chat.isSpam ? ShieldCheck : ShieldAlert, onClick: () => onUpdate({ isSpam: !chat.isSpam }), danger: !chat.isSpam },
    { id: 'unread', label: 'Mark unread', icon: Eye, onClick: () => onAction?.('mark_unread') },
    { id: 'close', label: isClosed ? 'Reopen' : 'Close conversation', icon: isClosed ? CheckCircle : XCircle, onClick: () => onAction?.(isClosed ? 'reopen' : 'close') },
    { id: 'snooze', label: 'Snooze…', icon: Clock, onClick: () => setSnoozeOpen((v) => !v), keepOpen: true },
    ...(chat.snoozedUntil && new Date(chat.snoozedUntil) > new Date() ? [
      { id: 'unsnooze', label: 'Unsnooze now', icon: Clock, onClick: () => onAction?.('unsnooze') }
    ] : []),
    { id: 'export', label: 'Export conversation', icon: Download, onClick: () => onAction?.('export') },
    { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => onAction?.('delete'), danger: true },
    ...(!isAssignedToMe ? [{ id: 'claim', label: 'Claim conversation', icon: UserCheck, onClick: onClaim }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="p-2 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="More actions">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-30 max-h-80 overflow-y-auto">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.id}>
                <button
                  type="button"
                  onClick={() => { action.onClick(); if (!action.keepOpen) setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded transition-colors ${
                    action.danger
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : action.active
                        ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-[#F0F9F5] dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  {action.label}
                </button>
                {action.id === 'snooze' && snoozeOpen && (
                  <div className="ml-[26px] mt-0.5 mb-1 py-1 border-l border-slate-100 dark:border-slate-800 pl-2 space-y-0.5">
                    {SNOOZE_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const ms = p.computeAt ? p.computeAt() : p.ms;
                          const until = new Date(Date.now() + ms).toISOString();
                          onAction?.('snooze', { until });
                          setOpen(false);
                          setSnoozeOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-slate-400 hover:bg-[#F0F9F5] dark:hover:bg-slate-800 rounded transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
