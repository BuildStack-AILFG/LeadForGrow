'use client';

import { CRM_NAV_ICONS } from './CrmIcons';

const NAV = [
  { id: 'automation', label: 'Automation & messaging', description: 'Tasks, templates, delivery', iconKey: 'automation' },
  { id: 'pipeline', label: 'Pipeline governance', description: 'Stage rules & AI scoring', iconKey: 'pipeline' },
  { id: 'stages', label: 'Pipeline architecture', description: 'Lead & deal stage maps', iconKey: 'stages' },
  { id: 'notifications', label: 'Team notifications', description: 'Internal alerts', iconKey: 'notifications' },
  { id: 'reminders', label: 'Schedule & reminders', description: 'Meetings & payments', iconKey: 'reminders' },
];

export default function CrmSettingsNav({ active, onChange }) {
  return (
    <nav className="space-y-0.5" aria-label="CRM settings sections">
      {NAV.map((item) => {
        const Icon = CRM_NAV_ICONS[item.iconKey];
        const isActive =
          active === item.id || (item.id === 'automation' && (active === 'tasks' || active === 'templates'));

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative w-full flex items-center gap-3 pl-3 pr-3 py-3 rounded-xl text-left transition-all duration-150 ${
              isActive
                ? 'bg-white dark:bg-slate-900 shadow-sm border border-slate-200/90 dark:border-slate-800'
                : 'border border-transparent hover:bg-white/60 dark:hover:bg-slate-900/40 hover:border-slate-200/60 dark:hover:border-slate-800/60'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-full bg-indigo-600 dark:bg-indigo-500" />
            )}
            <span
              className={`ml-0.5 flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-indigo-600'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[13px] font-semibold truncate tracking-tight ${
                  isActive ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </span>
              <span className="block text-[11px] mt-0.5 truncate text-slate-500 dark:text-slate-500">
                {item.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function CrmSettingsSaveBar({ dirty, saving, onSave }) {
  if (!dirty && !saving) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <div className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-xl text-white shadow-2xl shadow-slate-950/40 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm font-medium text-slate-200">Unsaved configuration changes</p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 transition-all shadow-sm"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
