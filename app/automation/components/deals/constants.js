export const STAGE_BADGE = {
  discovery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  demo_scheduled: 'bg-teal-50 text-teal-700 border-teal-200',
  proposal_sent: 'bg-purple-50 text-purple-700 border-purple-200',
  negotiation: 'bg-amber-50 text-amber-800 border-amber-200',
  contract_sent: 'bg-orange-50 text-orange-800 border-orange-200',
  payment_pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  won: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  lost: 'bg-red-50 text-red-700 border-red-200',
  // Legacy keys (display only)
  new_lead: 'bg-slate-50 text-slate-700 border-slate-200',
  first_contact: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  qualified: 'bg-violet-50 text-violet-700 border-violet-200',
  demo_completed: 'bg-sky-50 text-sky-700 border-sky-200',
  quotation_sent: 'bg-purple-50 text-purple-700 border-purple-200',
  follow_up: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  decision_pending: 'bg-orange-50 text-orange-800 border-orange-200',
  converted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
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
