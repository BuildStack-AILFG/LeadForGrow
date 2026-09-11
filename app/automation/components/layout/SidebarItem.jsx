'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import NotificationBadge from './NotificationBadge';

/**
 * Nav item — styled to match Interakt's sidebar kit exactly (colors/spacing
 * scraped live from app.interakt.ai's own computed CSS):
 *
 * REST: icon is ALWAYS brand teal (#1D4B3E), text is near-black (#0A0B10).
 *   Icons are never gray/slate at rest — that's the key Interakt trait.
 * HOVER: a "little dark[er]" medium-mint fill (#BAE0CF — matches Interakt's
 *   own live computed hover style exactly), text + icon turn brand teal.
 *   Deliberately NOT the same as ACTIVE — active is a much darker solid
 *   fill with near-white text, hover is a lighter preview a shade darker
 *   than an open group's own #F0F9F5 panel tint.
 * ACTIVE: solid brand-teal fill edge-to-edge (no rounding, no side inset,
 *   no accent stripe — Interakt highlights the whole row, not a pill).
 *   Text + icon both go near-white (#F0F9F5).
 *
 * One monochrome teal for every section — Interakt doesn't rainbow-code
 * nav categories by group, so there's no per-category tone here anymore.
 *
 * Hover is driven by onMouseEnter/onMouseLeave state, NOT Tailwind's
 * `hover:` variant. Tailwind wraps `hover:` in `@media (hover: hover)`,
 * which evaluates false on touchscreen laptops/2-in-1s even with a mouse
 * plugged in and actively driving the pointer — on that class of device
 * every `hover:` utility in the app is silently inert. A real mouseenter
 * event doesn't care what the media feature says, so it's the only
 * reliable way to drive hover-only styling here.
 */

export default function SidebarItem({
  item,
  active,
  collapsed,
  badgeCount,
  onNavigate,
  onLockedClick,
}) {
  const Icon = item.icon;
  const locked = item.locked;
  const [hovered, setHovered] = useState(false);

  if (locked) {
    return (
      <button
        type="button"
        onClick={() => onLockedClick?.(item.name, item.requiredTier || 'growth')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={collapsed ? `${item.name} (Upgrade)` : undefined}
        className={`group relative flex w-full items-center gap-3 text-[14px] font-medium transition-colors duration-150 ${
          collapsed ? 'justify-center px-2 py-3 rounded-lg' : 'px-4 py-3'
        } cursor-pointer text-black/40 ${hovered ? 'bg-[#F0F9F5]' : ''}`}
      >
        <Icon className="h-[18px] w-[18px] text-black/40" strokeWidth={1.75} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.name}</span>
            <Lock className="h-3.5 w-3.5 shrink-0 text-black/30" />
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? item.name : undefined}
      className={`group relative flex items-center gap-3 text-[14px] font-medium transition-colors duration-150 ${
        collapsed ? 'justify-center px-2 py-3 rounded-lg' : 'px-4 py-3'
      } ${
        active
          ? 'bg-[#1D4B3E] text-[#F0F9F5]'
          : hovered
            ? 'bg-[#BAE0CF] text-[#1D4B3E]'
            : 'text-[#0A0B10]'
      }`}
    >
      <span className="relative shrink-0">
        <Icon
          className={`h-[18px] w-[18px] ${active ? 'text-[#F0F9F5]' : 'text-[#1D4B3E]'}`}
          strokeWidth={1.75}
        />
        {collapsed && (
          <NotificationBadge count={badgeCount} urgent={item.urgent} dot={item.dot} collapsed />
        )}
      </span>

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.name}</span>
          <NotificationBadge count={badgeCount} urgent={item.urgent} dot={item.dot && !badgeCount} />
        </>
      )}
    </Link>
  );
}
