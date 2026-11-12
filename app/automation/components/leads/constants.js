export {
  PIPELINE_STAGES,
  STATUS_CONFIG,
  LEAD_STATUS_ROW_COLORS,
  LEAD_STATUS_ACCENT_COLORS,
  LEAD_LEGACY_STATUS_MAP,
  normalizeLeadStatus,
  getLeadKanbanStage,
} from '@/lib/crm/leadStages';

export const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', badge: 'bg-danger-subtle text-danger dark:bg-red-950/40 dark:text-red-400' },
  high: { label: 'High', badge: 'bg-danger-subtle text-danger dark:bg-red-950/30 dark:text-red-400' },
  medium: { label: 'Medium', badge: 'bg-warning-subtle text-warning dark:bg-orange-950/30 dark:text-orange-400' },
  low: { label: 'Low', badge: 'bg-muted text-fg-secondary dark:bg-slate-800 dark:text-fg-tertiary' }
};

export const SCORE_CONFIG = {
  High: { badge: 'bg-success-subtle text-success' },
  Medium: { badge: 'bg-muted text-fg-secondary' },
  Low: { badge: 'bg-muted text-fg-tertiary' }
};

export const SOURCE_OPTIONS = [
  { value: '', label: 'All Sources' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
  { value: 'form', label: 'Form' },
  { value: 'bot', label: 'Chatbot' },
  { value: 'manual', label: 'Manual' },
  { value: 'meta_ads', label: 'Meta Ads' },
  { value: 'instagram_ad', label: 'Instagram Ad' },
  { value: 'facebook_ad', label: 'Facebook Ad' },
  { value: 'referral', label: 'Referral' },
  { value: 'call', label: 'Call' },
  { value: 'other', label: 'Other' }
];

export const SMART_VIEWS = [
  { id: 'all', label: 'All leads' },
  { id: 'my-leads', label: 'My leads' },
  { id: 'today-followups', label: 'Follow-ups today' },
  { id: 'hot', label: 'Hot leads' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'whatsapp-unread', label: 'Unread on WhatsApp' }
];

export const SAVED_VIEWS_KEY = 'lfg_leads_saved_views';

/** Light row highlight colors for the leads table (Tailwind 100 shades). */
export const LEAD_ROW_COLORS_LIGHT = [
  { id: 'white', value: '#ffffff', dark: 'rgba(255, 255, 255, 0.06)', label: 'White' },
  { id: 'amber', value: '#fef3c7', dark: 'rgba(254, 243, 199, 0.15)', label: 'Amber' },
  { id: 'blue', value: '#dbeafe', dark: 'rgba(219, 234, 254, 0.15)', label: 'Blue' },
  { id: 'green', value: '#dcfce7', dark: 'rgba(220, 252, 231, 0.15)', label: 'Green' },
  { id: 'pink', value: '#fce7f3', dark: 'rgba(252, 231, 243, 0.15)', label: 'Pink' },
  { id: 'indigo', value: '#e0e7ff', dark: 'rgba(224, 231, 255, 0.15)', label: 'Indigo' },
  { id: 'orange', value: '#ffedd5', dark: 'rgba(255, 237, 213, 0.15)', label: 'Orange' },
  { id: 'purple', value: '#f3e8ff', dark: 'rgba(243, 232, 255, 0.15)', label: 'Purple' },
  { id: 'teal', value: '#ccfbf1', dark: 'rgba(204, 251, 241, 0.15)', label: 'Teal' },
  { id: 'rose', value: '#ffe4e6', dark: 'rgba(255, 228, 230, 0.15)', label: 'Rose' },
  { id: 'slate', value: '#f1f5f9', dark: 'rgba(241, 245, 249, 0.12)', label: 'Slate' }
];

/**
 * Stronger row colors (Tailwind 300 shades) for rows that must stand out. Still light enough
 * that the table's dark text stays readable (≥ 7:1 against #0A0B10); in dark mode they are
 * drawn as a heavier wash than the light set (see darkRowTint in utils.js).
 */
export const LEAD_ROW_COLORS_STRONG = [
  { id: 'amber-strong', value: '#fcd34d', label: 'Strong amber' },
  { id: 'blue-strong', value: '#93c5fd', label: 'Strong blue' },
  { id: 'green-strong', value: '#86efac', label: 'Strong green' },
  { id: 'pink-strong', value: '#f9a8d4', label: 'Strong pink' },
  { id: 'indigo-strong', value: '#a5b4fc', label: 'Strong indigo' },
  { id: 'orange-strong', value: '#fdba74', label: 'Strong orange' },
  { id: 'purple-strong', value: '#d8b4fe', label: 'Strong purple' },
  { id: 'teal-strong', value: '#5eead4', label: 'Strong teal' },
  { id: 'rose-strong', value: '#fda4af', label: 'Strong rose' },
  { id: 'slate-strong', value: '#cbd5e1', label: 'Strong slate' }
];

export const LEAD_ROW_COLOR_GROUPS = [
  { id: 'light', label: 'Light', colors: LEAD_ROW_COLORS_LIGHT },
  { id: 'strong', label: 'Strong', colors: LEAD_ROW_COLORS_STRONG }
];

/** Every selectable row color (light then strong). */
export const LEAD_ROW_COLORS = [...LEAD_ROW_COLORS_LIGHT, ...LEAD_ROW_COLORS_STRONG];

export const STRONG_ROW_COLOR_VALUES = new Set(LEAD_ROW_COLORS_STRONG.map((c) => c.value));

export const TABLE_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true, minWidth: 180, align: 'left' },
  { key: 'phone', label: 'Phone', sortable: false, minWidth: 130, align: 'left' },
  { key: 'source', label: 'Source', sortable: true, minWidth: 110, align: 'left' },
  { key: 'status', label: 'Status', sortable: true, minWidth: 120, align: 'left' },
  { key: 'assignedTo', label: 'Owner', sortable: true, minWidth: 130, align: 'left' },
  { key: 'lastActivity', label: 'Last activity', sortable: true, minWidth: 120, align: 'left' },
  { key: 'score', label: 'Score', sortable: true, minWidth: 80, align: 'right' },
  { key: 'receivedAt', label: 'Created', sortable: true, minWidth: 100, align: 'left' },
];

/** White vertical divider between table columns */
export const TABLE_COL_LINE = '';
/** Row divider — #E5E5E7 matches Interakt's own Contacts table border exactly. */
export const TABLE_ROW_LINE = 'border-b border-solid border-line';
