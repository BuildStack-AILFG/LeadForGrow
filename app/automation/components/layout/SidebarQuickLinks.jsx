'use client';

import SidebarItem from './SidebarItem';
import { isNavItemActive } from './constants';

/**
 * "Quick Links" — Interakt's pattern: a tiny uppercase-caps label (no icon,
 * no chevron, not clickable) followed by a couple of always-visible
 * shortcuts, sitting above the real collapsible nav groups. Unlike those
 * groups it never collapses — no state, no toggle, just permanently shown.
 * Sits on the same faint mint tint Interakt uses to set it apart from the
 * plain-white area around it.
 */
export default function SidebarQuickLinks({ items, pathname, searchParams, stats, onNavigate, onLockedClick }) {
  if (!items.length) return null;

  const getBadge = (item) => {
    if (!item.badgeKey) return 0;
    return stats[item.badgeKey] || 0;
  };

  return (
    <div className="bg-[#F7FCFA] pb-1">
      <div className="px-4 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#737DA5]">Quick Links</span>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarItem
            key={`quick-${item.id}`}
            item={item}
            active={isNavItemActive(pathname, searchParams, item)}
            collapsed={false}
            badgeCount={getBadge(item)}
            onNavigate={onNavigate}
            onLockedClick={onLockedClick}
          />
        ))}
      </div>
    </div>
  );
}
