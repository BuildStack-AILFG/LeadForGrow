import { COMPANY_STATUSES } from './constants';

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function ownerName(owner) {
  if (!owner) return 'Unassigned';
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email || 'Unassigned';
}

export function formatCurrency(amount, currency = 'INR') {
  const n = Number(amount) || 0;
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';
  if (n >= 10000000) return `${sym}${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${sym}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toLocaleString('en-IN')}`;
}

export function formatRelative(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function statusConfig(status) {
  return COMPANY_STATUSES.find((s) => s.key === status) || COMPANY_STATUSES[0];
}

export function formatWebsite(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function buildCompaniesQuery(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.industry) params.set('industry', filters.industry);
  if (filters.status) params.set('status', filters.status);
  if (filters.ownerId) params.set('ownerId', filters.ownerId);
  if (filters.country) params.set('country', filters.country);
  if (filters.hasOpenDeals) params.set('hasOpenDeals', filters.hasOpenDeals);
  if (filters.recentlyAdded) params.set('recentlyAdded', '1');
  if (filters.archived) params.set('archived', 'true');
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.dir) params.set('dir', filters.dir);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString();
}

export function companyLogoUrl(company) {
  if (company?.logo) return company.logo;
  const domain = company?.domain || formatWebsite(company?.website);
  if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return null;
}
