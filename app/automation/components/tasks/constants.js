import { Clock, AlertCircle, Calendar, CheckCircle2, Phone, MessageCircle, Mail, Users } from 'lucide-react';

export const TASK_FILTERS = [
  { id: 'today', label: 'Due Today', icon: Clock },
  { id: 'overdue', label: 'Overdue', icon: AlertCircle },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'all', label: 'All Tasks', icon: CheckCircle2 }
];

export const TASK_TYPES = {
  call: { label: 'Call', icon: Phone, accent: 'blue' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, accent: 'green' },
  email: { label: 'Email', icon: Mail, accent: 'sky' },
  meeting: { label: 'Meeting', icon: Users, accent: 'slate' }
};

export const TASK_TYPE_ACCENTS = {
  blue: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/40 dark:text-accent-fg',
  green: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/40 dark:text-accent-fg',
  sky: 'bg-info-subtle text-info dark:bg-sky-950/40 dark:text-sky-400',
  slate: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary'
};

export const TABLE_COLUMNS = [
  { key: 'task', label: 'Task', minWidth: 200 },
  { key: 'lead', label: 'Lead', minWidth: 140 },
  { key: 'type', label: 'Type', minWidth: 100 },
  { key: 'due', label: 'Due', minWidth: 140 },
  { key: 'assignee', label: 'Assignee', minWidth: 120 },
  { key: 'actions', label: 'Actions', minWidth: 160 }
];
