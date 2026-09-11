'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { formatRelative } from '../utils';
import ActivityItem from '../../dashboard/primitives/ActivityItem';
import { WorkflowGroupItem } from '../../dashboard/primitives/WorkflowGroupItem';
import { formatTimelineItems } from '@/lib/crm/timelinePresentation';

export default function LeadActivityTab({ activities = [], expandWorkflows = true }) {
  const sorted = formatTimelineItems(activities, { expandWorkflows });

  if (!sorted.length) {
    return <p className="text-sm text-slate-500 text-center py-12">No activity recorded yet.</p>;
  }

  return (
    <div className="max-h-[560px] overflow-y-auto pr-1">
      {sorted.map((activity, i) =>
        activity.isWorkflowGroup ? (
          <WorkflowGroupItem
            key={activity._id || activity.metadata?.groupId || i}
            activity={activity}
            showConnector={i < sorted.length - 1}
          />
        ) : (
          <ActivityItem
            key={activity._id || i}
            activity={activity}
            showConnector={i < sorted.length - 1}
          />
        )
      )}
    </div>
  );
}

export function LeadNotesTab({ notes = [], onAdd, updating }) {
  const [text, setText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onAdd(text);
    setText('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an internal note..."
          className="flex-1 text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={updating || !text.trim()}
          className="px-3 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <ul className="space-y-2 max-h-[480px] overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No notes yet.</p>
        ) : (
          notes.map((note, i) => (
            <li key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-800 dark:text-slate-200">{note.text}</p>
              <p className="text-[11px] text-slate-400 mt-1.5">{formatRelative(note.addedAt)}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function LeadTasksTab({ tasks = [], teamMembers, onCreate, onComplete }) {
  const [form, setForm] = useState({
    type: 'call',
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: typeof window !== 'undefined' ? localStorage.getItem('userid') || '' : ''
  });
  const [showForm, setShowForm] = useState(false);

  const pending = tasks.filter((t) => t.status === 'pending');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onCreate(form);
    if (ok) {
      setShowForm(false);
      setForm((f) => ({ ...f, title: '' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">{pending.length} pending task(s)</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-teal-600 hover:underline"
        >
          {showForm ? 'Cancel' : '+ Schedule follow-up'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          <input
            required
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            >
              <option value="call">Call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            />
          </div>
          <button type="submit" className="w-full py-2 text-sm font-medium bg-teal-600 text-white rounded-lg">
            Create task
          </button>
        </form>
      )}

      <ul className="space-y-2 max-h-[420px] overflow-y-auto">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No pending follow-ups.</p>
        ) : (
          pending.map((task) => (
            <li
              key={task._id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title || task.type}</p>
                <p className="text-xs text-slate-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</p>
              </div>
              <button
                type="button"
                onClick={() => onComplete(task._id)}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 flex-shrink-0"
              >
                Done
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
