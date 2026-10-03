export const CONTACT_TYPES = [
  { key: 'personal', label: 'Personal', badge: 'bg-accent-subtle text-accent-fg border-line' },
  { key: 'business', label: 'Business', badge: 'bg-accent-subtle text-accent-fg border-line' },
];

export const TABLE_COLUMNS = [
  { key: 'contact', label: 'Contact', sortable: true, minWidth: 220 },
  { key: 'company', label: 'Company', sortable: false, minWidth: 160 },
  { key: 'email', label: 'Email', sortable: false, minWidth: 180 },
  { key: 'phone', label: 'Phone', sortable: false, minWidth: 130 },
  { key: 'jobTitle', label: 'Job Title', sortable: false, minWidth: 140 },
  { key: 'owner', label: 'Owner', sortable: false, minWidth: 140 },
  { key: 'openDeals', label: 'Open Deals', sortable: false, minWidth: 100 },
  { key: 'lastActivity', label: 'Last Activity', sortable: true, minWidth: 120 },
  { key: 'type', label: 'Type', sortable: true, minWidth: 110 },
];

export const SORT_OPTIONS = [
  { key: 'fullName', label: 'Contact Name' },
  { key: 'updatedAt', label: 'Last Activity' },
  { key: 'createdAt', label: 'Recently Added' },
  { key: 'type', label: 'Type' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_FILTERS = {
  search: '',
  type: '',
  ownerId: '',
  hasOpenDeals: '',
  recentlyAdded: false,
  sort: 'updatedAt',
  dir: 'desc',
  page: 1,
  limit: 25,
};

export const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  type: 'personal',
  jobTitle: '',
  companyId: '',
  ownerId: '',
};
