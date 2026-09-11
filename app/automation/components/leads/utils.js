import { STATUS_CONFIG, LEAD_STATUS_ROW_COLORS, LEAD_STATUS_ACCENT_COLORS, PIPELINE_STAGES } from './constants';
import { normalizeLeadStatus } from '@/lib/crm/leadStages';

/** Unwrap User from TeamMember { userId: {...} } or return User as-is */
export function resolveTeamUser(member) {
  if (!member) return null;
  if (member.email && !member.userId) return member;
  const u = member.userId;
  if (u && typeof u === 'object') return u;
  if (typeof u === 'string') return { _id: u };
  return member;
}

export function assigneeName(userOrMember) {
  const user = resolveTeamUser(userOrMember);
  if (!user) return 'Unassigned';
  const first = user.firstName || user.first_name;
  const last = user.lastName || user.last_name;
  if (first || last) return [first, last].filter(Boolean).join(' ');
  if (user.name) return user.name;
  if (userOrMember?.role === 'owner' && !user.email) return 'Business Owner';
  if (user.email) {
    const local = user.email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return 'Team member';
}

/** User._id for assignment (not TeamMember._id) */
export function teamMemberUserId(member) {
  const id = resolveTeamUser(member)?._id;
  return id != null ? String(id) : '';
}

/** Consistent { id, label } pairs for assignment dropdowns */
export function mapTeamMemberOptions(teamMembers = []) {
  return teamMembers.map((m) => ({
    id: teamMemberUserId(m),
    label: assigneeName(m),
  })).filter((o) => o.id);
}

export function formatDate(date, opts = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: opts.year ? 'numeric' : undefined,
    ...opts
  });
}

export function formatRelative(date) {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

/** Follow-up column: date label, sub-label, and visual tone */
export function getFollowUpMeta(date) {
  if (!date) {
    return { key: 'none', dateLabel: '—', subLabel: 'Not scheduled', tone: 'muted' };
  }

  const dueDay = new Date(date);
  dueDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDay - today) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      key: 'overdue',
      dateLabel: formatDate(date),
      subLabel: overdue === 1 ? '1 day overdue' : `${overdue} days overdue`,
      tone: 'overdue',
    };
  }
  if (diffDays === 0) {
    return { key: 'today', dateLabel: formatDate(date), subLabel: 'Due today', tone: 'today' };
  }
  if (diffDays === 1) {
    return { key: 'tomorrow', dateLabel: formatDate(date), subLabel: 'Tomorrow', tone: 'upcoming' };
  }
  return {
    key: 'upcoming',
    dateLabel: formatDate(date),
    subLabel: `In ${diffDays} days`,
    tone: 'upcoming',
  };
}

export function formatSource(source) {
  if (!source) return 'Unknown';
  return source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusLabel(status) {
  const key = normalizeLeadStatus(status);
  return STATUS_CONFIG[key]?.label || STATUS_CONFIG[status]?.label || status || 'Unknown';
}

export function getWhatsAppStatus(lead) {
  const isWa = lead.source === 'whatsapp' || lead.whatsappId || lead.whatsapp;
  if (!isWa) return { key: 'none', label: '—', dot: 'bg-slate-300' };

  if (!lead.isRead) {
    return { key: 'unread', label: 'Unread', dot: 'bg-teal-500' };
  }
  if (lead.status === 'contacted' || lead.status === 'interested' || lead.status === 'converted' || lead.status === 'first_contact' || lead.status === 'won') {
    return { key: 'replied', label: 'Replied', dot: 'bg-emerald-500' };
  }
  if (lead.status === 'new' || lead.status === 'new_lead' || lead.status === 'follow-up' || lead.status === 'follow_up') {
    return { key: 'pending', label: 'Pending', dot: 'bg-orange-400' };
  }
  return { key: 'no-response', label: 'No reply', dot: 'bg-slate-400' };
}

export function getLeadTags(lead) {
  const tags = [];
  if (lead.serviceInterest) tags.push(lead.serviceInterest);
  if (lead.priority === 'high' || lead.priority === 'urgent') tags.push('Hot');
  if (lead.campaignName) tags.push(lead.campaignName.slice(0, 20));
  return tags.slice(0, 3);
}

export function buildLeadsQuery(filters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.source) params.set('source', filters.source);
  if (filters.assignedTo) params.set('assignedTo', filters.assignedTo);
  if (filters.view && filters.view !== 'all' && filters.view !== 'kanban') {
    params.set('view', filters.view);
  }
  if (filters.kanban) {
    params.set('kanban', '1');
    params.set('page', '1');
    params.set('limit', String(filters.kanbanLimit || 500));
  }
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.showConverted) params.set('showConverted', '1');
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString();
}

export function getStatusRowColor(status) {
  const key = normalizeLeadStatus(status);
  return LEAD_STATUS_ROW_COLORS[key] || LEAD_STATUS_ROW_COLORS[status] || null;
}

export function getStatusAccentColor(status) {
  const key = normalizeLeadStatus(status);
  return LEAD_STATUS_ACCENT_COLORS[key] || LEAD_STATUS_ACCENT_COLORS[status] || '#94a3b8';
}

/** Manual rowColor overrides automatic status color */
export function getLeadRowBackgroundStyle(lead) {
  const color = lead?.rowColor || getStatusRowColor(lead?.status);
  if (!color) return undefined;
  return { backgroundColor: color };
}

function readMeta(lead, key) {
  const meta = lead?.metadata;
  if (!meta) return undefined;
  if (typeof meta.get === 'function') return meta.get(key);
  return meta[key];
}

function readCustom(lead, key) {
  const custom = lead?.customFields;
  if (!custom) return undefined;
  if (typeof custom.get === 'function') return custom.get(key);
  return custom[key];
}

/** Resolve display amount from deal, metadata, or custom fields */
export function getLeadAmount(lead) {
  const candidates = [
    lead?.dealAmount,
    lead?.amount,
    readMeta(lead, 'amount'),
    readMeta(lead, 'dealValue'),
    readMeta(lead, 'revisedAmount'),
    readCustom(lead, 'amount'),
    readCustom(lead, 'dealValue'),
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) {
      return {
        amount: n,
        currency: lead.dealCurrency || readMeta(lead, 'currency') || 'INR',
      };
    }
  }
  return null;
}

/** User id for assignment dropdowns */
export function resolveAssignedToId(lead) {
  if (!lead?.assignedTo) return '';
  const a = lead.assignedTo;
  if (typeof a === 'string') return a;
  if (a._id != null) return String(a._id);
  if (typeof a.toString === 'function') return a.toString();
  return '';
}

/** Stage value for &lt;select&gt; — includes converted and legacy keys */
export function resolveStageSelectValue(status) {
  const key = normalizeLeadStatus(status);
  const known = PIPELINE_STAGES.map((s) => s.key);
  if (known.includes(key)) return key;
  if (status && known.includes(status)) return status;
  return 'new';
}

export const STAGE_SELECT_OPTIONS = [...PIPELINE_STAGES];

export { validateStageTransition } from '@/lib/crm/leadStages';

export function formatLeadAmount(amount, currency = 'INR') {
  const sym = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$';
  const n = Number(amount) || 0;
  if (n >= 100000) return `${sym}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(1)}K`;
  return `${sym}${n.toLocaleString('en-IN')}`;
}
