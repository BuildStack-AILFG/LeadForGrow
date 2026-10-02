'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import NotificationBadge from './NotificationBadge';
import Tooltip from '@/app/components/ui/Tooltip';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Nav item — DESIGN_BRIEF §7.
 *   32px tall · 8px padding · 16px icon · 13px/500 text · radius 6
 *   rest:   text-secondary, icon tertiary
 *   hover:  bg-muted, text-primary (no colour change to green)
 *   active: bg-accent-subtle, accent text + icon. Exactly one per page
 *           (resolved centrally in navMatch.js, passed in as `active`).
 * Hover uses plain `hover:` — globals.css redefines the variant to bare
 * :hover so it also works on touchscreen laptops (see CLAUDE.md 2026-09-11).
 */
export default function SidebarItem({ item, active, collapsed, badgeCount, onNavigate, onLockedClick }) {
  const Icon = item.icon;

  const base = cx(
    'relative flex h-8 items-center rounded-md text-dense font-medium transition-colors duration-[var(--duration-fast)]',
    collapsed ? 'w-10 justify-center' : 'w-full gap-2 px-2',
    focusRing
  );

  if (item.locked) {
    return (
      <Tooltip label={`${item.name} — upgrade to unlock`} side="right" disabled={!collapsed}>
        <button
          type="button"
          onClick={() => onLockedClick?.(item.name, item.requiredTier || 'growth')}
          className={cx(base, 'text-fg-disabled hover:bg-muted')}
          aria-label={collapsed ? `${item.name} (upgrade to unlock)` : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-left">{item.name}</span>
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-label="Locked" />
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
        className={cx(
          base,
          active ? 'bg-accent-subtle text-accent-fg' : 'text-fg-secondary hover:bg-muted hover:text-fg'
        )}
      >
        <span className="relative inline-flex shrink-0">
          <Icon className={cx('h-4 w-4', active ? 'text-accent-fg' : 'text-fg-tertiary')} strokeWidth={1.5} aria-hidden />
          {collapsed && <NotificationBadge count={badgeCount} collapsed />}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            <NotificationBadge count={badgeCount} />
          </>
        )}
      </Link>
    </Tooltip>
  );
}
