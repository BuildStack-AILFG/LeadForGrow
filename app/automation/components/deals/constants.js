export const STAGE_BADGE = {
  discovery: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  demo_scheduled: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  proposal_sent: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  negotiation: 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
  contract_sent: 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
  payment_pending: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  won: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
  lost: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  // Legacy keys (display only)
  new_lead: 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  first_contact: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  qualified: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  demo_completed: 'bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  quotation_sent: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  follow_up: 'bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800',
  decision_pending: 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800',
  converted: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
};

export const TABLE_COLUMNS = [
  { key: 'deal', label: 'Deal', sortable: true, minWidth: 220 },
  { key: 'companyContact', label: 'Company/Contact', sortable: false, minWidth: 160 },
  { key: 'stage', label: 'Stage', sortable: true, minWidth: 130 },
  { key: 'amount', label: 'Amount', sortable: true, minWidth: 110 },
  { key: 'probability', label: 'Probability', sortable: false, minWidth: 120 },
  { key: 'closeDate', label: 'Close Date', sortable: true, minWidth: 120 },
  { key: 'owner', label: 'Owner', sortable: false, minWidth: 140 },
];

export const FILTERS = [
  { id: 'all', label: 'All deals' },
  { id: 'open', label: 'Open' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
];

export const SORT_OPTIONS = [
  { key: 'title', label: 'Deal Name' },
  { key: 'amount', label: 'Amount' },
  { key: 'expectedCloseDate', label: 'Close Date' },
  { key: 'updatedAt', label: 'Last Updated' },
  { key: 'stage', label: 'Stage' },
];

export const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  stage: '',
  ownerId: '',
  sort: 'updatedAt',
  dir: 'desc',
};

export const EMPTY_FORM = {
  title: '',
  amount: '',
  currency: 'INR',
  stage: 'discovery',
  expectedCloseDate: '',
};
