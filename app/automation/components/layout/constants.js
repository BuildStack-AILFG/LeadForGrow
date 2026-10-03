import {
  LayoutDashboard,
  Inbox,
  CheckSquare,
  Users,
  Handshake,
  UserCircle,
  Building2,
  Receipt,
  Send,
  CalendarClock,
  FileText,
  PhoneCall,
  SlidersHorizontal,
  Route,
  Workflow,
  Map,
  Bot,
  FileInput,
  BarChart3,
  Activity,
  CalendarDays,
  Brain,
  Cpu,
  Settings,
  LifeBuoy,
  LayoutGrid,
  TrendingUp,
  MessagesSquare,
  Zap,
  Telescope,
  Briefcase,
  Radar,
} from 'lucide-react';
import { resolveActiveNavId } from './navMatch.js';

export const SIDEBAR_WIDTH = {
  expanded: 260,
  collapsed: 72,
};

/*
 * Sidebar structure — owner asked (2026-10-03, with a screenshot) to go back
 * to the Quick Links + grouped-row sidebar: Overview · Sales · Communication ·
 * Automation · Insights & AI · Workspace. Kept from the redesign:
 *  - each destination is defined once (Quick Links re-uses items by id);
 *  - views of an object live inside its page (Leads/Deals List | Board), so
 *    'pipeline' / 'deal-pipeline' / 'whatsapp-templates' stay out of the nav;
 *  - item `id`s are the keys per-tenant `navAccess` locks use — never rename.
 */
export const QUICK_LINK_IDS = ['dashboard', 'leads', 'inbox'];

export const NAV_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    items: [
      { id: 'dashboard', name: 'Dashboard', href: '/automation', icon: LayoutDashboard, exact: true },
      { id: 'tasks', name: 'Tasks', href: '/automation/tasks', icon: CheckSquare, badgeKey: 'overdueTasks' },
      { id: 'leak-radar', name: 'Leak radar', href: '/automation/leak-radar', icon: Radar },
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: TrendingUp,
    items: [
      { id: 'leads', name: 'Leads', href: '/automation/leads', icon: Users, badgeKey: 'unreadLeads' },
      { id: 'deals', name: 'Deals', href: '/automation/deals', icon: Handshake },
      { id: 'contacts', name: 'Contacts', href: '/automation/contacts', icon: UserCircle },
      { id: 'companies', name: 'Companies', href: '/automation/companies', icon: Building2 },
      { id: 'bills', name: 'Bills', href: '/automation/bills', icon: Receipt },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessagesSquare,
    items: [
      { id: 'inbox', name: 'Inbox', href: '/automation/chat', icon: Inbox, badgeKey: 'unreadChats', permission: ['dashboard_access', 'reports_access'] },
      { id: 'broadcasts', name: 'Broadcasts', href: '/automation/broadcasts', icon: Send },
      { id: 'meetings', name: 'Meetings', href: '/automation/meetings', icon: CalendarClock },
      { id: 'templates', name: 'Templates', href: '/automation/templates', icon: FileText, match: ['/automation/whatsapp-templates'] },
      { id: 'call-recovery', name: 'Call recovery', href: '/automation/call-integration', icon: PhoneCall },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Zap,
    items: [
      { id: 'rules', name: 'Automations', href: '/automation/automation-rules', icon: SlidersHorizontal, badgeKey: 'activeAutomations' },
      { id: 'sequences', name: 'Sequences', href: '/automation/sequences', icon: Route },
      { id: 'whatsapp-flows', name: 'WhatsApp flows', href: '/automation/whatsapp-flows', icon: Workflow },
      { id: 'journeys', name: 'Customer journeys', href: '/automation/journeys', icon: Map },
      { id: 'chatbot', name: 'Chatbot', href: '/automation/chatbot', icon: Bot },
      { id: 'forms', name: 'Forms', href: '/automation/forms', icon: FileInput, role: 'owner' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights & AI',
    icon: Telescope,
    role: 'owner',
    items: [
      { id: 'reports', name: 'Reports', href: '/automation/reports', icon: BarChart3 },
      { id: 'automation-analytics', name: 'Automation performance', href: '/automation/automation-analytics', icon: Activity },
      { id: 'events', name: 'Activity log', href: '/automation/events', icon: CalendarDays },
      { id: 'ai-knowledge', name: 'AI knowledge', href: '/automation/ai/knowledge', icon: Brain, role: 'owner' },
      { id: 'ai-settings', name: 'AI settings', href: '/automation/settings/ai', icon: Cpu, role: 'owner' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: Briefcase,
    items: [
      {
        id: 'crm-settings',
        name: 'Settings',
        href: '/automation/settings',
        icon: Settings,
        role: 'owner',
        match: ['/automation/pipelines', '/automation/integrations', '/automation/team'],
      },
      { id: 'help-center', name: 'Help center', href: '/help', icon: LifeBuoy },
    ],
  },
];

function isAdminRole({ userRole, isOwner }) {
  const role = (userRole || 'member').toLowerCase();
  return { role, isAdmin: isOwner || role === 'owner' || role.includes('admin') || role.includes('super') };
}

/** Applies role / permission / per-tenant navAccess (denied, locked) to a flat item list. */
export function filterNavItems(items, ctx) {
  const { role, isAdmin } = isAdminRole(ctx);
  const { permissions, navAccess } = ctx;
  return items
    .filter((item) => {
      if (item.role && !isAdmin && item.role !== role) return false;
      if (item.permission && !item.permission.every((p) => permissions?.includes(p))) return false;
      if (navAccess?.[item.id]?.denied) return false;
      return true;
    })
    .map((item) => {
      const nav = navAccess?.[item.id];
      return nav?.locked ? { ...item, locked: true, requiredTier: nav.requiredTier || 'growth' } : item;
    });
}

export function filterNavGroups(groups, ctx) {
  const { role, isAdmin } = isAdminRole(ctx);
  return groups
    .filter((group) => !group.role || isAdmin || group.role === role)
    .map((group) => ({ ...group, items: filterNavItems(group.items, ctx) }))
    .filter((group) => group.items.length > 0);
}

/** Single active item id across the whole (filtered) nav. */
export function getActiveNavId(groups, pathname, searchParams) {
  return resolveActiveNavId(groups.flatMap((g) => g.items), pathname, searchParams);
}
