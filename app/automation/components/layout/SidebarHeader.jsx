'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeft, X } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';
import Tooltip from '@/app/components/ui/Tooltip';
import cx, { focusRing } from '@/app/components/ui/cx';
import LogoMark from './LogoMark';

/**
 * Sidebar header (owner's reference): logo mark in a bordered white tile +
 * "LeadForGrow", then the notification bell and collapse toggle.
 * Search stays on Ctrl/⌘ K (command palette) rather than a box here.
 */
const iconBtn = cx('inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-secondary hover:bg-muted hover:text-fg', focusRing);

function LogoTile({ size = 36 }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-lg border border-line bg-canvas" style={{ width: size, height: size }}>
      <LogoMark size={Math.round(size * 0.55)} />
    </span>
  );
}

export default function SidebarHeader({ collapsed, isMobile, onToggle, onMobileClose }) {
  if (collapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1.5 border-b border-line px-2 py-3">
        <Link href="/automation" aria-label="LeadForGrow home" className={cx('rounded-lg', focusRing)}>
          <LogoTile />
        </Link>
        <NotificationCenter />
        <Tooltip label="Expand sidebar" side="right">
          <button type="button" onClick={onToggle} aria-label="Expand sidebar" className={iconBtn}>
            <PanelLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-3">
      <Link href="/automation" className={cx('flex min-w-0 flex-1 items-center gap-2.5 rounded-lg', focusRing)}>
        <LogoTile />
        <span className="truncate text-title font-semibold text-fg">LeadForGrow</span>
      </Link>
      <NotificationCenter />
      <button
        type="button"
        onClick={isMobile ? onMobileClose : onToggle}
        aria-label={isMobile ? 'Close navigation' : 'Collapse sidebar'}
        title={isMobile ? 'Close navigation' : 'Collapse sidebar'}
        className={iconBtn}
      >
        {isMobile ? <X className="h-4 w-4" strokeWidth={1.75} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
