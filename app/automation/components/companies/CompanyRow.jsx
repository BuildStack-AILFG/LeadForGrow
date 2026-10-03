'use client';

import { memo, useState } from 'react';
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

function CompanyRow({
  company,
  selected,
  onSelect,
  onOpen,
  onMenuAction,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const logo = companyLogoUrl(company);
  const stats = company.stats || {};
  const contact = company.primaryContact;

  return (
    <tr
      className={`group border-b border-[#F2F4F7] hover:bg-[#FAFBFC] cursor-pointer transition-colors duration-150 ${
        selected ? 'bg-subtle' : ''
      }`}
      onClick={() => onOpen(company._id)}
    >
      <td className="py-3 pl-3 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(company._id)} className="text-fg-tertiary hover:text-fg-secondary">
          {selected ? <CheckSquare className="w-4 h-4 text-fg" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-line bg-canvas flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <Building2 className="w-4 h-4 text-fg-tertiary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-dense font-semibold text-fg truncate">{company.name}</p>
            {company.website && (
              <p className="text-meta text-fg-tertiary truncate">{formatWebsite(company.website)}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        {company.industry ? (
          <span className="inline-flex text-meta font-medium px-2 py-0.5 rounded-md bg-subtle border border-line text-fg-secondary">
            {company.industry}
          </span>
        ) : (
          <span className="text-meta text-fg-tertiary">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(company.ownerId)} />
          <span className="text-meta text-fg-secondary truncate max-w-[100px]">{ownerName(company.ownerId)}</span>
        </div>
      </td>

      <td className="py-3 px-3">
        {contact ? (
          <div className="flex items-center gap-2">
            <Avatar name={contact.name} src={contact.avatar} />
            <div className="min-w-0">
              <p className="text-meta text-fg-secondary truncate">{contact.name}</p>
              {contact.jobTitle && <p className="text-meta text-fg-tertiary truncate">{contact.jobTitle}</p>}
            </div>
          </div>
        ) : (
          <span className="text-meta text-fg-tertiary">—</span>
        )}
      </td>

      <td className="py-3 px-3 text-dense font-medium text-fg-secondary tabular-nums">
        {stats.openDealCount || 0}
      </td>

      <td className="py-3 px-3 text-dense font-medium text-fg tabular-nums whitespace-nowrap">
        {formatCurrency(stats.pipelineValue, stats.currency)}
      </td>

      <td className="py-3 px-3 text-meta text-fg-tertiary whitespace-nowrap">
        {formatRelative(stats.lastActivity)}
      </td>

      <td className="py-3 px-3">
        <CompanyStatusBadge status={company.status || 'prospect'} size="xs" />
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
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(company._id); }} className="w-full px-3 py-2 text-left text-meta hover:bg-subtle">View details</button>
                <Link href={`/automation/companies/${company._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-meta hover:bg-subtle">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('archive', company._id); }} className="w-full px-3 py-2 text-left text-meta hover:bg-subtle">Archive</button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('delete', company._id); }} className="w-full px-3 py-2 text-left text-meta text-danger hover:bg-danger-subtle">Delete</button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(CompanyRow);
