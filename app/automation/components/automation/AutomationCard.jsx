'use client';

import { memo } from 'react';
import { Mail, Smartphone, History, Zap } from 'lucide-react';
import AutomationStatusBadge from './StatusBadge';
import {
  getRuleIcon,
  getTriggerLabel,
  getChannelLabel,
  formatLastExecuted
} from './constants';

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
        enabled ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function AutomationCard({ rule, selected, onSelect, onToggle }) {
  const Icon = getRuleIcon(rule);
  const channel = rule.config?.channel;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(rule)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(rule);
        }
      }}
      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
        selected
          ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            rule.enabled
              ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{rule.name}</p>
            <Toggle enabled={rule.enabled} onChange={() => onToggle(rule._id)} />
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{rule.description}</p>

          <div className="flex flex-wrap items-center gap-1.5">
            <AutomationStatusBadge rule={rule} size="xs" />
            {channel && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {channel === 'email' ? <Mail className="w-3 h-3" /> : channel === 'whatsapp' ? <Smartphone className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                {getChannelLabel(rule)}
              </span>
            )}
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-[10px] text-slate-500">{getTriggerLabel(rule)}</span>
          </div>

          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
            <span className="tabular-nums">{rule.executionCount || 0} runs</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <History className="w-3 h-3" />
              {formatLastExecuted(rule.lastExecutedAt)}
            </span>
            {rule.config?.delayHours > 0 && (
              <>
                <span>·</span>
                <span>{rule.config.delayHours}h delay</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AutomationCard);
