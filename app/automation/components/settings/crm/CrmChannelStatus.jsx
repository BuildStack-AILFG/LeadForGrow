'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  CrmIconBadge,
  WhatsAppIcon,
  GmailIcon,
  AutomationPulseIcon,
} from './CrmIcons';

function ChannelCard({ label, connected, href, icon, variant }) {
  const content = (
    <div
      className={`group relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 ${
        connected
          ? 'bg-canvas dark:bg-slate-900/80 border-line/90 dark:border-slate-800 hover:border-line-strong dark:hover:border-slate-700 hover:shadow-popover dark:hover:shadow-none'
          : 'bg-canvas border-warning/30 dark:border-amber-900/30 hover:border-warning/30'
      }`}
    >
      <CrmIconBadge variant={variant} size="lg" ring>
        {icon}
      </CrmIconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-dense font-semibold text-fg dark:text-slate-100 tracking-tight">{label}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${
              connected ? 'text-accent-fg dark:text-accent-fg' : 'text-warning dark:text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-accent' : 'bg-warning animate-pulse'}`}
            />
            {connected ? 'Operational' : 'Setup required'}
          </span>
        </div>
      </div>
      {!connected && (
        <ChevronRight className="w-4 h-4 text-fg-tertiary group-hover:text-fg-secondary group-hover:translate-x-0.5 transition-all shrink-0" />
      )}
    </div>
  );

  if (!connected && href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function CrmChannelStatus({ integrations, activeAutomations = 0 }) {
  const integrationsHref = '/automation/settings/integrations';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <ChannelCard
        label="WhatsApp Business"
        connected={integrations?.whatsapp}
        href={integrationsHref}
        variant="whatsapp"
        icon={<WhatsAppIcon />}
      />
      <ChannelCard
        label="Email delivery"
        connected={integrations?.email}
        href={integrationsHref}
        variant="sky"
        icon={<GmailIcon />}
      />
      <div className="flex items-center gap-4 p-5 rounded-lg border bg-canvas dark:bg-slate-900/80 border-line/90 dark:border-slate-800">
        <CrmIconBadge variant="indigo" size="lg" ring>
          <AutomationPulseIcon />
        </CrmIconBadge>
        <div>
          <p className="text-dense font-semibold text-fg dark:text-slate-100 tracking-tight">Message automations</p>
          <p className="text-xs text-fg-tertiary mt-1">
            <span className="text-lg font-semibold text-fg dark:text-slate-50 tabular-nums tracking-tight">{activeAutomations}</span>
            <span className="text-fg-tertiary mx-1">/</span>
            <span className="text-fg-tertiary">8 channels active</span>
          </p>
        </div>
      </div>
    </div>
  );
}
