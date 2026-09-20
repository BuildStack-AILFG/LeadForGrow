'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeft, X } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';

export default function SidebarHeader({ collapsed, isMobile, onToggle, onMobileClose }) {
  const LogoMark = ({ size = 'md' }) => (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-line bg-white dark:bg-slate-900 shadow-sm ${
        size === 'sm' ? 'h-9 w-9' : 'h-8 w-8'
      }`}
    >
      <img src="/image.png" alt="LeadForGrow" className={size === 'sm' ? 'h-5 w-5 object-contain' : 'h-[18px] w-[18px] object-contain'} />
    </div>
  );

  return (
    <div
      className={`flex-shrink-0 border-b border-line bg-white dark:bg-slate-900 ${
        collapsed ? 'px-2 py-3' : 'px-3 py-3.5'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
        {!collapsed ? (
          <Link href="/automation" className="group flex min-w-0 flex-1 items-center gap-2.5">
            <LogoMark />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-[#1A1D1F] dark:text-slate-100 transition-colors group-hover:text-brand-ink">
                LeadForGrow
              </p>
            </div>
          </Link>
        ) : (
          <Link href="/automation" title="LeadForGrow">
            <LogoMark size="sm" />
          </Link>
        )}

        <div className={`flex items-center gap-0.5 ${collapsed ? 'flex-col' : ''}`}>
          <NotificationCenter />
          <button
            type="button"
            onClick={isMobile ? onMobileClose : onToggle}
            className="rounded-lg p-2 text-[#6B7280] dark:text-slate-300 transition-colors hover:bg-[#F3F4F6] dark:hover:bg-slate-800 hover:text-[#1A1D1F] dark:hover:text-slate-100"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
