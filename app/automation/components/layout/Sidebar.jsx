'use client';

import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useAccess } from '../../context/AccessContext';
import { NAV_GROUPS, SIDEBAR_WIDTH, filterNavGroups } from './constants';
import SidebarHeader from './SidebarHeader';
import SidebarSection from './SidebarSection';
import SidebarQuickLinks from './SidebarQuickLinks';
import WorkspaceSwitcher from './WorkspaceSwitcher';

// Shortcut items shown in the always-open "Quick Links" strip, in this
// order — pulled from whatever `groups` already resolved to post-filter, so
// a user without access to one (e.g. Inbox's permission gate) just won't
// see it here either, same as everywhere else.
const QUICK_LINK_ITEM_IDS = ['dashboard', 'leads', 'inbox'];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebar = useSidebar();
  const { access, showUpgrade } = useAccess();

  // Hover-to-preview: while the sidebar is pinned to the narrow icon rail,
  // hovering it temporarily expands to full width as a floating overlay
  // (Interakt's exact behavior) — the persisted `collapsed` preference
  // itself is untouched, this is purely a transient visual state.
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const groups = useMemo(
    () =>
      filterNavGroups(NAV_GROUPS, {
        userRole: sidebar.userRole,
        permissions: sidebar.userData.permissions,
        navAccess: access?.navAccess,
        isOwner: access?.isOwner,
      }),
    [sidebar.userRole, sidebar.userData.permissions, access?.navAccess, access?.isOwner]
  );

  const quickLinkItems = useMemo(() => {
    const allItems = groups.flatMap((g) => g.items);
    return QUICK_LINK_ITEM_IDS.map((id) => allItems.find((i) => i.id === id)).filter(Boolean);
  }, [groups]);

  const railMode = !sidebar.isMobile && sidebar.collapsed;
  const effectiveCollapsed = railMode && !hoverExpanded;
  const width = sidebar.isMobile
    ? SIDEBAR_WIDTH.expanded
    : effectiveCollapsed
      ? SIDEBAR_WIDTH.collapsed
      : SIDEBAR_WIDTH.expanded;

  return (
    <>
      {sidebar.isMobile && sidebar.mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 lg:hidden" onClick={sidebar.closeMobile} />
      )}

      {/* Layout spacer — reserves the rail's width in the flex row while the
          real <aside> below is `fixed` (and therefore out of flow) in rail
          mode, so hovering it into a wider overlay never reflows the page. */}
      {railMode && <div style={{ width: SIDEBAR_WIDTH.collapsed }} className="h-screen flex-shrink-0" aria-hidden />}

      <aside
        onMouseEnter={() => { if (railMode) setHoverExpanded(true); }}
        onMouseLeave={() => { if (railMode) setHoverExpanded(false); }}
        style={{ width: sidebar.isMobile ? SIDEBAR_WIDTH.expanded : width }}
        className={`flex flex-col h-screen z-50 bg-white border-r border-[#E8EAED] transition-[width,transform] duration-200 ease-out ${
          sidebar.isMobile
            ? `fixed top-0 left-0 flex-shrink-0 shadow-2xl ${sidebar.mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : railMode
              ? `fixed top-0 left-0 ${hoverExpanded ? 'shadow-2xl' : ''}`
              : 'sticky top-0 flex-shrink-0'
        }`}
      >
        <SidebarHeader
          collapsed={effectiveCollapsed}
          isMobile={sidebar.isMobile}
          onToggle={sidebar.toggleCollapsed}
          onMobileClose={sidebar.closeMobile}
        />

        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 scrollbar-thin ${
            effectiveCollapsed ? 'px-2' : 'px-0'
          } [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#E8EAED] [&::-webkit-scrollbar-thumb]:rounded-full`}
        >
          {!effectiveCollapsed && (
            <SidebarQuickLinks
              items={quickLinkItems}
              pathname={pathname}
              searchParams={searchParams}
              stats={sidebar.stats}
              onNavigate={sidebar.closeMobile}
              onLockedClick={showUpgrade}
            />
          )}
          {groups.map((group) => (
            <SidebarSection
              key={group.id}
              group={group}
              pathname={pathname}
              searchParams={searchParams}
              collapsed={effectiveCollapsed}
              stats={sidebar.stats}
              onNavigate={sidebar.closeMobile}
              onLockedClick={showUpgrade}
            />
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-[#E8EAED] bg-white">
          <WorkspaceSwitcher
            workspace={sidebar.userData.workspace}
            plan={sidebar.userData.plan}
            displayName={sidebar.displayName}
            email={sidebar.userData.email}
            role={sidebar.userRole}
            collapsed={effectiveCollapsed}
            onLogout={sidebar.logout}
          />
        </div>
      </aside>

      {sidebar.isMobile && !sidebar.mobileOpen && (
        <button
          type="button"
          onClick={sidebar.toggleMobile}
          className="fixed top-3.5 left-3.5 z-40 w-9 h-9 bg-white border border-[#E8EAED] rounded-lg flex items-center justify-center text-[#1A1D1F] shadow-md hover:bg-[#F8F9FA] transition-colors lg:hidden"
          title="Open navigation"
        >
          <Menu className="w-4 h-4" />
        </button>
      )}
    </>
  );
}
