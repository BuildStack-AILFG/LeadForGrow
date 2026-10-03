export const COMPANY_STATUSES = [
  { key: 'prospect', label: 'Prospect', badge: 'bg-muted dark:bg-slate-800 text-fg-secondary dark:text-slate-200 border-line dark:border-slate-700' },
  { key: 'customer', label: 'Customer', badge: 'bg-accent-subtle dark:bg-emerald-950/30 text-accent-fg dark:text-accent-fg border-line dark:border-emerald-800' },
  { key: 'inactive', label: 'Inactive', badge: 'bg-muted dark:bg-slate-800 text-fg-secondary dark:text-fg-disabled border-line dark:border-slate-700' },
  { key: 'partner', label: 'Partner', badge: 'bg-accent-subtle dark:bg-teal-950/30 text-accent-fg dark:text-accent-fg border-line dark:border-teal-800' },
  { key: 'lost', label: 'Lost', badge: 'bg-danger-subtle dark:bg-red-950/30 text-danger dark:text-red-300 border-danger/30 dark:border-red-800' },
];

export const INDUSTRIES = [
  'Technology',
  'Software',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Consulting',
  'Marketing',
  'Other',
];

export const EMPLOYEE_COUNTS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export const TABLE_COLUMNS = [
  { key: 'name', label: 'Company', sortable: true, minWidth: 220 },
  { key: 'industry', label: 'Industry', sortable: true, minWidth: 120 },
  { key: 'owner', label: 'Owner', sortable: false, minWidth: 140 },
  { key: 'primaryContact', label: 'Primary Contact', sortable: false, minWidth: 160 },
  { key: 'openDeals', label: 'Open Deals', sortable: false, minWidth: 100 },
  { key: 'pipelineValue', label: 'Pipeline Value', sortable: false, minWidth: 120 },
  { key: 'lastActivity', label: 'Last Activity', sortable: true, minWidth: 120 },
  { key: 'status', label: 'Status', sortable: true, minWidth: 110 },
];

export const SORT_OPTIONS = [
  { key: 'name', label: 'Company Name' },
  { key: 'industry', label: 'Industry' },
  { key: 'updatedAt', label: 'Last Activity' },
  { key: 'createdAt', label: 'Recently Added' },
  { key: 'status', label: 'Status' },
];

export const GROUP_OPTIONS = [
  { key: 'none', label: 'No grouping' },
  { key: 'industry', label: 'Industry' },
  { key: 'status', label: 'Status' },
  { key: 'owner', label: 'Owner' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_FILTERS = {
  search: '',
  industry: '',
  status: '',
  ownerId: '',
  country: '',
  hasOpenDeals: '',
  recentlyAdded: false,
  archived: false,
  tag: '',
  sort: 'updatedAt',
  dir: 'desc',
  page: 1,
  limit: 25,
};

export const EMPTY_FORM = {
  name: '',
  industry: '',
  website: '',
  email: '',
  phone: '',
  employeeCount: '',
  status: 'prospect',
  gstNumber: '',
  description: '',
  ownerId: '',
};
