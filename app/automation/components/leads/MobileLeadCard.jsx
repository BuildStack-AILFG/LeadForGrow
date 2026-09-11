'use client';

import StatusBadge from './StatusBadge';
import WhatsAppIndicator from './WhatsAppIndicator';
import FollowupChip from './FollowupChip';
import { assigneeName, formatSource, formatDate, getLeadRowBackgroundStyle } from './utils';

export default function MobileLeadCard({ lead, selected, onSelect, onOpen }) {
  const rowBg = getLeadRowBackgroundStyle(lead);

  return (
    <div
      className={`p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm active:scale-[0.99] transition-transform ${
        selected ? 'ring-2 ring-teal-500/30' : ''
      } ${!rowBg ? 'bg-white dark:bg-slate-900' : ''}`}
      style={rowBg}
      onClick={() => onOpen(lead._id)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(lead._id)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-slate-300"
          />
          <div className="min-w-0">
            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{lead.name}</p>
            <p className="text-xs text-slate-500 tabular-nums">{lead.phone}</p>
          </div>
        </div>
        <StatusBadge status={lead.status} size="xs" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <WhatsAppIndicator lead={lead} />
        <span>·</span>
        <span>{formatSource(lead.source)}</span>
        <span>·</span>
        <span>{assigneeName(lead.assignedTo)}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <FollowupChip date={lead.nextFollowUpAt} />
        <span className="text-[10px] text-slate-400">{formatDate(lead.receivedAt)}</span>
      </div>
    </div>
  );
}
