import {
  Building2,
  Users,
  Shield,
  ShieldCheck,
  Key,
  ScrollText,
  CreditCard,
  Palette,
  Sliders,
  GitBranch,
  Tags,
  ListTree,
  CheckSquare,
  Bell,
  Clock,
  Timer,
  UserCheck,
  Sparkles,
  Plug,
  Zap,
  LayoutGrid,
  Globe,
  BookOpen,
  Mail,
} from 'lucide-react';

export const SETTINGS_GROUPS = [
  {
    id: 'general',
    label: 'General',
    items: [
      { id: 'business-profile', label: 'Business Profile', href: '/automation/settings/general', icon: Building2, tab: 'profile' },
      { id: 'workspace', label: 'Workspace Preferences', href: '/automation/settings/general', icon: Sliders, tab: 'workspace' },
      { id: 'branding', label: 'Branding', href: '/automation/settings/general', icon: Palette, tab: 'branding' }
    ]
  },
  {
    id: 'integrations',
    label: 'Integrations',
    items: [
      { id: 'email-accounts', label: 'Email Accounts', href: '/automation/settings/email', icon: Mail },
      { id: 'integrations-hub', label: 'App Marketplace', href: '/automation/settings/integrations', icon: Plug }
    ]
  },
  {
    id: 'admin',
    label: 'Admin & Security',
    items: [
      { id: 'workspace', label: 'Workspace Settings', href: '/automation/settings/general', icon: Building2 },
      { id: 'team-permissions', label: 'Team & Permissions', href: '/automation/settings/team-permissions', icon: ShieldCheck },
      { id: 'roles', label: 'Roles (legacy)', href: '/automation/settings/team?tab=roles', icon: Shield, tab: 'roles' },
      { id: 'billing', label: 'Billing & Usage', href: '/automation/settings/billing', icon: CreditCard },
      { id: 'api-keys', label: 'API Keys', href: '/automation/settings/api-keys', icon: Key },
      { id: 'security', label: 'Security', href: '/automation/settings/security', icon: Shield },
      { id: 'audit', label: 'Audit Logs', href: '/automation/settings/team-permissions', icon: ScrollText }
    ]
  },
  {
    id: 'team',
    label: 'Team & Roles',
    items: [
      { id: 'team-management', label: 'Team Management', href: '/automation/settings/team', icon: Users }
    ]
  },
  {
    id: 'crm',
    label: 'CRM Settings',
    items: [
      { id: 'lead-stages', label: 'Lead Stages', href: '/automation/settings/crm', icon: GitBranch, tab: 'stages' },
      { id: 'lead-sources', label: 'Lead Sources', href: '/automation/settings/crm', icon: Globe, tab: 'sources' },
      { id: 'custom-fields', label: 'Custom Fields', href: '/automation/settings/crm', icon: ListTree, tab: 'fields' },
      { id: 'tags', label: 'Tags', href: '/automation/settings/crm', icon: Tags, tab: 'tags' },
      { id: 'pipelines', label: 'Pipelines', href: '/automation/settings/crm', icon: LayoutGrid, tab: 'pipelines' },
      { id: 'task-settings', label: 'Task Settings', href: '/automation/settings/crm', icon: CheckSquare, tab: 'tasks' },
      { id: 'notification-rules', label: 'Notification Rules', href: '/automation/settings/crm', icon: Bell, tab: 'notifications' }
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    items: [
      { id: 'automation-defaults', label: 'Automation Defaults', href: '/automation/settings/automation', icon: Zap, tab: 'defaults' },
      { id: 'working-hours', label: 'Working Hours', href: '/automation/settings/automation', icon: Clock, tab: 'hours' },
      { id: 'sla-rules', label: 'SLA Rules', href: '/automation/settings/automation', icon: Timer, tab: 'sla' },
      { id: 'follow-up', label: 'Follow-up Rules', href: '/automation/settings/automation', icon: UserCheck, tab: 'followup' },
      { id: 'assignment', label: 'Assignment Logic', href: '/automation/settings/automation', icon: Users, tab: 'assignment' },
      { id: 'ai-suggestions', label: 'AI Suggestions', href: '/automation/settings/automation', icon: Sparkles, tab: 'ai' },
      { id: 'ai-platform', label: 'AI Platform', href: '/automation/settings/ai', icon: Sparkles },
      { id: 'ai-knowledge', label: 'Knowledge Base', href: '/automation/ai/knowledge', icon: BookOpen },
    ]
  }
];

export const SECTION_META = {
  general: { title: 'General Settings', description: 'Business profile, workspace preferences, and branding', color: 'blue' },
  integrations: { title: 'Integrations', description: 'Connect apps and services to your workspace', color: 'cyan' },
  admin: { title: 'Admin & Security', description: 'Permissions, billing, API keys, audit logs, and security', color: 'indigo' },
  team: { title: 'Team & Roles', description: 'Manage users, roles, permissions, and departments', color: 'indigo' },
  crm: { title: 'CRM Configuration', description: 'Pipeline governance, messaging automation, and team notifications', color: 'violet' },
  automation: { title: 'Automation Settings', description: 'Working hours, SLAs, assignment logic, and defaults', color: 'amber' },
  hub: { title: 'Settings', description: 'Manage your workspace, CRM, integrations, and team' }
};

export const SECTION_COLORS = {
  blue: { icon: 'bg-teal-100 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400', bar: 'bg-teal-500', ring: 'hover:border-teal-200 dark:hover:border-teal-800', glow: 'hover:shadow-teal-100/80 dark:hover:shadow-teal-950/20' },
  violet: { icon: 'bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400', bar: 'bg-violet-500', ring: 'hover:border-violet-200 dark:hover:border-violet-800', glow: 'hover:shadow-violet-100/80 dark:hover:shadow-violet-950/20' },
  amber: { icon: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400', bar: 'bg-amber-500', ring: 'hover:border-amber-200 dark:hover:border-amber-800', glow: 'hover:shadow-amber-100/80 dark:hover:shadow-amber-950/20' },
  cyan: { icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400', bar: 'bg-cyan-500', ring: 'hover:border-cyan-200 dark:hover:border-cyan-800', glow: 'hover:shadow-cyan-100/80 dark:hover:shadow-cyan-950/20' },
  indigo: { icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400', bar: 'bg-indigo-500', ring: 'hover:border-indigo-200 dark:hover:border-indigo-800', glow: 'hover:shadow-indigo-100/80 dark:hover:shadow-indigo-950/20' }
};

export const SETTINGS_HUB_CARDS = [
  { id: 'general', href: '/automation/settings/general', icon: Building2, color: 'blue', title: 'General', description: 'Business profile, workspace preferences, and branding', count: 3 },
  { id: 'email-accounts', href: '/automation/settings/email', icon: Mail, color: 'cyan', title: 'Email Accounts', description: 'Connect your Gmail or Hostinger mailbox to send & receive from the Unified Inbox', count: 1 },
  { id: 'integrations', href: '/automation/settings/integrations', icon: Plug, color: 'cyan', title: 'Integrations', description: 'Connect WhatsApp, Meta Ads, Stripe, Zapier, and 20+ apps', count: 25 },
  { id: 'admin', href: '/automation/settings/team-permissions', icon: ShieldCheck, color: 'indigo', title: 'Team & Permissions', description: 'Enterprise access control, roles, usage limits, and audit logs', count: 7 },
  { id: 'team', href: '/automation/settings/team', icon: Users, color: 'indigo', title: 'Team Management', description: 'Invite users and manage members', count: 2 },
  { id: 'crm', href: '/automation/settings/crm', icon: GitBranch, color: 'violet', title: 'CRM Configuration', description: 'Pipeline governance, messaging templates, and automation rules', count: 5 },
  { id: 'automation', href: '/automation/settings/automation', icon: Zap, color: 'amber', title: 'Automation', description: 'Working hours, SLA rules, follow-ups, and assignment logic', count: 6 }
];

export function flattenNavItems(groups = SETTINGS_GROUPS) {
  return groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label, groupId: g.id })));
}

export function searchSettings(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return flattenNavItems().filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q)
  );
}

export function isSettingsNavActive(pathname, item) {
  const base = item.href.split('?')[0];
  if (item.id === 'team-management') return pathname === '/automation/settings/team' || pathname === '/automation/team';
  return pathname === base || pathname.startsWith(`${base}/`);
}

