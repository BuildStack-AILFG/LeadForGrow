'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

const STATUS_ICON = {
  success: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  partial: Clock,
  skipped: Clock,
};

function WorkflowGroupItem({ activity, showConnector }) {
  const [open, setOpen] = useState(false);
  const steps = activity.steps || activity.metadata?.steps || [];
  const RunIcon = STATUS_ICON[activity.runStatus] || CheckCircle2;
  const time = activity.performedAt
    ? new Date(activity.performedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="flex gap-3 relative">
      {showConnector && (
        <span className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
      )}
      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center flex-shrink-0 z-[1]">
        <RunIcon className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${activity.runStatus === 'running' ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1 min-w-0 pb-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full text-left flex items-start justify-between gap-2"
        >
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {activity.workflowName || activity.description}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {steps.length} step{steps.length !== 1 ? 's' : ''} · {activity.runStatus || 'success'} · {time}
            </p>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
        </button>
        {open && steps.length > 0 && (
          <ul className="mt-2 space-y-1 pl-1 border-l-2 border-indigo-100 dark:border-indigo-900 ml-1">
            {steps.map((step) => {
              const Icon = STATUS_ICON[step.status] || CheckCircle2;
              return (
                <li key={step.key} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 py-0.5 pl-2">
                  <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${step.status === 'success' ? 'text-emerald-500' : step.status === 'failed' ? 'text-red-500' : 'text-slate-400'}`} />
                  <span className="flex-1">{step.label}</span>
                  {step.retries > 0 && <span className="text-[10px] text-slate-400">retry {step.retries}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export { WorkflowGroupItem };
