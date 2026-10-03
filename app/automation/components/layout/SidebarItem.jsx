'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import NotificationBadge from './NotificationBadge';
import Tooltip from '@/app/components/ui/Tooltip';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Nav item — owner's reference style (2026-10-03 screenshot):
 *   rest:   black text, green icon, full-width row
 *   hover:  mint row
 *   active: solid brand green row edge-to-edge, white text + icon
 * Exactly one row is active at a time (resolved centrally, passed as `active`).
 */
export default function SidebarItem({ item, active, collapsed, badgeCount, onNavigate, onLockedClick }) {
  const Icon = item.icon;
  const row = cx(
    'relative flex items-center text-body font-medium transition-colors duration-[var(--duration-fast)]',
    collapsed ? 'mx-auto h-10 w-10 justify-center rounded-md' : 'h-11 w-full gap-3 px-4',
    focusRing
  );

  if (item.locked) {
    return (
      <Tooltip label={`${item.name} — upgrade to unlock`} side="right" disabled={!collapsed}>
        <button
          type="button"
          onClick={() => onLockedClick?.(item.name, item.requiredTier || 'growth')}
          aria-label={collapsed ? `${item.name} (upgrade to unlock)` : undefined}
          className={cx(row, 'text-fg-disabled hover:bg-accent-subtle')}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.name}</span>
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-label="Locked" />
            </>
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={item.name} side="right" disabled={!collapsed}>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        aria-label={collapsed ? item.name : undefined}
        className={cx(row, active ? 'bg-accent text-white' : 'text-fg hover:bg-accent-subtle')}
      >
        <span className="relative inline-flex shrink-0">
          <Icon className={cx('h-[18px] w-[18px]', active ? 'text-white' : 'text-accent')} strokeWidth={1.75} aria-hidden />
          {collapsed && <NotificationBadge count={badgeCount} collapsed />}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            <NotificationBadge count={badgeCount} inverse={active} />
          </>
        )}
      </Link>
    </Tooltip>
  );
}
