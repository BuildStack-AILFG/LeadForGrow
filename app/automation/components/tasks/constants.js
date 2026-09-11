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
  email: { label: 'Email', icon: Mail, accent: 'purple' },
  meeting: { label: 'Meeting', icon: Users, accent: 'amber' }
};

export const TASK_TYPE_ACCENTS = {
  blue: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
};

export const TABLE_COLUMNS = [
  { key: 'task', label: 'Task', minWidth: 200 },
  { key: 'lead', label: 'Lead', minWidth: 140 },
  { key: 'type', label: 'Type', minWidth: 100 },
  { key: 'due', label: 'Due', minWidth: 140 },
  { key: 'assignee', label: 'Assignee', minWidth: 120 },
  { key: 'actions', label: 'Actions', minWidth: 160 }
];
