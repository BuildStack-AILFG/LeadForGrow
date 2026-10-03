'use client';

import { Suspense, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import SettingsHeader from './SettingsHeader';

function sectionFromPath(pathname) {
  if (pathname.includes('/settings/integrations')) return 'integrations';
  if (pathname.includes('/settings/crm')) return 'crm';
  if (pathname.includes('/settings/automation')) return 'automation';
  if (pathname.includes('/settings/team')) return 'team';
  if (pathname.includes('/settings/general')) return 'general';
  return 'hub';
}

function isSettingsHub(pathname) {
  return pathname === '/automation/settings' || pathname === '/automation/settings/';
}

function SettingsLayoutInner({ children }) {
  const pathname = usePathname();
  const isHub = isSettingsHub(pathname);
  const section = useMemo(() => sectionFromPath(pathname), [pathname]);
  const wide = section === 'integrations' || section === 'team' || section === 'crm';

  if (isHub) {
    return <div className="relative min-h-full">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <SettingsHeader section={section} />
      <div className="flex-1 overflow-y-auto relative">
        <div className={`px-4 sm:px-6 py-6 pb-10 ${wide ? '' : 'max-w-4xl'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function SettingsLayoutClient({ children }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-fg-tertiary">Loading settings…</div>}>
      <SettingsLayoutInner>{children}</SettingsLayoutInner>
    </Suspense>
  );
}
