export const INTEGRATION_CATEGORIES = [
  { id: 'all', label: 'All integrations' },
  { id: 'communication', label: 'Communication' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'payments', label: 'Payments' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'automation', label: 'Automation' },
  { id: 'meetings', label: 'Meeting Tools' },
  { id: 'crm-imports', label: 'CRM Imports' }
];

export const HEALTH_FILTERS = [
  { id: 'all', label: 'All status' },
  { id: 'connected', label: 'Connected' },
  { id: 'disconnected', label: 'Not connected' },
  { id: 'healthy', label: 'Healthy' },
  { id: 'warning', label: 'Needs attention' },
  { id: 'error', label: 'Error' }
];

export const COLOR_MAP = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
  blue: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
};

export const HEALTH_STYLES = {
  healthy: { label: 'Healthy', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  warning: { label: 'Needs attention', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  error: { label: 'Error', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  unknown: { label: 'Unknown', dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50' },
  disconnected: { label: 'Not connected', dot: 'bg-slate-400', text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/50' }
};

export const STATUS_LABELS = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  expired: 'Expired',
  needs_reauth: 'Needs re-auth',
  sync_failed: 'Sync failed',
  rate_limited: 'Rate limited'
};
