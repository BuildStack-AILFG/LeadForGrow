'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Settings, Plus, User, CreditCard, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/components/ThemeContext';
import Popover from '@/app/components/ui/Popover';
import SegmentedControl from '@/app/components/ui/SegmentedControl';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Workspace switcher + user menu (sidebar footer). Neutral avatar square —
 * the accent is reserved for active/primary states (DESIGN_BRIEF §5.2).
 * Behaviour unchanged: Profile, Workspace settings, Billing, theme, Sign out.
 */
function MenuLink({ icon: Icon, children, onClick, danger, disabled }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-body',
        disabled ? 'cursor-not-allowed text-fg-disabled' : danger ? 'text-danger hover:bg-danger-subtle' : 'text-fg hover:bg-muted',
        focusRing
      )}
    >
      <Icon className={cx('h-4 w-4 shrink-0', !danger && !disabled && 'text-fg-tertiary')} strokeWidth={1.5} aria-hidden />
      {children}
    </button>
  );
}

export default function WorkspaceSwitcher({ workspace, plan, displayName, email, role, collapsed, onLogout }) {
  const router = useRouter();
  const { theme = 'light', setThemeMode = () => {} } = useTheme() || {};
  const initial = workspace?.charAt(0)?.toUpperCase() || 'W';
  const roleLabel = role?.toLowerCase() === 'owner' ? 'Owner' : 'Team member';

  return (
    <Popover
      side="top"
      align="start"
      width={232}
      trigger={(p) => (
        <button
          {...p}
          type="button"
          aria-label={collapsed ? `${workspace} — workspace menu` : undefined}
          className={cx(
            'flex items-center gap-3 rounded-lg hover:bg-accent-subtle',
            collapsed ? 'h-11 w-11 justify-center' : 'h-14 w-full px-2',
            focusRing
          )}
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-body font-semibold text-white">
            {initial}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-body font-semibold text-fg">{workspace}</span>
                <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-fg-tertiary">{plan ? `${plan} plan` : roleLabel}</span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-fg-tertiary" strokeWidth={1.75} aria-hidden />
            </>
          )}
        </button>
      )}
    >
      {({ close }) => (
        <div role="menu" className="p-1">
          <div className="px-2 pb-2 pt-1.5">
            <p className="truncate text-body font-medium text-fg">{workspace}</p>
            <p className="truncate text-meta text-fg-tertiary">{displayName || email}</p>
            <p className="mt-0.5 text-meta text-fg-tertiary">
              {plan ? `${plan} plan · ` : ''}
              {roleLabel}
            </p>
          </div>
          <div className="my-1 h-px bg-line" />
          <MenuLink icon={User} onClick={() => { close(); router.push('/user/home'); }}>Profile</MenuLink>
          <MenuLink icon={Settings} onClick={() => { close(); router.push('/automation/settings'); }}>Workspace settings</MenuLink>
          <MenuLink icon={CreditCard} onClick={() => { close(); router.push('/pricing'); }}>Billing</MenuLink>
          <div className="my-1 h-px bg-line" />
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-dense text-fg-secondary">Theme</span>
            <SegmentedControl
              size="sm"
              ariaLabel="Theme"
              value={theme === 'dark' ? 'dark' : 'light'}
              onChange={setThemeMode}
              options={[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
              ]}
            />
          </div>
          <MenuLink icon={Plus} disabled>Add workspace (coming soon)</MenuLink>
          <div className="my-1 h-px bg-line" />
          <MenuLink icon={LogOut} danger onClick={() => { close(); onLogout?.(); }}>Sign out</MenuLink>
        </div>
      )}
    </Popover>
  );
}
