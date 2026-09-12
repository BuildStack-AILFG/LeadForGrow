'use client';

import { useState } from 'react';
import PremiumCard from './PremiumCard';
import WidgetMenu from './WidgetMenu';

/**
 * Unified widget shell so every dashboard card shares the same header spacing,
 * three-dot menu (refresh / collapse), and collapse behaviour.
 */
export default function WidgetCard({
  title,
  subtitle,
  icon: Icon,
  action,
  onRefresh,
  collapsible = true,
  menuItems = [],
  showMenu = true,
  padding = 'p-4',
  className = '',
  bodyClassName = '',
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <PremiumCard padding={padding} className={`flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="flex items-center justify-center w-8 h-8 rounded-none bg-[#F0F9F5] text-[#1D4B3E]">
              <Icon className="w-4 h-4" strokeWidth={2} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[13px] font-medium text-[#1A1D1F] tracking-[-0.01em] truncate">
              {title}
            </h2>
            {subtitle && <p className="text-[12px] text-[#98A2B3] mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {action}
          {showMenu && (
            <WidgetMenu
              onRefresh={onRefresh}
              onToggleCollapse={collapsible ? () => setCollapsed((c) => !c) : undefined}
              collapsed={collapsed}
              extraItems={menuItems}
            />
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-out ${collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-none opacity-100 flex-1 flex flex-col'
          } ${collapsed ? '' : 'mt-3'} ${bodyClassName}`}
      >
        {children}
      </div>
    </PremiumCard>
  );
}
