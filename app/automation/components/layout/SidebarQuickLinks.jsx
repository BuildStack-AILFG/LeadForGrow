'use client';

import SidebarItem from './SidebarItem';

/**
 * "Quick links" strip (owner's reference): small caps label + always-visible
 * shortcuts on a faint mint band, above the collapsible groups. When the
 * current page is one of these, it is highlighted HERE only — never twice.
 */
export default function SidebarQuickLinks({ items, activeId, getBadge, onNavigate, onLockedClick }) {
  if (!items.length) return null;
  return (
    <div className="bg-accent-subtle/50 pb-1">
      <p className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-tertiary">Quick links</p>
      {items.map((item) => (
        <SidebarItem
          key={`quick-${item.id}`}
          item={item}
          active={item.id === activeId}
          collapsed={false}
          badgeCount={getBadge(item)}
          onNavigate={onNavigate}
          onLockedClick={onLockedClick}
        />
      ))}
    </div>
  );
}
