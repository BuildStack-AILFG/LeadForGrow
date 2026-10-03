export const STAGE_BADGE = {
  discovery: 'bg-accent-subtle text-accent-fg border-line',
  demo_scheduled: 'bg-accent-subtle text-accent-fg border-line',
  proposal_sent: 'bg-accent-subtle text-accent-fg border-line',
  negotiation: 'bg-warning-subtle text-warning border-warning/30',
  contract_sent: 'bg-warning-subtle text-warning border-warning/30',
  payment_pending: 'bg-warning-subtle text-warning border-warning/30',
  won: 'bg-accent-subtle text-accent-fg border-line',
  lost: 'bg-danger-subtle text-danger border-danger/30',
  // Legacy keys (display only)
  new_lead: 'bg-subtle text-fg-secondary border-line',
  first_contact: 'bg-accent-subtle text-accent-fg border-line',
  qualified: 'bg-accent-subtle text-accent-fg border-line',
  demo_completed: 'bg-info-subtle text-info border-info/30',
  quotation_sent: 'bg-accent-subtle text-accent-fg border-line',
  follow_up: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  decision_pending: 'bg-warning-subtle text-warning border-warning/30',
  converted: 'bg-accent-subtle text-accent-fg border-line',
};

export const TABLE_COLUMNS = [
  { key: 'deal', label: 'Deal', sortable: true, minWidth: 220 },
  { key: 'companyContact', label: 'Company / contact', sortable: false, minWidth: 160 },
  { key: 'stage', label: 'Stage', sortable: true, minWidth: 130 },
  { key: 'amount', label: 'Amount', sortable: true, minWidth: 110, align: 'right' },
  { key: 'probability', label: 'Probability', sortable: false, minWidth: 120, align: 'right' },
  { key: 'closeDate', label: 'Close date', sortable: true, minWidth: 120 },
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
