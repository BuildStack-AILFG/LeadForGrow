'use client';

import {
  LayoutDashboard, Building2, Package, GitBranch, Plug, Database,
  Lock, ChevronRight, Menu, X
} from 'lucide-react';
import { MODEL_GROUPS } from '../constants';

const ICONS = { LayoutDashboard, Building2, Package, GitBranch, Plug, Database };

export default function AdminSidebar({
  models, activeView, selectedModel, onOverview, onSelectModel, onLogout,
  open, onClose,
}) {
  const grouped = MODEL_GROUPS.map((g) => ({
    ...g,
    items: g.id === 'overview'
      ? []
      : g.models.filter((m) => models.includes(m)),
  }));

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shadow-lg">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">LFG Admin</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Control Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        <button
          type="button"
          onClick={onOverview}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeView === 'overview'
              ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
          {activeView === 'overview' && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
        </button>

        {grouped.filter((g) => g.id !== 'overview').map((group) => {
          const Icon = ICONS[group.icon] || Database;
          if (!group.items.length) return null;
          return (
            <div key={group.id}>
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Icon className="w-3 h-3" /> {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => onSelectModel(model)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedModel === model && activeView === 'model'
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Ungrouped models */}
        {(() => {
          const groupedSet = new Set(MODEL_GROUPS.flatMap((g) => g.models));
          const other = models.filter((m) => !groupedSet.has(m));
          if (!other.length) return null;
          return (
            <div>
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Other</p>
              {other.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => onSelectModel(model)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedModel === model ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          );
        })()}
      </nav>

      <div className="p-3 border-t border-white/5">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Lock className="w-4 h-4" /> Lock session
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#0f1629] border-r border-white/5 flex-col">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-72 max-w-[85vw] bg-[#0f1629] flex flex-col shadow-2xl">
            <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
    </>
  );
}

export function AdminMobileHeader({ onMenuOpen }) {
  return (
    <button
      type="button"
      onClick={onMenuOpen}
      className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
