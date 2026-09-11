import {
  LayoutDashboard,
  Users,
  UserCircle,
  Building2,
  Handshake,
  MessagesSquare,
  Kanban,
  CheckSquare,
  SlidersHorizontal,
  GitBranch,
  Mail,
  Bot,
  FileText,
  FileInput,
  PhoneCall,
  CalendarClock,
  BarChart3,
  CalendarDays,
  UserCog,
  Plug,
  Settings,
  Sparkles,
  BookOpen,
  Send,
  Map,
  Activity,
  Workflow,
  Receipt,
  Columns3,   // Deal Pipeline — visually different from Sequences' branch icon
  Route,      // Sequences — journey/path implies multi-step drip
  Brain,      // AI Knowledge — knowledge base ≠ Help Center's guidance
  Compass,    // Guide — navigation/find-your-way, replaces old BookOpen dup
  Inbox,      // Inbox — literal tray shape, cleaner than a cramped brand cluster
  LayoutGrid, // Overview group header icon
  TrendingUp, // Sales group header icon
  Zap,        // Automation group header icon
  Telescope,  // Insights & AI group header icon
  Briefcase,  // Workspace group header icon
} from 'lucide-react';
// Real brand mark — WhatsApp Templates uses the actual WhatsApp mark in
// monochrome (via currentColor) so users recognise the shape without the
// green fighting the rest of the nav.
import { WhatsAppIcon } from '../chat/BrandIcons';

export const SIDEBAR_WIDTH = {
  expanded: 260,
  collapsed: 72
};

// Regrouped per the "Overview -> Sell -> Communicate -> Automate -> Analyze
// -> Manage Workspace" mental model — item `id`s are UNCHANGED from the old
// grouping (only `name`/group membership/order moved) since `id` is the key
// per-tenant `navAccess` overrides (locked/tier restrictions) are stored
// under; renaming an id would silently break any business's existing
// locked-nav config.
export const NAV_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    items: [
      { id: 'dashboard', name: 'Dashboard', href: '/automation', icon: LayoutDashboard, exact: true },
      { id: 'tasks', name: 'Tasks', href: '/automation/tasks', icon: CheckSquare, badgeKey: 'overdueTasks', urgent: true },
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: TrendingUp,
    items: [
      { id: 'leads', name: 'Leads', href: '/automation/leads', icon: Users, badgeKey: 'unreadLeads', urgent: true },
      { id: 'pipeline', name: 'Lead Pipeline', href: '/automation/leads?view=kanban', icon: Kanban, matchPrefix: '/automation/leads' },
      { id: 'deals', name: 'Deals', href: '/automation/deals', icon: Handshake, matchPrefix: '/automation/deals' },
      { id: 'deal-pipeline', name: 'Sales Pipeline', href: '/automation/pipelines', icon: Columns3, matchPrefix: '/automation/pipelines' },
      { id: 'companies', name: 'Companies', href: '/automation/companies', icon: Building2, matchPrefix: '/automation/companies' },
      { id: 'contacts', name: 'Contacts', href: '/automation/contacts', icon: UserCircle, matchPrefix: '/automation/contacts' },
      { id: 'bills', name: 'Bills', href: '/automation/bills', icon: Receipt, matchPrefix: '/automation/bills' },
    ]
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessagesSquare,
    items: [
      {
        id: 'inbox',
        name: 'Inbox',
        href: '/automation/chat',
        icon: Inbox,
        badgeKey: 'unreadChats',
        permission: ['dashboard_access', 'reports_access']
      },
      { id: 'broadcasts', name: 'Broadcasts', href: '/automation/broadcasts', icon: Send },
      {
        id: 'meetings',
        name: 'Meetings',
        href: '/automation/meetings',
        icon: CalendarClock,
        matchPrefix: '/automation/meetings'
      },
      { id: 'templates', name: 'Templates', href: '/automation/templates', icon: FileText },
      { id: 'whatsapp-templates', name: 'WhatsApp Templates', href: '/automation/whatsapp-templates', icon: WhatsAppIcon, matchPrefix: '/automation/whatsapp-templates' },
      { id: 'call-recovery', name: 'Call Recovery', href: '/automation/call-integration', icon: PhoneCall }
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Zap,
    items: [
      { id: 'rules', name: 'Automations', href: '/automation/automation-rules', icon: SlidersHorizontal, badgeKey: 'activeAutomations', dot: 'live' },
      { id: 'sequences', name: 'Sequences', href: '/automation/sequences', icon: Route },
      { id: 'whatsapp-flows', name: 'WhatsApp Flows', href: '/automation/whatsapp-flows', icon: Workflow, matchPrefix: '/automation/whatsapp-flows' },
      { id: 'journeys', name: 'Customer Journeys', href: '/automation/journeys', icon: Map },
      { id: 'chatbot', name: 'Chatbot', href: '/automation/chatbot', icon: Bot },
      { id: 'forms', name: 'Forms', href: '/automation/forms', icon: FileInput, role: 'owner' },
    ]
  },
  {
    id: 'insights',
    label: 'Insights & AI',
    icon: Telescope,
    role: 'owner',
    items: [
      { id: 'reports', name: 'Reports', href: '/automation/reports', icon: BarChart3 },
      { id: 'automation-analytics', name: 'Automation Performance', href: '/automation/automation-analytics', icon: Activity },
      { id: 'events', name: 'Activity & Events', href: '/automation/events', icon: CalendarDays, badgeKey: 'activeEvents', dot: 'live' },
      { id: 'ai-knowledge', name: 'AI Knowledge', href: '/automation/ai/knowledge', icon: Brain, role: 'owner' },
      { id: 'ai-settings', name: 'AI Settings', href: '/automation/settings/ai', icon: Sparkles, role: 'owner' },
    ]
  },
  {
    id: 'workspace',
    label: 'Workspace',
    icon: Briefcase,
    items: [
      { id: 'team', name: 'Team & Access', href: '/automation/settings/team-permissions', icon: UserCog, role: 'owner' },
      { id: 'integrations', name: 'Integrations', href: '/automation/settings/integrations', icon: Plug, role: 'owner' },
      { id: 'crm-settings', name: 'Settings', href: '/automation/settings', icon: Settings, role: 'owner', exact: true },
      { id: 'help-center', name: 'Help Center', href: '/help', icon: Compass, matchPrefix: '/help' },
    ]
  }
];

export function filterNavGroups(groups, { userRole, permissions, navAccess, isOwner }) {
  const role = (userRole || 'member').toLowerCase();
  const isAdmin = isOwner || role === 'owner' || role.includes('admin') || role.includes('super');

  return groups
    .filter((group) => {
      if (!group.role) return true;
      return isAdmin || group.role === role;
    })
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => {
          if (item.role && !isAdmin && item.role !== role) return false;
          if (item.permission && !item.permission.every((p) => permissions?.includes(p))) return false;
          if (navAccess && item.id) {
            const nav = navAccess[item.id];
            if (nav?.denied) return false;
          }
          return true;
        })
        .map((item) => {
          if (!navAccess || !item.id) return item;
          const nav = navAccess[item.id];
          if (nav?.locked) {
            return {
              ...item,
              locked: true,
              requiredTier: nav.requiredTier || 'growth',
              href: item.href,
            };
          }
          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);
}

export function isNavItemActive(pathname, searchParams, item) {
  const href = item.href.split('?')[0];
  const query = item.href.includes('?') ? item.href.split('?')[1] : '';

  if (item.exact) return pathname === href;
  if (query && searchParams) {
    const params = new URLSearchParams(query);
    const view = params.get('view');
    if (view && searchParams.get('view') === view && pathname === href) return true;
    if (item.id === 'pipeline' && pathname === href && searchParams.get('view') === 'kanban') return true;
  }
  if (item.id === 'leads' && pathname === href && searchParams?.get('view') !== 'kanban') return true;
  if (item.id === 'pipeline') return pathname === href && searchParams?.get('view') === 'kanban';
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}
