'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebar } from '../../hooks/useSidebar';
import { useAccess } from '../../context/AccessContext';
import { NAV_PRIMARY, NAV_GROUPS, NAV_FOOTER, SIDEBAR_WIDTH, filterNavGroups, filterNavItems, getActiveNavId } from './constants';
import SidebarHeader from './SidebarHeader';
import SidebarItem from './SidebarItem';
import SidebarSection from './SidebarSection';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CommandPalette from './CommandPalette';
import cx, { focusRing } from '@/app/components/ui/cx';

const GROUPS_STORAGE_KEY = 'lfg.sidebar.groups';
const DEFAULT_OPEN = { sales: true, engage: true, automate: true, insights: false };

function readOpenGroups() {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    return raw ? { ...DEFAULT_OPEN, ...JSON.parse(raw) } : DEFAULT_OPEN;
  } catch {
    return DEFAULT_OPEN;
  }
}

/**
 * App sidebar — DESIGN_BRIEF §7.
 * 240px, collapsible to a 56px icon rail (choice persisted by useSidebar);
 * hovering the rail peeks the full sidebar as an overlay without reflowing
 * the page. Exactly one active item, resolved by best match (navMatch.js).
 * Groups remember their open/closed state; the group holding the active
 * page opens when you navigate to it but can still be collapsed.
 * On mobile it's an off-canvas drawer.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebar = useSidebar();
  const { access, showUpgrade } = useAccess();

  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [openGroups, setOpenGroups] = useState(DEFAULT_OPEN);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setOpenGroups(readOpenGroups());
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);

  const toggleGroup = useCallback((id) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // ⌘K / Ctrl K opens the command palette from anywhere in the app.
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
  const primary = useMemo(() => filterNavItems(NAV_PRIMARY, ctx), [ctx]);
  const groups = useMemo(() => filterNavGroups(NAV_GROUPS, ctx), [ctx]);
  const footer = useMemo(() => filterNavItems(NAV_FOOTER, ctx), [ctx]);

  const activeId = useMemo(() => getActiveNavId({ primary, groups, footer }, pathname, searchParams), [primary, groups, footer, pathname, searchParams]);
  const activeGroupId = useMemo(() => groups.find((g) => g.items.some((i) => i.id === activeId))?.id, [groups, activeId]);

  // Auto-open the group of the page you navigate to (once per navigation),
  // but don't pin it open — the user can still collapse it, as before.
  useEffect(() => {
    if (activeGroupId) setOpenGroups((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }));
  }, [activeGroupId, pathname]);

  const paletteItems = useMemo(
    () => [...primary, ...groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), ...footer],
    [primary, groups, footer]
  );

  const getBadge = useCallback((item) => (item.badgeKey ? sidebar.stats?.[item.badgeKey] || 0 : 0), [sidebar.stats]);

  const railMode = !sidebar.isMobile && sidebar.collapsed;
  const collapsed = railMode && !hoverExpanded;
  const width = sidebar.isMobile ? SIDEBAR_WIDTH.expanded : collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded;
  const shortcutLabel = isMac ? '⌘K' : 'Ctrl K';

  const itemProps = { collapsed, onNavigate: sidebar.closeMobile, onLockedClick: showUpgrade };

  return (
    <>
      {sidebar.isMobile && sidebar.mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(16,24,20,0.32)] lg:hidden" onClick={sidebar.closeMobile} aria-hidden />
      )}

      {/* Reserves the rail's width while the <aside> is fixed in rail mode, so hover-peek never reflows the page. */}
      {railMode && <div style={{ width: SIDEBAR_WIDTH.collapsed }} className="h-screen shrink-0" aria-hidden />}

      <aside
        aria-label="Main"
        onMouseEnter={() => railMode && setHoverExpanded(true)}
        onMouseLeave={() => railMode && setHoverExpanded(false)}
        style={{ width }}
        className={cx(
          'z-50 flex h-screen flex-col border-r border-line bg-sidebar font-app transition-[width,transform] duration-[var(--duration-base)] ease-standard motion-reduce:transition-none',
          sidebar.isMobile
            ? cx('fixed left-0 top-0 shadow-modal', sidebar.mobileOpen ? 'translate-x-0' : '-translate-x-full')
            : railMode
              ? cx('fixed left-0 top-0', hoverExpanded && 'shadow-modal')
              : 'sticky top-0 shrink-0'
        )}
      >
        <SidebarHeader
          collapsed={collapsed}
          isMobile={sidebar.isMobile}
          onToggle={sidebar.toggleCollapsed}
          onMobileClose={sidebar.closeMobile}
          onOpenSearch={() => setPaletteOpen(true)}
          shortcutLabel={shortcutLabel}
        />

        <nav
          className={cx(
            'flex-1 overflow-y-auto overflow-x-hidden pb-3 pt-2 [scrollbar-width:thin]',
            collapsed ? 'flex flex-col items-center gap-2 px-2' : 'px-2'
          )}
        >
          <div className={cx('flex flex-col gap-0.5', collapsed && 'items-center')}>
            {primary.map((item) => (
              <SidebarItem key={item.id} item={item} active={item.id === activeId} badgeCount={getBadge(item)} {...itemProps} />
            ))}
          </div>

          {groups.map((group) => (
            <SidebarSection
              key={group.id}
              group={group}
              activeId={activeId}
              open={!!openGroups[group.id]}
              onToggle={() => toggleGroup(group.id)}
              getBadge={getBadge}
              {...itemProps}
            />
          ))}
        </nav>

        <div className={cx('shrink-0 border-t border-line px-2 py-2', collapsed && 'flex flex-col items-center')}>
          <div className={cx('mb-1 flex flex-col gap-0.5', collapsed && 'items-center')}>
            {footer.map((item) => (
              <SidebarItem key={item.id} item={item} active={item.id === activeId} badgeCount={0} {...itemProps} />
            ))}
          </div>
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
          <Menu className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} items={paletteItems} />
    </>
  );
}
