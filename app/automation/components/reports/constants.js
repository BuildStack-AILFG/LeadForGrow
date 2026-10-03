export const PERIOD_OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: '365', label: '12 months' }
];

export const SOURCE_FILTER_OPTIONS = [
  { id: 'all', label: 'All sources' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'website', label: 'Website' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'referral', label: 'Referral' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' }
];

export const STAGE_FILTER_OPTIONS = [
  { id: 'all', label: 'All stages' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'converted', label: 'Won' },
  { id: 'lost', label: 'Lost' }
];

export const FUNNEL_STAGES = [
  { key: 'new', label: 'New leads', color: '#4F7CA8' },
  { key: 'contacted', label: 'Contacted', color: '#5C8F8A' },
  { key: 'follow-up', label: 'Interested', color: '#A08040' },
  { key: 'converted', label: 'Won', color: '#1D4B3E' },
  { key: 'lost', label: 'Lost', color: '#B4372F' }
];

export const SOURCE_COLORS = {
  whatsapp: '#059669',
  website: '#2563eb',
  facebook: '#1877f2',
  referral: '#7c3aed',
  phone: '#0891b2',
  email: '#dc2626',
  ad: '#d97706',
  default: '#64748b'
};

export const SAVED_VIEWS_KEY = 'lfg_reports_views';
