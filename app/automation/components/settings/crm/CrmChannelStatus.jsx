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
          ? 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none'
          : 'bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-slate-900 border-amber-200/60 dark:border-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700'
      }`}
    >
      <CrmIconBadge variant={variant} size="lg" ring>
        {icon}
      </CrmIconBadge>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">{label}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide ${
              connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-amber-500 animate-pulse'}`}
            />
            {connected ? 'Operational' : 'Setup required'}
          </span>
        </div>
      </div>
      {!connected && (
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0" />
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
      <div className="flex items-center gap-4 p-5 rounded-2xl border bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800">
        <CrmIconBadge variant="indigo" size="lg" ring>
          <AutomationPulseIcon />
        </CrmIconBadge>
        <div>
          <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Message automations</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="text-lg font-semibold text-slate-900 dark:text-slate-50 tabular-nums tracking-tight">{activeAutomations}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-slate-500 dark:text-slate-400">8 channels active</span>
          </p>
        </div>
      </div>
    </div>
  );
}
