'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeft, Search, X } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import Tooltip from '@/app/components/ui/Tooltip';
import cx, { focusRing } from '@/app/components/ui/cx';
import LogoMark from './LogoMark';

const iconBtn = cx('inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-tertiary hover:bg-muted hover:text-fg', focusRing);

export default function SidebarHeader({ collapsed, isMobile, onToggle, onMobileClose, onOpenSearch, shortcutLabel }) {
  if (collapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1 px-2 pb-2 pt-3">
        <Link href="/automation" aria-label="LeadForGrow home" className={cx('inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted', focusRing)}>
          <LogoMark />
        </Link>
        <Tooltip label={`Search ${shortcutLabel}`} side="right">
          <button type="button" onClick={onOpenSearch} aria-label="Search" className={iconBtn}>
            <Search className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </Tooltip>
        <NotificationCenter />
        <Tooltip label="Expand sidebar" side="right">
          <button type="button" onClick={onToggle} aria-label="Expand sidebar" className={iconBtn}>
            <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="shrink-0 px-2 pb-1 pt-3">
      <div className="flex h-8 items-center gap-1">
        <Link href="/automation" className={cx('flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1 hover:bg-muted', focusRing)}>
          <LogoMark />
          <span className="truncate text-body font-semibold text-fg">LeadForGrow</span>
        </Link>
        <NotificationCenter />
        <button
          type="button"
          onClick={isMobile ? onMobileClose : onToggle}
          aria-label={isMobile ? 'Close navigation' : 'Collapse sidebar'}
          title={isMobile ? 'Close navigation' : 'Collapse sidebar'}
          className={iconBtn}
        >
          {isMobile ? <X className="h-4 w-4" strokeWidth={1.5} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      </div>
      <button
        type="button"
        onClick={onOpenSearch}
        className={cx(
          'mt-2 flex h-8 w-full items-center gap-2 rounded-md border border-line bg-canvas px-2 text-dense text-fg-tertiary hover:border-line-strong hover:text-fg-secondary',
          focusRing
        )}
      >
        <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <span className="flex-1 text-left">Search</span>
        <kbd className="font-sans text-meta text-fg-tertiary">{shortcutLabel}</kbd>
      </button>
    </div>
  );
}
