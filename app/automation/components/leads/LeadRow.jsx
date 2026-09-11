'use client';

import { memo, useRef, useState } from 'react';
import { CheckSquare, Square, MessageSquare, Phone, Palette } from 'lucide-react';
import StatusBadge from './StatusBadge';
import FollowupChip from './FollowupChip';
import LeadScoreBadge from './LeadScoreBadge';
import LeadActionsMenu from './LeadActionsMenu';
import LeadColorPicker from './LeadColorPicker';
import { assigneeName, formatRelative, formatSource, formatDate, getLeadRowBackgroundStyle, getStatusRowColor, statusLabel } from './utils';
import { TABLE_COL_LINE, TABLE_ROW_LINE } from './constants';

function LeadRow({
  lead,
  selected,
  onSelect,
  onOpenDrawer,
  onConvert,
  teamMembers,
  onAssign,
  onStatusChange,
  onCall,
  onRowColorChange
}) {
  const message = lead.lastMessagePreview || lead.message || '';
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const paletteRef = useRef(null);
  const rowBg = getLeadRowBackgroundStyle(lead);
  const statusColor = getStatusRowColor(lead.status);

  return (
    <tr
      className={`group ${TABLE_ROW_LINE} cursor-pointer transition-colors ${selected ? 'ring-1 ring-inset ring-[#059669]/40' : ''
        } ${!lead.rowColor && !statusColor ? 'hover:bg-[#FAFBFC]/80 dark:hover:bg-slate-800/30' : ''}`}
      style={rowBg}
      onClick={() => onOpenDrawer(lead._id)}
    >
      <td className={`py-3 pl-3 pr-2 w-10 ${TABLE_COL_LINE}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => onSelect(lead._id)} className="text-[#98A2B3] hover:text-[#059669]">
          {selected ? <CheckSquare className="w-4 h-4 text-[#059669]" /> : <Square className="w-4 h-4" />}
        </button>
      </td>

      {/* Lead Name — left aligned */}
      <td className={`py-3 px-3 min-w-[180px] text-left ${TABLE_COL_LINE}`}>
        <div className="flex items-center gap-2">
          {(lead.rowColor || statusColor) && (
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-slate-300/50"
              style={{ backgroundColor: lead.rowColor || statusColor }}
              title={lead.rowColor ? 'Custom row color' : `${statusLabel(lead.status)} status color`}
            />
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#101828] dark:text-slate-100 truncate">{lead.name}</p>
            {lead.email && <p className="text-[11px] text-[#667085] truncate mt-0.5">{lead.email}</p>}
          </div>
        </div>
      </td>

      <td className={`py-3 px-3 text-center text-[13px] text-[#344054] dark:text-slate-400 tabular-nums whitespace-nowrap ${TABLE_COL_LINE}`}>
        {lead.phone || '—'}
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <span className="inline-flex text-[12px] font-medium text-[#475467] dark:text-slate-400 whitespace-nowrap">
          {formatSource(lead.source)}
        </span>
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <div className="flex justify-center">
          <StatusBadge status={lead.status} size="xs" />
        </div>
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <span className="inline-block text-[12px] font-medium text-[#475467] dark:text-slate-400 truncate max-w-[130px]">
          {assigneeName(lead.assignedTo)}
        </span>
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <span className="inline-flex text-[12px] text-[#667085] dark:text-slate-400 whitespace-nowrap">
          {formatRelative(lead.lastContactedAt || lead.updatedAt)}
        </span>
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <div className="flex justify-center">
          <FollowupChip date={lead.nextFollowUpAt} />
        </div>
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <div className="flex justify-center">
          <LeadScoreBadge intelligence={lead.intelligence} />
        </div>
      </td>

      <td className={`py-3 px-3 text-left ${TABLE_COL_LINE}`}>
        {message ? (
          <span
            className="inline-flex items-center gap-1 text-[12px] text-[#475467] dark:text-slate-400 truncate max-w-[240px]"
            title={message}
          >
            {lead.lastMessageDirection === 'incoming' && (
              <MessageSquare className="w-3 h-3 text-emerald-500 shrink-0" />
            )}
            <span className="truncate">{message}</span>
          </span>
        ) : (
          <span className="text-[12px] text-[#98A2B3]">—</span>
        )}
      </td>

      <td className={`py-3 px-3 text-center ${TABLE_COL_LINE}`}>
        <span className="inline-flex text-[12px] text-[#667085] dark:text-slate-400 whitespace-nowrap tabular-nums">
          {formatDate(lead.receivedAt)}
        </span>
      </td>

      <td className="py-3 px-2 w-28 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-0.5">
          <div className="relative">
            <button
              ref={paletteRef}
              type="button"
              title="Choose row color"
              onClick={() => setColorPickerOpen((v) => !v)}
              className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-[#F2F4F7] dark:hover:bg-slate-800 ${colorPickerOpen || lead.rowColor
                  ? 'text-[#059669] bg-[#EFF8FF]'
                  : 'text-[#667085]'
                }`}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            <LeadColorPicker
              open={colorPickerOpen}
              onClose={() => setColorPickerOpen(false)}
              currentColor={lead.rowColor}
              anchorRef={paletteRef}
              onSelect={(color) => {
                onRowColorChange?.(lead._id, color);
                setColorPickerOpen(false);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => onCall(lead)}
            className="p-1.5 rounded-md text-[#98A2B3] hover:text-[#059669] hover:bg-[#F2F4F7] dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
          <a
            href={`/automation/chat?leadId=${lead._id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md text-[#98A2B3] hover:text-emerald-600 hover:bg-[#F2F4F7] dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </a>
          <LeadActionsMenu
            lead={lead}
            teamMembers={teamMembers}
            onAssign={onAssign}
            onStatusChange={onStatusChange}
            onCall={onCall}
            onOpenDrawer={onOpenDrawer}
            onConvert={onConvert}
          />
        </div>
      </td>
    </tr>
  );
}

export default memo(LeadRow);
