'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MoreHorizontal,
  ExternalLink,
  MessageSquare,
  Phone,
  UserPlus,
  RefreshCw,
  StickyNote,
  Calendar,
  Trophy,
  XCircle
} from 'lucide-react';
import { PIPELINE_STAGES } from './constants';
import { mapTeamMemberOptions } from './utils';

export default function LeadActionsMenu({
  lead,
  teamMembers,
  onAssign,
  onStatusChange,
  onCall,
  onOpenDrawer,
  onConvert
}) {
  const [open, setOpen] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showStage, setShowStage] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowAssign(false);
        setShowStage(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      {/* Always visible — see LeadRow.jsx's comment on why the old
          `opacity-0 group-hover:opacity-100` reveal never showed this
          button at all on touchscreen devices. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1 text-sm">
          <button
            type="button"
            onClick={() => { onOpenDrawer(lead._id); setOpen(false); }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open lead
          </button>
          <Link
            href={`/automation/chat?leadId=${lead._id}`}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            onClick={() => setOpen(false)}
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </Link>
          <button
            type="button"
            onClick={() => { onCall(lead); setOpen(false); }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
          <button
            type="button"
            onClick={() => { setShowAssign(!showAssign); setShowStage(false); }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <UserPlus className="w-3.5 h-3.5" /> Assign
          </button>
          <button
            type="button"
            onClick={() => { setShowStage(!showStage); setShowAssign(false); }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Change stage
          </button>
          <Link
            href={`/automation/leads/${lead._id}?tab=notes`}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            onClick={() => setOpen(false)}
          >
            <StickyNote className="w-3.5 h-3.5" /> Add note
          </Link>
          <Link
            href={`/automation/tasks?leadId=${lead._id}`}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            onClick={() => setOpen(false)}
          >
            <Calendar className="w-3.5 h-3.5" /> Schedule follow-up
          </Link>
          <hr className="my-1 border-slate-100 dark:border-slate-800" />
          <button
            type="button"
            onClick={() => {
              if (onConvert) onConvert(lead._id);
              else onOpenDrawer(lead._id);
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
          >
            <Trophy className="w-3.5 h-3.5" /> Convert to deal
          </button>
          <button
            type="button"
            onClick={() => { onStatusChange(lead._id, 'lost'); setOpen(false); }}
            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
          >
            <XCircle className="w-3.5 h-3.5" /> Mark lost
          </button>

          {showAssign && (
            <div className="border-t border-slate-100 dark:border-slate-800 max-h-36 overflow-y-auto">
              {mapTeamMemberOptions(teamMembers).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { onAssign(lead._id, m.id); setOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 truncate"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {showStage && (
            <div className="border-t border-slate-100 dark:border-slate-800">
              {PIPELINE_STAGES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { onStatusChange(lead._id, s.key); setOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
