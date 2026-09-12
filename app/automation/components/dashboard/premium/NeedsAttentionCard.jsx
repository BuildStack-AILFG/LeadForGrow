'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import WidgetCard from './WidgetCard';
import { formatCurrency } from '@/lib/crm/formatCurrency';

// Replaces TopLocationsCard — surfaces the `focus` dataset the dashboard API
// already computes (hot leads, stale deals, follow-ups, payments pending,
// overdue tasks) but never rendered anywhere. See DECISIONS.md 2026-09-12.
const TABS = [
  { id: 'hotLeads', label: 'Hot Leads' },
  { id: 'staleDeals', label: 'Stale Deals' },
  { id: 'followUps', label: 'Follow-ups' },
  { id: 'payments', label: 'Payments' },
  { id: 'overdueTasks', label: 'Overdue Tasks' },
];

const EMPTY_COPY = {
  hotLeads: "No high-priority leads waiting — you're on top of it.",
  staleDeals: 'No deals have gone quiet this week.',
  followUps: 'No follow-ups due today.',
  payments: 'Nothing waiting on a quote or payment.',
  overdueTasks: 'No overdue tasks.',
};

function relativeDays(date) {
  if (!date) return '';
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function Row({ href, title, sub, chip, chipClass }) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#1A1D1F] truncate">{title}</p>
        {sub && <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{sub}</p>}
      </div>
      {chip && (
        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${chipClass || 'bg-[#F0F9F5] text-[#1D4B3E]'}`}>
          {chip}
        </span>
      )}
    </>
  );
  const className = 'flex items-center justify-between gap-3 py-2.5 px-1 -mx-1 rounded transition-colors';
  return href
    ? <Link href={href} className={`${className} hover:bg-[#FAFBFB]`}>{content}</Link>
    : <div className={className}>{content}</div>;
}

function buildRows(tab, focus, currency) {
  if (tab === 'hotLeads') {
    return (focus.hotLeads || []).map((l) => ({
      id: l._id,
      href: `/automation/leads/${l._id}`,
      title: l.name || 'Unnamed lead',
      sub: l.phone,
      chip: l.priority === 'urgent' ? 'Urgent' : 'High',
      chipClass: l.priority === 'urgent' ? 'bg-[#FEF3F2] text-[#C0353A]' : 'bg-[#FFFBEB] text-[#B45309]',
    }));
  }
  if (tab === 'staleDeals') {
    return (focus.staleDeals || []).map((d) => ({
      id: d._id,
      href: `/automation/deals/${d._id}`,
      title: d.title || 'Untitled deal',
      sub: `${d.stage || ''} · updated ${relativeDays(d.updatedAt)}`,
      chip: formatCurrency(d.amount, d.currency || currency),
    }));
  }
  if (tab === 'followUps') {
    return (focus.followUpsToday || []).map((l) => ({
      id: l._id,
      href: `/automation/leads/${l._id}`,
      title: l.name || 'Unnamed lead',
      sub: l.phone,
      chip: 'Today',
    }));
  }
  if (tab === 'payments') {
    const quotation = (focus.dealsAwaitingQuotation || []).map((d) => ({ ...d, note: 'Awaiting quotation' }));
    const payment = (focus.dealsAwaitingPayment || []).map((d) => ({ ...d, note: 'Awaiting payment' }));
    return [...quotation, ...payment].map((d) => ({
      id: d._id,
      href: `/automation/deals/${d._id}`,
      title: d.title || 'Untitled deal',
      sub: d.note,
      chip: formatCurrency(d.amount, d.currency || currency),
    }));
  }
  // overdueTasks — Task docs aren't populated with a lead link here, so
  // rows are informational only rather than risking a link to the wrong place.
  return (focus.overdueTasks || []).map((t) => ({
    id: t._id,
    title: t.title || 'Untitled task',
    sub: `Due ${relativeDays(t.dueDate)}`,
    chip: t.type,
    chipClass: 'bg-[#FEF3F2] text-[#C0353A]',
  }));
}

export default function NeedsAttentionCard({ focus, currency = 'INR', onRefresh }) {
  const [tab, setTab] = useState('hotLeads');
  if (!focus) return null;

  const counts = {
    hotLeads: (focus.hotLeads || []).length,
    staleDeals: (focus.staleDeals || []).length,
    followUps: (focus.followUpsToday || []).length,
    payments: (focus.dealsAwaitingQuotation || []).length + (focus.dealsAwaitingPayment || []).length,
    overdueTasks: (focus.overdueTasks || []).length,
  };
  const rows = buildRows(tab, focus, currency);

  return (
    <WidgetCard
      title="Needs Attention"
      icon={AlertTriangle}
      onRefresh={onRefresh}
      className="h-full"
      bodyClassName="flex flex-col flex-1 min-h-0"
    >
      <div className="flex gap-1 mb-3 overflow-x-auto pb-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-none transition-colors whitespace-nowrap ${
              tab === t.id ? 'bg-[#1D4B3E] text-white' : 'bg-[#F2F4F3] text-[#667085] hover:text-[#101828]'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={tab === t.id ? 'text-white/80' : 'text-[#94A3B8]'}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#F1F3F2]">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
            <p className="text-[13px] font-medium text-[#475569]">All clear</p>
            <p className="text-[12px] text-[#98A2B3] mt-1 max-w-[220px]">{EMPTY_COPY[tab]}</p>
          </div>
        ) : (
          rows.slice(0, 8).map((r) => <Row key={r.id} {...r} />)
        )}
      </div>
    </WidgetCard>
  );
}
