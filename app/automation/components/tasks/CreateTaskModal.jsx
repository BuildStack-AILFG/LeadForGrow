'use client';

import { X, Send, Bot as Sparkles, Loader2 } from 'lucide-react';
import { mapTeamMemberOptions } from '../leads/utils';

export default function CreateTaskModal({
  open,
  task,
  onChange,
  leads,
  teamMembers,
  onClose,
  onSubmit,
  saving = false
}) {
  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving) return;
    onSubmit(task);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-canvas dark:bg-slate-900 border border-line dark:border-slate-800 rounded-lg shadow-modal p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-fg dark:text-slate-50">Create task</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded text-fg-tertiary hover:bg-muted dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Lead</label>
              <select
                required
                value={task.leadId}
                onChange={(e) => onChange({ ...task, leadId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="">Select lead...</option>
                {leads.map((l) => (
                  <option key={l._id} value={l._id}>{l.name} · {l.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Assign to</label>
              <select
                required
                value={task.assignedTo}
                onChange={(e) => onChange({ ...task, assignedTo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="">Select teammate...</option>
                {mapTeamMemberOptions(teamMembers).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Type</label>
              <select
                value={task.type}
                onChange={(e) => onChange({ ...task, type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus"
              >
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Due date</label>
              <input
                type="datetime-local"
                required
                value={task.dueDate}
                onChange={(e) => onChange({ ...task, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Discovery call"
              value={task.title}
              onChange={(e) => onChange({ ...task, title: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-fg-secondary dark:text-fg-tertiary mb-1.5">Description</label>
            <textarea
              rows={3}
              value={task.description}
              onChange={(e) => onChange({ ...task, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-subtle dark:bg-slate-800 border border-line dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-focus resize-none"
            />
          </div>

          {(task.type === 'email' || task.type === 'whatsapp') && (
            <div className="p-3 bg-subtle dark:bg-slate-800/50 border border-line dark:border-slate-700 rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-secondary dark:text-fg-tertiary">
                  <Sparkles className="w-3.5 h-3.5 text-accent-fg" /> Auto-send message
                </span>
                <button
                  type="button"
                  onClick={() => onChange({ ...task, autoSend: !task.autoSend })}
                  className={`w-9 h-5 rounded-full relative transition-colors ${task.autoSend ? 'bg-accent' : 'bg-line-strong dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-canvas rounded-full transition-transform ${task.autoSend ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              {task.autoSend && (
                <textarea
                  rows={3}
                  placeholder="Hi {{name}}, following up on..."
                  value={task.messageContent}
                  onChange={(e) => onChange({ ...task, messageContent: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-canvas dark:bg-slate-900 border border-line dark:border-slate-700 rounded resize-none"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </form>
      </div>
    </div>
  );
}
