'use client';

import { usePathname } from 'next/navigation';
import Tabs from '@/app/components/ui/Tabs';

/**
 * Templates has two routes behind one nav entry (owner-approved IA,
 * 2026-10-03): message templates and Meta-approved WhatsApp templates.
 * This tab bar sits at the top of both pages so each is one click away.
 */
const TABS = [
  { value: 'messages', label: 'Message templates', href: '/automation/templates' },
  { value: 'whatsapp', label: 'WhatsApp templates', href: '/automation/whatsapp-templates' },
];

export default function TemplateChannelTabs() {
  const pathname = usePathname();
  const value = pathname?.startsWith('/automation/whatsapp-templates') ? 'whatsapp' : 'messages';
  return (
    <div className="border-b border-line bg-canvas px-6 pt-2 font-app">
      <Tabs tabs={TABS} value={value} ariaLabel="Template type" className="border-b-0" />
    </div>
  );
}
