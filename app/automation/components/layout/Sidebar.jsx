'use client';

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useAccess } from '../../context/AccessContext';
import { NAV_GROUPS, SIDEBAR_WIDTH, filterNavGroups } from './constants';
import SidebarHeader from './SidebarHeader';
import SidebarSection from './SidebarSection';
import WorkspaceSwitcher from './WorkspaceSwitcher';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebar = useSidebar();
  const { access, showUpgrade } = useAccess();

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

  const width = sidebar.collapsed && !sidebar.isMobile ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
  const showRail = !sidebar.isMobile && sidebar.collapsed;

  return (
    <>
      {sidebar.isMobile && sidebar.mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 lg:hidden" onClick={sidebar.closeMobile} />
      )}

      <aside
        style={{ width: sidebar.isMobile ? SIDEBAR_WIDTH.expanded : width }}
        className={`flex flex-col h-screen flex-shrink-0 z-50 bg-[#F4F5F7] border-r border-[#E8EAED] transition-[width,transform] duration-300 ease-out ${
          sidebar.isMobile
            ? `fixed top-0 left-0 shadow-2xl ${sidebar.mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'sticky top-0'
        }`}
      >
        <SidebarHeader
          collapsed={showRail}
          isMobile={sidebar.isMobile}
          onToggle={sidebar.toggleCollapsed}
          onMobileClose={sidebar.closeMobile}
        />

        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 scrollbar-thin ${
            showRail ? 'px-2' : 'px-2'
          } [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#E8EAED] [&::-webkit-scrollbar-thumb]:rounded-full`}
        >
          {groups.map((group) => (
            <SidebarSection
              key={group.id}
              group={group}
              pathname={pathname}
              searchParams={searchParams}
              collapsed={showRail}
              stats={sidebar.stats}
              onNavigate={sidebar.closeMobile}
              onLockedClick={showUpgrade}
            />
          ))}
        </nav>

        <div className="flex-shrink-0 border-t border-[#E8EAED] bg-[#EEF0F2]">
          <WorkspaceSwitcher
            workspace={sidebar.userData.workspace}
            plan={sidebar.userData.plan}
            displayName={sidebar.displayName}
            email={sidebar.userData.email}
            role={sidebar.userRole}
            collapsed={showRail}
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
