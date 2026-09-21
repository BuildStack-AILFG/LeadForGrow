'use client';

import { memo, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckSquare, Square, MoreHorizontal, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ContactTypeBadge from './ContactTypeBadge';
import {
  initials,
  ownerName,
  formatRelative,
  contactName,
} from './utils';

const MENU_WIDTH = 160; // w-40

function Avatar({ name, src, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]';
  if (src) {
    return <img src={src} alt={name} className={`${sz} rounded-full object-cover border border-[#E5E7EB] dark:border-slate-700`} />;
  }
  return (
    <span className={`${sz} rounded-full bg-[#F2F4F7] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#475467] dark:text-slate-300 font-semibold inline-flex items-center justify-center shrink-0`}>
      {initials(name)}
    </span>
  );
}

function primaryEmail(contact) {
  return contact.emails?.find((e) => e.primary)?.address || contact.emails?.[0]?.address || '';
}

function primaryPhone(contact) {
  return contact.phones?.find((p) => p.primary)?.number || contact.phones?.[0]?.number || '';
}

function ContactRow({
  contact,
  selected,
  onSelect,
  onOpen,
  onMenuAction,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const btnRef = useRef(null);
  const stats = contact.stats || {};
  const name = contactName(contact);
  const email = primaryEmail(contact);
  const phone = primaryPhone(contact);
  const company = contact.companyId;

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
      className={`group border-b border-[#F2F4F7] dark:border-slate-700 hover:bg-[#FAFBFC] dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150 ${
        selected ? 'bg-[#F9FAFB] dark:bg-slate-900' : ''
      }`}
      onClick={() => onOpen(contact._id)}
    >
      <td className="py-3 pl-3 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(contact._id)} className="text-[#98A2B3] dark:text-slate-400 hover:text-[#344054] dark:hover:text-slate-200">
          {selected ? <CheckSquare className="w-4 h-4 text-[#101828] dark:text-slate-100" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={contact.avatar} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100 truncate">{name}</p>
            {email && (
              <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 truncate">{email}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        {company?.name ? (
          <Link
            href={`/automation/companies/${company._id || company}`}
            className="text-[12px] font-medium text-[#059669] dark:text-emerald-400 hover:underline truncate block max-w-[140px]"
          >
            {company.name}
          </Link>
        ) : (
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {email ? (
          <span className="text-[12px] text-[#344054] dark:text-slate-200 truncate block max-w-[160px]">{email}</span>
        ) : (
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {phone ? (
          <span className="text-[12px] text-[#344054] dark:text-slate-200 whitespace-nowrap">{phone}</span>
        ) : (
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {contact.jobTitle ? (
          <span className="text-[12px] text-[#344054] dark:text-slate-200 truncate block max-w-[120px]">{contact.jobTitle}</span>
        ) : (
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(contact.ownerId)} />
          <span className="text-[12px] text-[#344054] dark:text-slate-200 truncate max-w-[100px]">{ownerName(contact.ownerId)}</span>
        </div>
      </td>

      <td className="py-3 px-3 text-[13px] font-medium text-[#344054] dark:text-slate-200 tabular-nums">
        {stats.openDeals || 0}
      </td>

      <td className="py-3 px-3 text-[12px] text-[#667085] dark:text-slate-300 whitespace-nowrap">
        {formatRelative(stats.lastActivity)}
      </td>

      <td className="py-3 px-3">
        <ContactTypeBadge type={contact.type || 'personal'} size="xs" />
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
                className="fixed w-40 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-[101] py-1"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(contact._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">View details</button>
                <Link href={`/automation/contacts/${contact._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F9FAFB]">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                {contact.archived ? (
                  <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('restore', contact._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">Restore</button>
                ) : (
                  <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('archive', contact._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">Archive</button>
                )}
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('delete', contact._id); }} className="w-full px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </>,
            document.body
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(ContactRow);

