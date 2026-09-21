'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, UserPlus } from 'lucide-react';
import { mapTeamMemberOptions } from '@/app/automation/components/leads/utils';

const MENU_W = 220;

/**
 * Split button for a conversation row: [ Assign to me | v ]. The left part is one click for yourself; the chevron opens
 * the team (everyone else). The menu is portalled to <body> with fixed coordinates: the conversation list scrolls and
 * clips, so a menu inside a row would be cut off for the first and last rows.
 */
export default function AssignMenu({ chat, teamMembers = [], currentUserId, onAssignToMe, onAssignTo }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const others = mapTeamMemberOptions(teamMembers).filter((m) => String(m.id) !== String(currentUserId));

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true); // any scroll (the list included) moves the row away from the menu
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current.getBoundingClientRect();
    const menuH = Math.min(280, 16 + Math.max(others.length, 1) * 34);
    const fitsBelow = window.innerHeight - r.bottom > menuH + 8;
    setPos({
      left: Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8)),
      top: fitsBelow ? r.bottom + 4 : Math.max(8, r.top - menuH - 4),
    });
    setOpen(true);
  };

  const pick = (userId) => {
    setOpen(false);
    onAssignTo?.(chat, userId);
  };

  const part = 'inline-flex items-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-brand-tint dark:hover:bg-slate-800';

  return (
    <div className="inline-flex items-stretch" data-row-action="assign">
      <button
        type="button"
        title="Assign this conversation to yourself"
        onClick={() => onAssignToMe?.(chat)}
        className={`${part} gap-1 pl-2 pr-1.5 py-0.5 text-[11px] font-medium rounded-l`}
      >
        <UserPlus className="w-3 h-3" />
        Assign to me
      </button>
      <button
        ref={btnRef}
        type="button"
        title="Assign to a team member"
        aria-label="Assign to a team member"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={`${part} px-1 rounded-r border-l-0`}
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', left: pos.left, top: pos.top, width: MENU_W }}
          className="z-[90] max-h-[280px] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-lg p-1.5"
        >
          <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-slate-400">Assign to</p>
          {others.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">No other team members yet.</p>
          ) : (
            others.map((m) => (
              <button
                key={m.id}
                type="button"
                role="menuitem"
                onClick={() => pick(m.id)}
                className="w-full text-left px-3 py-1.5 text-xs rounded truncate text-slate-700 dark:text-slate-200 hover:bg-brand-tint dark:hover:bg-slate-800"
              >
                {m.label}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
