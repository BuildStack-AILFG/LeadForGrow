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
  emerald: 'bg-accent-subtle text-accent-fg dark:bg-emerald-950/50 dark:text-accent-fg',
  violet: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/50 dark:text-accent-fg',
  red: 'bg-danger-subtle text-danger dark:bg-red-950/50 dark:text-red-400',
  rose: 'bg-danger-subtle text-danger dark:bg-rose-950/50 dark:text-rose-400',
  blue: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/50 dark:text-accent-fg',
  purple: 'bg-accent-subtle text-accent-fg dark:bg-purple-950/50 dark:text-accent-fg',
  amber: 'bg-warning-subtle text-warning dark:bg-amber-950/50 dark:text-amber-400',
  slate: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-disabled',
  indigo: 'bg-accent-subtle text-accent-fg dark:bg-indigo-950/50 dark:text-accent-fg',
  orange: 'bg-warning-subtle text-warning dark:bg-orange-950/50 dark:text-orange-400',
  green: 'bg-accent-subtle text-accent-fg dark:bg-green-950/50 dark:text-accent-fg'
};

export const HEALTH_STYLES = {
  healthy: { label: 'Healthy', dot: 'bg-accent', text: 'text-accent-fg dark:text-accent-fg', bg: 'bg-accent-subtle dark:bg-emerald-950/30' },
  warning: { label: 'Needs attention', dot: 'bg-warning', text: 'text-warning dark:text-amber-400', bg: 'bg-warning-subtle dark:bg-amber-950/30' },
  error: { label: 'Error', dot: 'bg-danger', text: 'text-danger dark:text-red-400', bg: 'bg-danger-subtle dark:bg-red-950/30' },
  unknown: { label: 'Unknown', dot: 'bg-slate-400', text: 'text-fg-tertiary dark:text-fg-tertiary', bg: 'bg-subtle dark:bg-slate-800/50' },
  disconnected: { label: 'Not connected', dot: 'bg-slate-400', text: 'text-fg-tertiary dark:text-fg-tertiary', bg: 'bg-subtle dark:bg-slate-800/50' }
};

export const STATUS_LABELS = {
  connected: 'Connected',
  disconnected: 'Disconnected',
  expired: 'Expired',
  needs_reauth: 'Needs re-auth',
  sync_failed: 'Sync failed',
  rate_limited: 'Rate limited'
};
