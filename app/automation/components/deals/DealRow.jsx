'use client';

import { memo, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const MENU_WIDTH = 160; // w-40

function Avatar({ name, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]';
  return (
    <span className={`${sz} rounded-full bg-[#101828] dark:bg-slate-700 text-white font-semibold inline-flex items-center justify-center shrink-0`}>
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
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const prob = dealProbability(deal, stages);
  const contact = companyOrContact(deal);

  // Rendered through a portal and positioned from the trigger button's own bounding
  // rect (fixed coordinates) instead of `position: absolute` nested inside the table's
  // overflow-x-auto/overflow-hidden wrapper — that ancestor was clipping the menu (and
  // its "View details" item) for rows near the bottom of the table.
  useLayoutEffect(() => {
    if (!menuOpen || !btnRef.current) return undefined;
    function place() {
      const rect = btnRef.current.getBoundingClientRect();
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      let left = rect.right - MENU_WIDTH;
      left = Math.max(8, Math.min(left, viewport.w - MENU_WIDTH - 8));
      let top = rect.bottom + 4;
      const menuHeight = 160;
      if (top + menuHeight > viewport.h - 8) {
        top = rect.top - menuHeight - 4;
      }
      setMenuPos({ top: Math.max(8, top), left });
    }
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [menuOpen]);

  return (
    <tr
      className="group border-b border-[#F2F4F7] dark:border-slate-700 hover:bg-[#FAFBFC] dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150"
      onClick={() => onOpen(deal._id)}
    >
      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <Avatar name={deal.title} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100 truncate">{deal.title}</p>
            {deal.source && (
              <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 capitalize truncate mt-0.5">{deal.source}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        <span className="text-[12px] text-[#344054] dark:text-slate-200 truncate block max-w-[160px]">{contact}</span>
      </td>

      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        <select
          value={deal.stage}
          onChange={(e) => onStageChange(deal._id, e.target.value)}
          className="text-[12px] font-medium bg-transparent border-0 p-0 pr-5 focus:ring-0 cursor-pointer text-[#344054] dark:text-slate-200 mb-1"
          title="Change stage"
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <DealStageBadge stage={deal.stage} stages={stages} size="xs" />
      </td>

      <td className="py-3 px-3 text-[13px] font-semibold text-[#101828] dark:text-slate-100 tabular-nums whitespace-nowrap">
        {formatValue(deal.amount, deal.currency)}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 rounded-full bg-[#F2F4F7] dark:bg-slate-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#101828] dark:bg-slate-700"
              style={{ width: `${Math.min(100, Math.max(0, prob))}%` }}
            />
          </div>
          <span className="text-[12px] tabular-nums text-[#667085] dark:text-slate-300 w-8 text-right">{prob}%</span>
        </div>
      </td>

      <td className="py-3 px-3 text-[12px] text-[#667085] dark:text-slate-300 tabular-nums whitespace-nowrap">
        {formatDate(deal.wonAt || deal.expectedCloseDate)}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(deal.assignedTo)} />
          <span className="text-[12px] text-[#344054] dark:text-slate-200 truncate max-w-[100px]">{ownerName(deal.assignedTo)}</span>
        </div>
      </td>

      <td className="py-3 px-2 w-10" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-[#98A2B3] dark:text-slate-400 hover:text-[#344054] dark:hover:text-slate-200 hover:bg-[#F2F4F7] dark:hover:bg-slate-800 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && menuPos && createPortal(
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
              <div
                className="fixed w-40 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg shadow-lg z-[101] py-1"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(deal._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB] dark:hover:bg-slate-800">View details</button>
                <Link href={`/automation/deals/${deal._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F9FAFB] dark:hover:bg-slate-800">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(deal); }} className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB] dark:hover:bg-slate-800">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button type="button" onClick={() => { setMenuOpen(false); onDelete(deal._id, deal.title); }} className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(DealRow);
