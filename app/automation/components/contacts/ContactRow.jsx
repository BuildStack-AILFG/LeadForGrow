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
  const sz = size === 'sm' ? 'w-7 h-7 text-meta' : 'w-8 h-8 text-meta';
  if (src) {
    return <img src={src} alt={name} className={`${sz} rounded-full object-cover border border-line`} />;
  }
  return (
    <span className={`${sz} rounded-full bg-muted border border-line text-fg-secondary font-semibold inline-flex items-center justify-center shrink-0`}>
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
        selected ? 'bg-subtle' : ''
      }`}
      onClick={() => onOpen(contact._id)}
    >
      <td className="py-3 pl-3 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(contact._id)} className="text-fg-tertiary hover:text-fg-secondary">
          {selected ? <CheckSquare className="w-4 h-4 text-fg" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={contact.avatar} />
          <div className="min-w-0">
            <p className="text-dense font-semibold text-fg truncate">{name}</p>
            {email && (
              <p className="text-meta text-fg-tertiary truncate">{email}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
        {company?.name ? (
          <Link
            href={`/automation/companies/${company._id || company}`}
            className="text-meta font-medium text-accent-fg hover:underline truncate block max-w-[140px]"
          >
            {company.name}
          </Link>
        ) : (
          <span className="text-meta text-fg-tertiary">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {email ? (
          <span className="text-meta text-fg-secondary truncate block max-w-[160px]">{email}</span>
        ) : (
          <span className="text-meta text-fg-tertiary">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {phone ? (
          <span className="text-meta text-fg-secondary whitespace-nowrap">{phone}</span>
        ) : (
          <span className="text-meta text-fg-tertiary">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        {contact.jobTitle ? (
          <span className="text-meta text-fg-secondary truncate block max-w-[120px]">{contact.jobTitle}</span>
        ) : (
          <span className="text-meta text-fg-tertiary">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(contact.ownerId)} />
          <span className="text-meta text-fg-secondary truncate max-w-[100px]">{ownerName(contact.ownerId)}</span>
        </div>
      </td>

      <td className="py-3 px-3 text-dense font-medium text-fg-secondary tabular-nums">
        {stats.openDeals || 0}
      </td>

      <td className="py-3 px-3 text-meta text-fg-tertiary whitespace-nowrap">
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
            className="p-1.5 rounded-md text-fg-tertiary hover:text-fg-secondary hover:bg-muted transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-canvas border border-line rounded-lg shadow-popover z-20 py-1">
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(contact._id); }} className="w-full px-3 py-2 text-left text-meta hover:bg-subtle">View details</button>
                <Link href={`/automation/contacts/${contact._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-meta hover:bg-subtle">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('archive', contact._id); }} className="w-full px-3 py-2 text-left text-meta hover:bg-subtle">Archive</button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('delete', contact._id); }} className="w-full px-3 py-2 text-left text-meta text-danger hover:bg-danger-subtle">Delete</button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(ContactRow);
