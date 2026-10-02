import {
  Home,
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
  Sparkles,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import { resolveActiveNavId } from './navMatch.js';

export const SIDEBAR_WIDTH = {
  expanded: 240,
  collapsed: 56,
};

/*
 * Information architecture approved by the owner on 2026-10-03
 * (DESIGN_BRIEF §7, DECISIONS.md). Rules:
 *  - every destination appears exactly once;
 *  - views of an object live inside its page (Leads/Deals have List | Board
 *    switchers), not in the nav;
 *  - item `id`s are the keys per-tenant `navAccess` locks are stored under —
 *    never rename an id. Ids removed from the nav ('pipeline',
 *    'deal-pipeline', 'whatsapp-templates', 'team', 'integrations') still
 *    have working routes, reachable from inside their parent page/Settings;
 *    `match` makes the parent item active on those routes.
 */

/** Top-level items, no section header. */
export const NAV_PRIMARY = [
  { id: 'dashboard', name: 'Home', href: '/automation', icon: Home, exact: true },
  { id: 'inbox', name: 'Inbox', href: '/automation/chat', icon: Inbox, badgeKey: 'unreadChats', permission: ['dashboard_access', 'reports_access'] },
  { id: 'tasks', name: 'Tasks', href: '/automation/tasks', icon: CheckSquare, badgeKey: 'overdueTasks' },
];

export const NAV_GROUPS = [
  {
    id: 'sales',
    label: 'Sales',
    items: [
      { id: 'leads', name: 'Leads', href: '/automation/leads', icon: Users, badgeKey: 'unreadLeads' },
      { id: 'deals', name: 'Deals', href: '/automation/deals', icon: Handshake },
      { id: 'contacts', name: 'Contacts', href: '/automation/contacts', icon: UserCircle },
      { id: 'companies', name: 'Companies', href: '/automation/companies', icon: Building2 },
      { id: 'bills', name: 'Bills', href: '/automation/bills', icon: Receipt },
    ],
  },
  {
    id: 'engage',
    label: 'Engage',
    items: [
      { id: 'broadcasts', name: 'Broadcasts', href: '/automation/broadcasts', icon: Send },
      { id: 'meetings', name: 'Meetings', href: '/automation/meetings', icon: CalendarClock },
      { id: 'templates', name: 'Templates', href: '/automation/templates', icon: FileText, match: ['/automation/whatsapp-templates'] },
      { id: 'call-recovery', name: 'Call recovery', href: '/automation/call-integration', icon: PhoneCall },
    ],
  },
  {
    id: 'automate',
    label: 'Automate',
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
    label: 'Insights',
    role: 'owner',
    items: [
      { id: 'reports', name: 'Reports', href: '/automation/reports', icon: BarChart3 },
      { id: 'automation-analytics', name: 'Automation performance', href: '/automation/automation-analytics', icon: Activity },
      { id: 'events', name: 'Activity log', href: '/automation/events', icon: CalendarDays },
      { id: 'ai-knowledge', name: 'AI knowledge', href: '/automation/ai/knowledge', icon: Brain, role: 'owner' },
      { id: 'ai-settings', name: 'AI settings', href: '/automation/settings/ai', icon: Sparkles, role: 'owner' },
    ],
  },
];

/** Pinned to the bottom of the sidebar, above the workspace switcher. */
export const NAV_FOOTER = [
  {
    id: 'crm-settings',
    name: 'Settings',
    href: '/automation/settings',
    icon: Settings,
    role: 'owner',
    match: ['/automation/pipelines', '/automation/integrations', '/automation/team'],
  },
  { id: 'help-center', name: 'Help', href: '/help', icon: LifeBuoy },
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
export function getActiveNavId({ primary, groups, footer }, pathname, searchParams) {
  return resolveActiveNavId([...primary, ...groups.flatMap((g) => g.items), ...footer], pathname, searchParams);
}
