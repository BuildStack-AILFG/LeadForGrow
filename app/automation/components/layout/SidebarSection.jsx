'use client';

import { ChevronDown } from 'lucide-react';
import SidebarItem from './SidebarItem';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Nav group — owner's reference style: the header is a full-size row (green
 * icon + black label + chevron). An open group sits on a light mint panel.
 * Click the chevron row to open/close — including the group of the current
 * page. In the collapsed rail, groups become icon stacks with a divider.
 */
export default function SidebarSection({ group, activeId, hideActiveIds, collapsed, open, onToggle, getBadge, onNavigate, onLockedClick }) {
  const GroupIcon = group.icon;
  const panelId = `nav-group-${group.id}`;
  const isActive = (item) => item.id === activeId && !hideActiveIds?.has(item.id);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-0.5 border-t border-line pt-2">
        {group.items.map((item) => (
          <SidebarItem key={item.id} item={item} active={isActive(item)} collapsed badgeCount={getBadge(item)} onNavigate={onNavigate} onLockedClick={onLockedClick} />
        ))}
      </div>
    );
  }

  return (
    <div className={open ? 'bg-accent-subtle/60 pb-1' : undefined}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(
          'flex h-11 w-full items-center gap-3 px-4 text-body font-medium text-fg transition-colors duration-[var(--duration-fast)]',
          !open && 'hover:bg-accent-subtle',
          focusRing
        )}
      >
        {GroupIcon && <GroupIcon className="h-[18px] w-[18px] shrink-0 text-accent" strokeWidth={1.75} aria-hidden />}
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className={cx('h-4 w-4 shrink-0 text-accent transition-transform duration-[var(--duration-base)] ease-standard', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div id={panelId}>
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={isActive(item)}
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
