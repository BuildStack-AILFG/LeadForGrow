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
        className={`flex items-center gap-2 w-full rounded-lg border border-line dark:border-slate-700 bg-canvas dark:bg-slate-900 hover:bg-subtle dark:hover:bg-slate-800 transition-colors ${compact ? 'p-2' : 'p-3'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-canvas border border-line dark:bg-teal-950/50 text-fg-secondary dark:text-accent-fg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        {!compact && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-fg dark:text-slate-100 truncate">{workspace.name}</p>
            <p className="text-meta text-fg-tertiary">{workspace.plan} · {workspace.members} members</p>
          </div>
        )}
        {!compact && <ChevronDown className={`w-3.5 h-3.5 text-fg-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded-lg shadow-popover py-1">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => { switchWorkspace(ws.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-subtle dark:hover:bg-slate-800 ${ws.id === workspace.id ? 'text-accent-fg dark:text-accent-fg font-medium' : 'text-fg-secondary dark:text-fg-disabled'}`}
              >
                {ws.name}
                <span className="text-fg-tertiary ml-1">· {ws.plan}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
