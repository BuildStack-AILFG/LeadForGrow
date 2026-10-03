'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useAccess } from '../../context/AccessContext';
import { NAV_GROUPS, QUICK_LINK_IDS, SIDEBAR_WIDTH, filterNavGroups, getActiveNavId } from './constants';
import SidebarHeader from './SidebarHeader';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import SidebarQuickLinks from './SidebarQuickLinks';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CommandPalette from './CommandPalette';
import cx, { focusRing } from '@/app/components/ui/cx';

const GROUPS_STORAGE_KEY = 'lfg.sidebar.openGroup';

/**
 * App sidebar — owner's reference layout (2026-10-03 screenshot):
 * header · Quick links · collapsible group rows · workspace switcher.
 * Behaviour kept from the redesign:
 *  - exactly one highlighted row (best-match resolution in navMatch.js; a
 *    page that is also a Quick link is highlighted in Quick links only);
 *  - accordion (one group open at a time), remembered across reloads; the
 *    current page's group opens on navigation and can still be closed;
 *  - 72px icon rail with hover-peek; Ctrl/⌘ K opens the page palette;
 *  - off-canvas drawer on mobile.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebar = useSidebar();
  const { access, showUpgrade } = useAccess();

  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [openGroupId, setOpenGroupId] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (saved) setOpenGroupId(saved === 'none' ? null : saved);
    } catch {}
  }, []);

  const toggleGroup = useCallback((id) => {
    setOpenGroupId((cur) => {
      const next = cur === id ? null : id;
      try {
        localStorage.setItem(GROUPS_STORAGE_KEY, next || 'none');
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ctx = useMemo(
    () => ({ userRole: sidebar.userRole, permissions: sidebar.userData.permissions, navAccess: access?.navAccess, isOwner: access?.isOwner }),
    [sidebar.userRole, sidebar.userData.permissions, access?.navAccess, access?.isOwner]
  );
  const groups = useMemo(() => filterNavGroups(NAV_GROUPS, ctx), [ctx]);
  const allItems = useMemo(() => groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), [groups]);
  const quickLinks = useMemo(() => QUICK_LINK_IDS.map((id) => allItems.find((i) => i.id === id)).filter(Boolean), [allItems]);
  const quickIds = useMemo(() => new Set(quickLinks.map((i) => i.id)), [quickLinks]);

  const activeId = useMemo(() => getActiveNavId(groups, pathname, searchParams), [groups, pathname, searchParams]);
  const activeGroupId = useMemo(() => groups.find((g) => g.items.some((i) => i.id === activeId))?.id, [groups, activeId]);

  // Open the current page's group when you navigate to it (unless it's a
  // Quick link, which is already visible). Closing it afterwards still works.
  useEffect(() => {
    if (activeGroupId && !quickIds.has(activeId)) setOpenGroupId(activeGroupId);
  }, [activeGroupId, activeId, quickIds, pathname]);

  const getBadge = useCallback((item) => (item.badgeKey ? sidebar.stats?.[item.badgeKey] || 0 : 0), [sidebar.stats]);

  const railMode = !sidebar.isMobile && sidebar.collapsed;
  const collapsed = railMode && !hoverExpanded;
  const width = sidebar.isMobile ? SIDEBAR_WIDTH.expanded : collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
  const itemProps = { onNavigate: sidebar.closeMobile, onLockedClick: showUpgrade };

  return (
    <>
      {sidebar.isMobile && sidebar.mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(16,24,20,0.32)] lg:hidden" onClick={sidebar.closeMobile} aria-hidden />
      )}

      {railMode && <div style={{ width: SIDEBAR_WIDTH.collapsed }} className="h-screen shrink-0" aria-hidden />}

      <aside
        aria-label="Main"
        onMouseEnter={() => railMode && setHoverExpanded(true)}
        onMouseLeave={() => railMode && setHoverExpanded(false)}
        style={{ width }}
        className={cx(
          'z-50 flex h-screen flex-col border-r border-line bg-canvas font-app transition-[width,transform] duration-[var(--duration-base)] ease-standard motion-reduce:transition-none',
          sidebar.isMobile
            ? cx('fixed left-0 top-0 shadow-modal', sidebar.mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : railMode
              ? cx('fixed left-0 top-0', hoverExpanded && 'shadow-modal')
              : 'sticky top-0 shrink-0'
        )}
      >
        <SidebarHeader collapsed={collapsed} isMobile={sidebar.isMobile} onToggle={sidebar.toggleCollapsed} onMobileClose={sidebar.closeMobile} />

        <nav className={cx('flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:thin]', collapsed ? 'flex flex-col items-center gap-2 px-2 py-3' : 'py-3')}>
          {collapsed ? (
            <>
              <div className="flex flex-col items-center gap-0.5">
                {quickLinks.map((item) => (
                  <SidebarItem key={`quick-${item.id}`} item={item} active={item.id === activeId} collapsed badgeCount={getBadge(item)} {...itemProps} />
                ))}
              </div>
              {groups.map((group) => (
                <SidebarSection
                  key={group.id}
                  group={{ ...group, items: group.items.filter((i) => !quickIds.has(i.id)) }}
                  activeId={activeId}
                  collapsed
                  getBadge={getBadge}
                  {...itemProps}
                />
              ))}
            </>
          ) : (
            <>
              <SidebarQuickLinks items={quickLinks} activeId={activeId} getBadge={getBadge} {...itemProps} />
              <div className="mt-2">
                {groups.map((group) => (
                  <SidebarSection
                    key={group.id}
                    group={group}
                    activeId={activeId}
                    hideActiveIds={quickIds}
                    collapsed={false}
                    open={openGroupId === group.id}
                    onToggle={() => toggleGroup(group.id)}
                    getBadge={getBadge}
                    {...itemProps}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        <div className={cx('shrink-0 border-t border-line p-3', collapsed && 'flex justify-center px-2')}>
          <WorkspaceSwitcher
            workspace={sidebar.userData.workspace}
            plan={sidebar.userData.plan}
            displayName={sidebar.displayName}
            email={sidebar.userData.email}
            role={sidebar.userRole}
            collapsed={collapsed}
            onLogout={sidebar.logout}
          />
        </div>
      </aside>

      {sidebar.isMobile && !sidebar.mobileOpen && (
        <button
          type="button"
          onClick={sidebar.toggleMobile}
          aria-label="Open navigation"
          className={cx(
            'fixed left-3 top-3 z-40 inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-canvas text-fg-secondary shadow-popover hover:text-fg lg:hidden',
            focusRing
          )}
        >
          <Menu className="h-4 w-4" strokeWidth={1.75} />
        </button>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={allItems} />
    </>
  );
}
