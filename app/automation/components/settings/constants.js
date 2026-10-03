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
  Bot as Sparkles,
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
      { id: 'business-profile', label: 'Business profile', href: '/automation/settings/general', icon: Building2, tab: 'profile' },
      { id: 'workspace', label: 'Workspace preferences', href: '/automation/settings/general', icon: Sliders, tab: 'workspace' },
      { id: 'branding', label: 'Branding', href: '/automation/settings/general', icon: Palette, tab: 'branding' }
    ]
  },
  {
    id: 'integrations',
    label: 'Integrations',
    items: [
      { id: 'email-accounts', label: 'Email accounts', href: '/automation/settings/email', icon: Mail },
      { id: 'integrations-hub', label: 'App marketplace', href: '/automation/settings/integrations', icon: Plug }
    ]
  },
  {
    id: 'admin',
    label: 'Admin & security',
    items: [
      { id: 'workspace', label: 'Workspace settings', href: '/automation/settings/general', icon: Building2 },
      { id: 'team-permissions', label: 'Team & permissions', href: '/automation/settings/team-permissions', icon: ShieldCheck },
      { id: 'roles', label: 'Roles (legacy)', href: '/automation/settings/team?tab=roles', icon: Shield, tab: 'roles' },
      { id: 'billing', label: 'Billing & usage', href: '/automation/settings/billing', icon: CreditCard },
      { id: 'api-keys', label: 'API keys', href: '/automation/settings/api-keys', icon: Key },
      { id: 'security', label: 'Security', href: '/automation/settings/security', icon: Shield },
      { id: 'audit', label: 'Audit logs', href: '/automation/settings/team-permissions', icon: ScrollText }
    ]
  },
  {
    id: 'team',
    label: 'Team & roles',
    items: [
      { id: 'team-management', label: 'Team management', href: '/automation/settings/team', icon: Users }
    ]
  },
  {
    id: 'crm',
    label: 'CRM settings',
    items: [
      { id: 'lead-stages', label: 'Lead stages', href: '/automation/settings/crm', icon: GitBranch, tab: 'stages' },
      { id: 'lead-sources', label: 'Lead sources', href: '/automation/settings/crm', icon: Globe, tab: 'sources' },
      { id: 'custom-fields', label: 'Custom fields', href: '/automation/settings/crm', icon: ListTree, tab: 'fields' },
      { id: 'tags', label: 'Tags', href: '/automation/settings/crm', icon: Tags, tab: 'tags' },
      { id: 'pipelines', label: 'Pipelines', href: '/automation/settings/crm', icon: LayoutGrid, tab: 'pipelines' },
      { id: 'task-settings', label: 'Task settings', href: '/automation/settings/crm', icon: CheckSquare, tab: 'tasks' },
      { id: 'notification-rules', label: 'Notification rules', href: '/automation/settings/crm', icon: Bell, tab: 'notifications' }
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    items: [
      { id: 'automation-defaults', label: 'Automation defaults', href: '/automation/settings/automation', icon: Zap, tab: 'defaults' },
      { id: 'working-hours', label: 'Working hours', href: '/automation/settings/automation', icon: Clock, tab: 'hours' },
      { id: 'sla-rules', label: 'SLA rules', href: '/automation/settings/automation', icon: Timer, tab: 'sla' },
      { id: 'follow-up', label: 'Follow-up rules', href: '/automation/settings/automation', icon: UserCheck, tab: 'followup' },
      { id: 'assignment', label: 'Assignment logic', href: '/automation/settings/automation', icon: Users, tab: 'assignment' },
      { id: 'ai-suggestions', label: 'AI suggestions', href: '/automation/settings/automation', icon: Sparkles, tab: 'ai' },
      { id: 'ai-platform', label: 'AI platform', href: '/automation/settings/ai', icon: Sparkles },
      { id: 'ai-knowledge', label: 'Knowledge base', href: '/automation/ai/knowledge', icon: BookOpen },
    ]
  }
];

export const SECTION_META = {
  general: { title: 'General settings', description: 'Business profile, workspace preferences, and branding', color: 'blue' },
  integrations: { title: 'Integrations', description: 'Connect apps and services to your workspace', color: 'cyan' },
  admin: { title: 'Admin & security', description: 'Permissions, billing, API keys, audit logs, and security', color: 'indigo' },
  team: { title: 'Team & roles', description: 'Manage users, roles, permissions, and departments', color: 'indigo' },
  crm: { title: 'CRM configuration', description: 'Pipeline governance, messaging automation, and team notifications', color: 'violet' },
  automation: { title: 'Automation settings', description: 'Working hours, SLAs, assignment logic, and defaults', color: 'amber' },
  hub: { title: 'Settings', description: 'Manage your workspace, CRM, integrations, and team' }
};

export const SECTION_COLORS = {
  blue: { icon: 'bg-accent-subtle text-accent-fg dark:bg-teal-950/50 dark:text-accent-fg', bar: 'bg-accent', ring: 'hover:border-line dark:hover:border-teal-800', glow: ' ' },
  violet: { icon: 'bg-accent-subtle text-accent-fg dark:bg-violet-950/50 dark:text-accent-fg', bar: 'bg-accent', ring: 'hover:border-line dark:hover:border-violet-800', glow: ' ' },
  amber: { icon: 'bg-warning-subtle text-warning dark:bg-amber-950/50 dark:text-amber-400', bar: 'bg-warning', ring: 'hover:border-warning/30 dark:hover:border-amber-800', glow: ' ' },
  cyan: { icon: 'bg-accent-subtle text-accent-fg dark:bg-cyan-950/50 dark:text-accent-fg', bar: 'bg-accent', ring: 'hover:border-line dark:hover:border-cyan-800', glow: ' ' },
  indigo: { icon: 'bg-accent-subtle text-accent-fg dark:bg-indigo-950/50 dark:text-accent-fg', bar: 'bg-accent', ring: 'hover:border-line dark:hover:border-indigo-800', glow: ' ' }
};

export const SETTINGS_HUB_CARDS = [
  { id: 'general', href: '/automation/settings/general', icon: Building2, color: 'blue', title: 'General', description: 'Business profile, workspace preferences, and branding', count: 3 },
  { id: 'email-accounts', href: '/automation/settings/email', icon: Mail, color: 'cyan', title: 'Email accounts', description: 'Connect your Gmail or Hostinger mailbox to send & receive from the Unified Inbox', count: 1 },
  { id: 'integrations', href: '/automation/settings/integrations', icon: Plug, color: 'cyan', title: 'Integrations', description: 'Connect WhatsApp, Meta Ads, Stripe, Zapier, and 20+ apps', count: 25 },
  { id: 'admin', href: '/automation/settings/team-permissions', icon: ShieldCheck, color: 'indigo', title: 'Team & permissions', description: 'Enterprise access control, roles, usage limits, and audit logs', count: 7 },
  { id: 'team', href: '/automation/settings/team', icon: Users, color: 'indigo', title: 'Team management', description: 'Invite users and manage members', count: 2 },
  { id: 'crm', href: '/automation/settings/crm', icon: GitBranch, color: 'violet', title: 'CRM configuration', description: 'Pipeline governance, messaging templates, and automation rules', count: 5 },
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

