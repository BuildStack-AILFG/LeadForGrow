'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, ExternalLink, Pencil, Trash2, PanelRight } from 'lucide-react';
import DealStageBadge from './DealStageBadge';
import { ownerName, formatValue, formatDate, companyOrContact, dealProbability } from './utils';
import { Td } from '@/app/components/ui/DataTable';
import Avatar from '@/app/components/ui/Avatar';
import Button from '@/app/components/ui/Button';
import DropdownMenu from '@/app/components/ui/DropdownMenu';

/**
 * Deal row (DESIGN_BRIEF §8 tables): 40px, text left / numbers right with
 * tabular figures, owner as 20px avatar + name, stage as a dot chip that is
 * itself the stage picker (native select layered invisibly over the chip),
 * row actions in a ⋯ menu (portal-rendered, never clipped by the table).
 */
function DealRow({ deal, stages, onOpen, onEdit, onDelete, onStageChange }) {
  const router = useRouter();
  const prob = dealProbability(deal, stages);
  const owner = ownerName(deal.assignedTo);

  return (
    <tr className="group/row cursor-pointer [&>td]:border-b [&>td]:border-line [&>td]:bg-canvas hover:[&>td]:bg-subtle" onClick={() => onOpen(deal._id)}>
      <Td className="max-w-[280px]">
        <p className="truncate font-medium text-fg">{deal.title}</p>
        {deal.source && <p className="truncate text-meta capitalize text-fg-tertiary">{deal.source}</p>}
      </Td>
      <Td muted className="max-w-[200px] truncate">{companyOrContact(deal)}</Td>
      <Td onClick={(e) => e.stopPropagation()}>
        <label className="relative inline-flex cursor-pointer">
          <DealStageBadge stage={deal.stage} stages={stages} />
          <select
            aria-label={`Stage for ${deal.title}`}
            value={deal.stage}
            onChange={(e) => onStageChange(deal._id, e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {stages.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </label>
      </Td>
      <Td numeric className="font-medium">{formatValue(deal.amount, deal.currency)}</Td>
      <Td numeric muted>{prob}%</Td>
      <Td muted className="tabular">{formatDate(deal.wonAt || deal.expectedCloseDate)}</Td>
      <Td>
        <span className="inline-flex max-w-[180px] items-center gap-2">
          <Avatar name={owner} size={20} />
          <span className="truncate text-fg-secondary">{owner}</span>
        </span>
      </Td>
      <Td align="right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu
          width={176}
          trigger={(p) => <Button {...p} variant="ghost" size="sm" icon={MoreHorizontal} aria-label={`Actions for ${deal.title}`} />}
          items={[
            { label: 'Open in side panel', icon: PanelRight, onSelect: () => onOpen(deal._id) },
            { label: 'Open full page', icon: ExternalLink, onSelect: () => router.push(`/automation/deals/${deal._id}`) },
            { label: 'Edit', icon: Pencil, onSelect: () => onEdit(deal) },
            { separator: true },
            { label: 'Delete', icon: Trash2, danger: true, onSelect: () => onDelete(deal._id, deal.title) },
          ]}
        />
      </Td>
    </tr>
  );
}

export default memo(DealRow);
