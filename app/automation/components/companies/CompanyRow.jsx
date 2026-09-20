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
      className={`group border-b border-[#F2F4F7] dark:border-slate-700 hover:bg-[#FAFBFC] dark:hover:bg-slate-800 cursor-pointer transition-colors duration-150 ${
        selected ? 'bg-[#F9FAFB] dark:bg-slate-900' : ''
      }`}
      onClick={() => onOpen(company._id)}
    >
      <td className="py-3 pl-3 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(company._id)} className="text-[#98A2B3] dark:text-slate-400 hover:text-[#344054] dark:hover:text-slate-200">
          {selected ? <CheckSquare className="w-4 h-4 text-[#101828] dark:text-slate-100" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      <td className="py-3 px-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
            {logo ? (
              <img src={logo} alt="" className="w-5 h-5 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <Building2 className="w-4 h-4 text-[#98A2B3] dark:text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100 truncate">{company.name}</p>
            {company.website && (
              <p className="text-[11px] text-[#98A2B3] dark:text-slate-400 truncate">{formatWebsite(company.website)}</p>
            )}
          </div>
        </div>
      </td>

      <td className="py-3 px-3">
        {company.industry ? (
          <span className="inline-flex text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F9FAFB] dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 text-[#475467] dark:text-slate-300">
            {company.industry}
          </span>
        ) : (
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">—</span>
        )}
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Avatar name={ownerName(company.ownerId)} />
          <span className="text-[12px] text-[#344054] dark:text-slate-200 truncate max-w-[100px]">{ownerName(company.ownerId)}</span>
        </div>
      </td>

      <td className="py-3 px-3">
        {contact ? (
          <div className="flex items-center gap-2">
            <Avatar name={contact.name} src={contact.avatar} />
            <div className="min-w-0">
              <p className="text-[12px] text-[#344054] dark:text-slate-200 truncate">{contact.name}</p>
              {contact.jobTitle && <p className="text-[10px] text-[#98A2B3] dark:text-slate-400 truncate">{contact.jobTitle}</p>}
            </div>
          </div>
        ) : (
          <span className="text-[12px] text-[#98A2B3] dark:text-slate-400">—</span>
        )}
      </td>

      <td className="py-3 px-3 text-[13px] font-medium text-[#344054] dark:text-slate-200 tabular-nums">
        {stats.openDealCount || 0}
      </td>

      <td className="py-3 px-3 text-[13px] font-medium text-[#101828] dark:text-slate-100 tabular-nums whitespace-nowrap">
        {formatCurrency(stats.pipelineValue, stats.currency)}
      </td>

      <td className="py-3 px-3 text-[12px] text-[#667085] dark:text-slate-300 whitespace-nowrap">
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
            className="p-1.5 rounded-md text-[#98A2B3] dark:text-slate-400 hover:text-[#344054] dark:hover:text-slate-200 hover:bg-[#F2F4F7] dark:hover:bg-slate-800 transition-opacity"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg shadow-lg z-20 py-1">
                <button type="button" onClick={() => { setMenuOpen(false); onOpen(company._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB] dark:hover:bg-slate-800">View details</button>
                <Link href={`/automation/companies/${company._id}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F9FAFB] dark:hover:bg-slate-800">
                  <ExternalLink className="w-3.5 h-3.5" /> Full page
                </Link>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('archive', company._id); }} className="w-full px-3 py-2 text-left text-[12px] hover:bg-[#F9FAFB] dark:hover:bg-slate-800">Archive</button>
                <button type="button" onClick={() => { setMenuOpen(false); onMenuAction?.('delete', company._id); }} className="w-full px-3 py-2 text-left text-[12px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">Delete</button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default memo(CompanyRow);
