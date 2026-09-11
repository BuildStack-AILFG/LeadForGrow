'use client';

import { ChevronDown, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';

export default function WorkspaceSwitcher({ compact = false }) {
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${compact ? 'p-2' : 'p-3'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        {!compact && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{workspace.name}</p>
            <p className="text-[10px] text-slate-400">{workspace.plan} · {workspace.members} members</p>
          </div>
        )}
        {!compact && <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => { switchWorkspace(ws.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 ${ws.id === workspace.id ? 'text-teal-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
              >
                {ws.name}
                <span className="text-slate-400 ml-1">· {ws.plan}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
