'use client';

import { memo, useState } from 'react';
import { CheckSquare, Square, MoreHorizontal, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ContactTypeBadge from './ContactTypeBadge';
import {
  initials,
  ownerName,
  formatRelative,
  contactName,
} from './utils';

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
  const stats = contact.stats || {};
  const name = contactName(contact);
  const email = primaryEmail(contact);
  const phone = primaryPhone(contact);
  const company = contact.companyId;

  return (
    <tr
      className={`group border-b border-[#F2F4F7] hover:bg-[#FAFBFC] cursor-pointer transition-colors duration-150 ${
        selected ? 'bg-[#F9FAFB]' : ''
      }`}
      onClick={() => onOpen(contact._id)}
    >
      <td className="py-3 pl-3 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(contact._id)} className="text-[#98A2B3] hover:text-[#344054]">
          {selected ? <CheckSquare className="w-4 h-4 text-[#101828]" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={contact.avatar} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] truncate">{name}</p>
            {email && (
              <p className="text-[11px] text-[#98A2B3] truncate">{email}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        {company?.name ? (
          <Link
            href={`/automation/companies/${company._id || company}`}
            className="text-[12px] font-medium text-[#059669] hover:underline truncate block max-w-[140px]"
          >
            {company.name}
          </Link>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {email ? (
          <span className="text-[12px] text-[#344054] truncate block max-w-[160px]">{email}</span>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {phone ? (
          <span className="text-[12px] text-[#344054] whitespace-nowrap">{phone}</span>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {contact.jobTitle ? (
          <span className="text-[12px] text-[#344054] truncate block max-w-[120px]">{contact.jobTitle}</span>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(contact.ownerId)} />
          <span className="text-[12px] text-[#344054] truncate max-w-[100px]">{ownerName(contact.ownerId)}</span>
        </div>
      </td>

      <td className="py-3 px-3 text-[13px] font-medium text-[#344054] tabular-nums">
        {stats.openDeals || 0}
      </td>

      <td className="py-3 px-3 text-[12px] text-[#667085] whitespace-nowrap">
        {formatRelative(stats.lastActivity)}
      </td>

      <td className="py-3 px-3">
        <ContactTypeBadge type={contact.type || 'personal'} size="xs" />
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
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(contact._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">View details</button>
                <Link href={`/automation/contacts/${contact._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F9FAFB]">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('archive', contact._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB]">Archive</button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('delete', contact._id); }} className="w-full px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(ContactRow);
