'use client';

import { ChevronRight } from 'lucide-react';
import SidebarItem from './SidebarItem';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Nav group — DESIGN_BRIEF §7 group headers: 12px/500 tertiary, 28px tall,
 * sentence case, chevron on the right, 16px top spacing, and NO background
 * tint when expanded. A group containing the active item is forced open by
 * the parent. In the collapsed rail, headers become a thin divider.
 */
export default function SidebarSection({ group, activeId, collapsed, open, onToggle, getBadge, onNavigate, onLockedClick }) {
  const panelId = `nav-group-${group.id}`;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-0.5 border-t border-line pt-2">
        {group.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={item.id === activeId}
            collapsed
            badgeCount={getBadge(item)}
            onNavigate={onNavigate}
            onLockedClick={onLockedClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pt-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(
          'group/header flex h-7 w-full items-center gap-1 rounded-md px-2 text-meta font-medium text-fg-tertiary hover:text-fg-secondary',
          focusRing
        )}
      >
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronRight
          aria-hidden
          strokeWidth={1.5}
          className={cx(
            'h-3.5 w-3.5 transition-transform duration-[var(--duration-fast)] ease-standard',
            open ? 'rotate-90' : 'rotate-0',
            open && '[@media(hover:hover)]:opacity-0 group-hover/header:opacity-100 group-focus-visible/header:opacity-100'
          )}
        />
      </button>
      {open && (
        <div id={panelId} className="mt-0.5 flex flex-col gap-0.5">
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={item.id === activeId}
              collapsed={false}
              badgeCount={getBadge(item)}
              onNavigate={onNavigate}
              onLockedClick={onLockedClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
