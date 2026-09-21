'use client';

import { memo, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Square, MoreHorizontal, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import CompanyStatusBadge from './CompanyStatusBadge';
import {
  initials,
  ownerName,
  formatCurrency,
  formatRelative,
  formatWebsite,
  companyLogoUrl,
} from './utils';

const MENU_WIDTH = 160; // w-40

function Avatar({ name, src, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]';
  if (src) {
    return <img src={src} alt={name} className={`${sz} rounded-full object-cover border border-[#E5E7EB]`} />;
  }
  return (
    <span className={`${sz} rounded-full bg-[#F2F4F7] border border-[#E5E7EB] text-[#475467] font-semibold inline-flex items-center justify-center shrink-0`}>
      {initials(name)}
    </span>
  );
}

function CompanyRow({
  company,
  selected,
  onSelect,
  onOpen,
  onMenuAction,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const logo = companyLogoUrl(company);
  const stats = company.stats || {};
  const contact = company.primaryContact;

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
      className={`group border-b border-[#F2F4F7] hover:bg-[#FAFBFC] cursor-pointer transition-colors duration-150 ${
        selected ? 'bg-[#F9FAFB]' : ''
      }`}
      onClick={() => onOpen(company._id)}
    >
      <td className="py-3 pl-3 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(company._id)} className="text-[#98A2B3] hover:text-[#344054]">
          {selected ? <CheckSquare className="w-4 h-4 text-[#101828]" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-[#E5E7EB] bg-white flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <Building2 className="w-4 h-4 text-[#98A2B3]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] truncate">{company.name}</p>
            {company.website && (
              <p className="text-[11px] text-[#98A2B3] truncate">{formatWebsite(company.website)}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        {company.industry ? (
          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F9FAFB] border border-[#E5E7EB] text-[#475467]">
            {company.industry}
          </span>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(company.ownerId)} />
          <span className="text-[12px] text-[#344054] truncate max-w-[100px]">{ownerName(company.ownerId)}</span>
        </div>
      </td>

      <td className="py-3 px-3">
        {contact ? (
          <div className="flex items-center gap-2">
            <Avatar name={contact.name} src={contact.avatar} />
            <div className="min-w-0">
              <p className="text-[12px] text-[#344054] truncate">{contact.name}</p>
              {contact.jobTitle && <p className="text-[10px] text-[#98A2B3] truncate">{contact.jobTitle}</p>}
            </div>
          </div>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className="py-3 px-3 text-[13px] font-medium text-[#344054] tabular-nums">
        {stats.openDealCount || 0}
      </td>

      <td className="py-3 px-3 text-[13px] font-medium text-[#101828] tabular-nums whitespace-nowrap">
        {formatCurrency(stats.pipelineValue, stats.currency)}
      </td>

      <td className="py-3 px-3 text-[12px] text-[#667085] whitespace-nowrap">
        {formatRelative(stats.lastActivity)}
      </td>

      <td className="py-3 px-3">
        <CompanyStatusBadge status={company.status || 'prospect'} size="xs" />
      </td>

      <td className="py-3 px-2 w-10" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-md text-[#98A2B3] hover:text-[#344054] hover:bg-[#F2F4F7] transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && menuPos && createPortal(
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)} />
              <div
                className="fixed w-40 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-[101] py-1"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(company._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">View details</button>
                <Link href={`/automation/companies/${company._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F9FAFB]">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                {company.archived ? (
                  <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('restore', company._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">Restore</button>
                ) : (
                  <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('archive', company._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">Archive</button>
                )}
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('delete', company._id); }} className="w-full px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </>,
            document.body
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(CompanyRow);
