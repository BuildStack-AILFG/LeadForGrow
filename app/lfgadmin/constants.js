import { BUSINESS_PLAN_ENUM, PLAN_QUOTAS, PLAN_LABELS } from '@/lib/plans';

export { BUSINESS_PLAN_ENUM, PLAN_QUOTAS, PLAN_LABELS };

export const MODEL_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'LayoutDashboard',
    models: [],
  },
  {
    id: 'platform',
    label: 'Platform',
    icon: 'Building2',
    models: ['User', 'Business', 'Agency', 'AgencyUsage', 'Client'],
  },
  {
    id: 'product',
    label: 'Product',
    icon: 'Package',
    models: ['Form', 'Website', 'OnboardingCall', 'Invoice'],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: 'GitBranch',
    models: ['Lead', 'AutomationRule', 'AutomationSequence', 'SequenceExecution', 'TeamMember', 'Event'],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: 'Plug',
    models: ['Integration', 'IntegrationLog'],
  },
];

export const HARDCODED_ENUMS = {
  plan: BUSINESS_PLAN_ENUM,
  planName: ['Agency Starter', 'Agency Growth', 'Agency Pro', 'Enterprise', 'Free'],
  status: ['active', 'suspended', 'cancelled', 'draft', 'paused', 'archived'],
  role: ['SUPER_ADMIN', 'AGENCY_OWNER', 'CLIENT_ADMIN', 'TEAM_MEMBER', 'VIEW_ONLY', 'owner', 'admin', 'team_member', 'user', 'super'],
};

export const MODEL_DISPLAY_COLUMNS = {
  User: ['email', 'firstName', 'lastName', 'role', 'businessId'],
  Business: ['businessName', 'plan', 'frozen', 'ownerId', 'createdAt'],
  Agency: ['name', 'planName', 'ownerId', 'createdAt'],
  Lead: ['name', 'phone', 'email', 'status', 'source'],
  Form: ['name', 'active', 'submissionCount', 'businessId'],
  AutomationSequence: ['name', 'status', 'triggerType', 'category'],
  AutomationRule: ['name', 'type', 'enabled'],
};

export function planBadgeClass(plan, variant = 'dark') {
  const p = (plan || 'free').toLowerCase();
  if (variant === 'light') {
    const map = {
      free: 'bg-slate-100 text-slate-600 border-slate-200',
      trial: 'bg-blue-100 text-blue-700 border-blue-200',
      growth: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pro: 'bg-violet-100 text-violet-700 border-violet-200',
      premium: 'bg-amber-100 text-amber-800 border-amber-200',
      enterprise: 'bg-slate-800 text-white border-slate-700',
    };
    const key = Object.keys(map).find((k) => p === k || p.startsWith(k));
    return map[key] || map.free;
  }
  const map = {
    free: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    trial: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    growth: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    pro: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    premium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    enterprise: 'bg-white/10 text-white border-white/20',
  };
  const key = Object.keys(map).find((k) => p === k || p.startsWith(k));
  return map[key] || map.free;
}

export function formatCellValue(value, key) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return '[Object]';
  if (key === 'createdAt' || key === 'updatedAt') {
    try { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return String(value); }
  }
  const str = String(value);
  return str.length > 48 ? `${str.slice(0, 48)}…` : str;
}

export function getColumnsForModel(modelName, data) {
  if (MODEL_DISPLAY_COLUMNS[modelName]) {
    return ['_id', ...MODEL_DISPLAY_COLUMNS[modelName]];
  }
  if (data.length === 0) return ['_id'];
  const keys = new Set();
  data.slice(0, 8).forEach((doc) => {
    Object.keys(doc).forEach((key) => {
      if (key !== '__v' && typeof doc[key] !== 'object') keys.add(key);
    });
  });
  const arr = Array.from(keys).filter((k) => k !== '_id');
  return ['_id', ...arr.slice(0, 6)];
}
