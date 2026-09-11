'use client';

import { memo, useState } from 'react';
import { MoreHorizontal, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import DealStageBadge from './DealStageBadge';
import {
  initials,
  ownerName,
  formatValue,
  formatDate,
  companyOrContact,
  dealProbability,
} from './utils';

function Avatar({ name, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]';
  return (
    <span className={`${sz} rounded-full bg-[#101828] text-white font-semibold inline-flex items-center justify-center shrink-0`}>
      {initials(name)}
    </span>
  );
}

function DealRow({
  deal,
  stages,
  onOpen,
  onEdit,
  onDelete,
  onStageChange,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const prob = dealProbability(deal, stages);
  const contact = companyOrContact(deal);

  return (
    <tr
      className="group border-b border-[#F2F4F7] hover:bg-[#FAFBFC] cursor-pointer transition-colors duration-150"
      onClick={() => onOpen(deal._id)}
    >
      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <Avatar name={deal.title} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] truncate">{deal.title}</p>
            {deal.source && (
              <p className="text-[11px] text-[#98A2B3] capitalize truncate mt-0.5">{deal.source}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        <span className="text-[12px] text-[#344054] truncate block max-w-[160px]">{contact}</span>
      </td>

      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        <select
          value={deal.stage}
          onChange={(e) => onStageChange(deal._id, e.target.value)}
          className="text-[12px] font-medium bg-transparent border-0 p-0 pr-5 focus:ring-0 cursor-pointer text-[#344054] mb-1"
          title="Change stage"
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <DealStageBadge stage={deal.stage} stages={stages} size="xs" />
      </td>

      <td className="py-3 px-3 text-[13px] font-semibold text-[#101828] tabular-nums whitespace-nowrap">
        {formatValue(deal.amount, deal.currency)}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 rounded-full bg-[#F2F4F7] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#101828]"
              style={{ width: `${Math.min(100, Math.max(0, prob))}%` }}
            />
          </div>
          <span className="text-[12px] tabular-nums text-[#667085] w-8 text-right">{prob}%</span>
        </div>
      </td>

      <td className="py-3 px-3 text-[12px] text-[#667085] tabular-nums whitespace-nowrap">
        {formatDate(deal.wonAt || deal.expectedCloseDate)}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(deal.assignedTo)} />
          <span className="text-[12px] text-[#344054] truncate max-w-[100px]">{ownerName(deal.assignedTo)}</span>
        </div>
      </td>

      <td className="py-3 px-2 w-10" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-[#98A2B3] hover:text-[#344054] hover:bg-[#F2F4F7] transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-20 py-1">
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(deal._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">View details</button>
                <Link href={`/automation/deals/${deal._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F9FAFB]">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(deal); }} className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(deal._id, deal.title); }} className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(DealRow);
