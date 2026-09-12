'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import WidgetCard from './WidgetCard';

const TABS = [
  { id: 'status', label: 'Status' },
  { id: 'sources', label: 'Sources' },
  { id: 'qualification', label: 'Qualification' },
];

const STATUS_COLORS = {
  open: '#1D4B3E',
  in_progress: '#1D4B3E',
  lost: '#E5484D',
  won: '#163c32',
};

function LeadStatBox({ item, color }) {
  return (
    <div className="p-3 rounded-none border border-[#E8ECEF] bg-[#FAFBFB] transition-all duration-200 hover:border-[#BFDBFE] hover:bg-white hover:shadow-[0_2px_8px_rgba(16,24,40,0.05)]">
      <p className="text-[12px] font-normal text-[#475569] mb-1.5 truncate">{item.label}</p>
      <p className="text-[18px] font-medium text-[#1A1D1F] tabular-nums leading-none mb-2.5 tracking-[-0.02em]">
        {item.count}
        <span className="text-[11px] font-normal text-[#94A3B8] ml-1">leads</span>
      </p>
      <div className="h-1.5 rounded-full bg-[#EEF1F0] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${item.progress}%`, backgroundColor: color || '#1D4B3E' }}
        />
      </div>
    </div>
  );
}

export default function LeadsManagementCard({ leadsManagement, onRefresh }) {
  const [tab, setTab] = useState('status');
  const tabIndex = TABS.findIndex((t) => t.id === tab);

  if (!leadsManagement) return null;

  const items = leadsManagement[tab] || [];

  return (
    <WidgetCard
      title="Leads Management"
      onRefresh={onRefresh}
      action={
        <Link
          href="/automation/leads"
          className="inline-flex items-center gap-0.5 text-[12.5px] font-normal text-[#1D4B3E] hover:text-[#163c32] transition-colors"
        >
          View all
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      }
      className="h-full"
    >
      <div className="relative flex p-1 bg-[#F2F4F3] rounded-none mb-4 w-full max-w-[320px]">
        <span
          className="absolute top-1 bottom-1 rounded-none bg-white shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: 4,
            width: `calc((100% - 8px) / ${TABS.length})`,
            transform: `translateX(${tabIndex * 100}%)`,
          }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative z-10 flex-1 py-1.5 text-[12px] font-normal rounded-none transition-colors duration-200 ${tab === t.id ? 'text-[#101828]' : 'text-[#667085] hover:text-[#101828]'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
          <p className="text-[13px] font-medium text-[#475569]">Your pipeline is empty</p>
          <p className="text-[12px] text-[#98A2B3] mt-1 mb-4 max-w-[220px]">Let's get your first lead into LeadForGrow.</p>
          <div className="flex items-center gap-2">
            <Link
              href="/automation/leads/bulk"
              className="px-3 py-1.5 text-[12px] font-medium text-[#475569] bg-white border border-[#E8ECEF] rounded-none hover:bg-[#FAFBFB] transition-colors"
            >
              Import Leads
            </Link>
            <Link
              href="/automation/leads/new"
              className="px-3 py-1.5 text-[12px] font-semibold text-white bg-[#1D4B3E] rounded-none hover:bg-[#163c32] transition-colors"
            >
              Add Lead
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <LeadStatBox
              key={item.key}
              item={item}
              color={tab === 'status' ? STATUS_COLORS[item.key] : '#1D4B3E'}
            />
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
