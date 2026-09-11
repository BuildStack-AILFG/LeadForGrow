'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SidebarItem from './SidebarItem';
import { isNavItemActive } from './constants';

export default function SidebarSection({
  group,
  pathname,
  searchParams,
  collapsed,
  stats,
  onNavigate,
  onLockedClick
}) {
  // Click-only toggle — the chevron is the sole way to open or close a
  // group. No hover-to-preview: the pointer drifting over or off the
  // header/items no longer changes anything.
  const [open, setOpen] = useState(true);
  // The header's hover cue (when closed) is JS-driven, not Tailwind's
  // `hover:` variant — see SidebarItem.jsx's comment: `hover:` is gated
  // behind `@media (hover: hover)`, which is false on touchscreen
  // laptops/2-in-1s even with an active mouse, silently killing every
  // pure-CSS hover effect on that class of device.
  const [headerHovered, setHeaderHovered] = useState(false);
  const GroupIcon = group.icon;

  const getBadge = (item) => {
    if (!item.badgeKey) return 0;
    return stats[item.badgeKey] || 0;
  };

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={isNavItemActive(pathname, searchParams, item)}
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
    // The whole wrapper (header row + items) shares ONE background rect
    // with no gap between them — header has no own margin/bg, the parent
    // div carries the mint tint continuously through both when open, so
    // there's no seam of white between the header and the first item.
    <div className={open ? 'bg-[#F0F9F5] pb-1' : ''}>
      {/* Styled as a full-weight nav row — same size/padding/font as a leaf
          item (Home/Campaigns-style in Interakt), NOT a small uppercase-caps
          section label. Icon + normal-case label + trailing chevron. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
        className={`group flex w-full items-center gap-3 px-4 py-3 text-[14px] font-medium transition-colors duration-150 ${
          open
            ? 'text-[#1D4B3E]'
            : headerHovered
              ? 'bg-[#F0F9F5] text-[#1D4B3E]'
              : 'text-[#0A0B10]'
        }`}
      >
        {GroupIcon && (
          <GroupIcon className={`h-[18px] w-[18px] shrink-0 text-[#1D4B3E]`} strokeWidth={1.75} />
        )}
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#1D4B3E] transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>
      {open && (
        <div className="space-y-0.5 animate-in fade-in duration-200">
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={isNavItemActive(pathname, searchParams, item)}
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
