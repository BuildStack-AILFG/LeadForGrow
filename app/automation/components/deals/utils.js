import {
  getStageLabel,
  getStageProbability,
  getStageConfig,
  stageBadgeStyle,
} from '@/lib/crm/pipelineUtils';

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'D';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function ownerName(owner) {
  if (!owner) return 'Unassigned';
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(' ');
  return name || owner.email || 'Unassigned';
}

export function formatValue(amount, currency = 'INR') {
  const n = Number(amount) || 0;
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';
  if (n >= 10000000) return `${sym}${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${sym}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toLocaleString('en-IN')}`;
}

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

export function stageBadgeClass(stage, stages = []) {
  const config = getStageConfig(stages, stage);
  if (stageBadgeStyle(config)) return '';
  return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700';
}

export function companyOrContact(deal) {
  if (deal?.companyId?.name) return deal.companyId.name;
  if (deal?.leadId?.name) return deal.leadId.name;
  if (deal?.contactId?.fullName) return deal.contactId.fullName;
  return '—';
}

export function dealProbability(deal, stages = []) {
  return getStageProbability(stages, deal?.stage, deal?.probability);
}

export function buildDealsQuery(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.stage) params.set('stage', filters.stage);
  if (filters.ownerId) params.set('ownerId', filters.ownerId);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.dir) params.set('dir', filters.dir);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString();
}

export { getStageLabel as stageLabel };
