'use client';

import Link from 'next/link';
import {
  Clock,
  FileText,
  CreditCard,
  Calendar,
  AlertTriangle,
  Flame,
  Snowflake,
  ArrowRight,
} from 'lucide-react';
import DashboardCard from './primitives/DashboardCard';
import { formatCurrency } from '@/lib/crm/formatCurrency';

function FocusItem({ icon: Icon, title, subtitle, href, actionLabel, accent = 'slate' }) {
  const accents = {
    slate: 'text-fg-tertiary bg-muted dark:bg-slate-800',
    amber: 'text-warning bg-warning-subtle dark:bg-amber-950/30',
    emerald: 'text-accent-fg bg-accent-subtle dark:bg-emerald-950/30',
    red: 'text-danger bg-danger-subtle dark:bg-red-950/30',
    violet: 'text-accent-fg bg-accent-subtle dark:bg-violet-950/30',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-line dark:border-slate-800 hover:border-line dark:hover:border-emerald-900/50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg dark:text-slate-100 truncate">{title}</p>
        {subtitle && <p className="text-xs text-fg-tertiary truncate">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-accent-fg bg-accent-subtle dark:bg-emerald-950/30 rounded-md hover:bg-accent-subtle"
        >
          {actionLabel || 'Open'} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default function TodaysFocus({ focus, currency = 'INR' }) {
  if (!focus) return null;

  const items = [];

  (focus.followUpsToday || []).forEach((lead) => {
    items.push({
      key: `fu-${lead._id}`,
      icon: Clock,
      title: `Follow-up: ${lead.name}`,
      subtitle: lead.phone || 'Due today',
      href: `/automation/leads/${lead._id}`,
      actionLabel: 'Contact',
      accent: 'amber',
    });
  });

  (focus.dealsAwaitingQuotation || []).forEach((deal) => {
    items.push({
      key: `q-${deal._id}`,
      icon: FileText,
      title: deal.title,
      subtitle: `Send quotation · ${formatCurrency(deal.amount, deal.currency || currency)}`,
      href: `/automation/deals/${deal._id}`,
      actionLabel: 'Quote',
      accent: 'violet',
    });
  });

  (focus.dealsAwaitingPayment || []).forEach((deal) => {
    items.push({
      key: `p-${deal._id}`,
      icon: CreditCard,
      title: deal.title,
      subtitle: `Payment pending · ${formatCurrency(deal.amount, deal.currency || currency)}`,
      href: `/automation/deals/${deal._id}`,
      actionLabel: 'Collect',
      accent: 'emerald',
    });
  });

  (focus.meetingsNext24h || []).slice(0, 4).forEach((m) => {
    items.push({
      key: `m-${m._id}`,
      icon: Calendar,
      title: m.guest?.name || 'Meeting',
      subtitle: new Date(m.startTime).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
      href: '/automation/meetings',
      actionLabel: 'Join',
      accent: 'violet',
    });
  });

  (focus.overdueTasks || []).slice(0, 4).forEach((task) => {
    items.push({
      key: `t-${task._id}`,
      icon: AlertTriangle,
      title: task.title || 'Overdue task',
      subtitle: task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'Overdue',
      href: '/automation/tasks?filter=overdue',
      actionLabel: 'Complete',
      accent: 'red',
    });
  });

  (focus.hotLeads || []).slice(0, 3).forEach((lead) => {
    items.push({
      key: `h-${lead._id}`,
      icon: Flame,
      title: `Hot lead: ${lead.name}`,
      subtitle: `${lead.priority} priority`,
      href: `/automation/leads/${lead._id}`,
      actionLabel: 'Engage',
      accent: 'amber',
    });
  });

  (focus.staleDeals || []).slice(0, 3).forEach((deal) => {
    items.push({
      key: `s-${deal._id}`,
      icon: Snowflake,
      title: deal.title,
      subtitle: 'No activity for 7+ days',
      href: `/automation/deals/${deal._id}`,
      actionLabel: 'Revive',
      accent: 'slate',
    });
  });

  return (
    <DashboardCard padding="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-fg dark:text-white">Today&apos;s Focus</h2>
          <p className="text-xs text-fg-tertiary mt-0.5">What needs your attention right now</p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent-subtle text-accent-fg dark:bg-emerald-950/30 dark:text-accent-fg">
          {items.length} items
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-fg-tertiary py-8 text-center">You&apos;re all caught up — great work!</p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {items.slice(0, 12).map((item) => (
            <FocusItem key={item.key} {...item} />
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
