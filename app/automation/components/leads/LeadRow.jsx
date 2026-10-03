'use client';

import { memo, useRef, useState } from 'react';
import { MessageSquare, Phone, Palette } from 'lucide-react';
import StatusBadge from './StatusBadge';
import LeadScoreBadge from './LeadScoreBadge';
import LeadActionsMenu from './LeadActionsMenu';
import LeadColorPicker from './LeadColorPicker';
import { WhatsAppIcon } from '@/app/automation/components/chat/BrandIcons';
import { hasWhatsAppHistory } from '@/lib/whatsapp/waPhone';
import { assigneeName, formatRelative, formatSource, formatDate, getLeadRowBackgroundStyle, getLeadStickyCellStyle, getStatusRowColor, statusLabel } from './utils';
import { Td } from '@/app/components/ui/DataTable';
import Checkbox from '@/app/components/ui/Checkbox';
import Avatar from '@/app/components/ui/Avatar';
import cx, { focusRing } from '@/app/components/ui/cx';

const actionBtn = cx('inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-tertiary hover:bg-muted hover:text-fg', focusRing);

function LeadRow({ lead, selected, onSelect, onOpenDrawer, onConvert, teamMembers, onAssign, onStatusChange, onCall, onSendTemplate, onRowColorChange }) {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const paletteRef = useRef(null);
  // User-chosen row colours are a real feature — keep them as the row's background.
  const rowBg = getLeadRowBackgroundStyle(lead);
  const statusColor = getStatusRowColor(lead.status);
  const owner = assigneeName(lead.assignedTo);
  const tinted = !!(lead.rowColor || statusColor);

  return (
    <tr
      className={cx(
        'group/row cursor-pointer [&>td]:border-b [&>td]:border-line',
        selected ? '[&>td]:bg-accent-subtle' : !tinted && '[&>td]:bg-canvas hover:[&>td]:bg-subtle'
      )}
      style={rowBg}
      onClick={() => onOpenDrawer(lead._id)}
      aria-selected={selected || undefined}
    >
      <Td className="!pr-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox aria-label={`Select ${lead.name}`} checked={selected} onChange={() => onSelect(lead._id)} />
      </Td>

      <Td sticky className="max-w-[260px]" style={tinted && !selected ? getLeadStickyCellStyle(lead) : undefined}>
        <div className="flex items-center gap-2">
          {tinted && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: lead.rowColor || statusColor }}
              title={lead.rowColor ? 'Custom row colour' : `${statusLabel(lead.status)} status colour`}
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{lead.name}</p>
            {lead.email && <p className="truncate text-meta text-fg-tertiary">{lead.email}</p>}
          </div>
        </div>
      </Td>

      <Td muted className="tabular">{lead.phone || '—'}</Td>
      <Td muted>{formatSource(lead.source)}</Td>
      <Td>
        <StatusBadge status={lead.status} size="xs" />
      </Td>
      <Td>
        {owner && owner !== 'Unassigned' ? (
          <span className="inline-flex max-w-[160px] items-center gap-2">
            <Avatar name={owner} size={20} />
            <span className="truncate text-fg-secondary">{owner}</span>
          </span>
        ) : (
          <span className="text-fg-tertiary">Unassigned</span>
        )}
      </Td>
      <Td muted>{formatRelative(lead.lastContactedAt || lead.updatedAt)}</Td>
      <Td align="right">
        <div className="flex justify-end">
          <LeadScoreBadge intelligence={lead.intelligence} />
        </div>
      </Td>
      <Td muted className="tabular">{formatDate(lead.receivedAt)}</Td>

      <Td align="right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          <div className="relative">
            <button
              ref={paletteRef}
              type="button"
              aria-label="Choose row colour"
              title="Row colour"
              onClick={() => setColorPickerOpen((v) => !v)}
              className={cx(actionBtn, (colorPickerOpen || lead.rowColor) && 'text-accent-fg')}
            >
              <Palette className="h-4 w-4" strokeWidth={1.5} />
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
          <button type="button" aria-label={`Call ${lead.name}`} title="Call" onClick={() => onCall(lead)} className={actionBtn}>
            <Phone className="h-4 w-4" strokeWidth={1.5} />
          </button>
          {lead.phone && !hasWhatsAppHistory(lead) && onSendTemplate ? (
            // Never messaged on WhatsApp: no Inbox conversation exists yet, and only an approved template may start one.
            <button type="button" aria-label={`Send a WhatsApp template to ${lead.name}`} title="Send a WhatsApp template" onClick={() => onSendTemplate(lead)} className={actionBtn}>
              <WhatsAppIcon colored className="h-4 w-4" />
            </button>
          ) : (
            <a href={`/automation/chat?leadId=${lead._id}`} aria-label={`Message ${lead.name}`} title={lead.phone ? 'Open the WhatsApp chat' : 'Open the conversation'} onClick={(e) => e.stopPropagation()} className={actionBtn}>
              {lead.phone ? <WhatsAppIcon colored className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" strokeWidth={1.5} />}
            </a>
          )}
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
      </Td>
    </tr>
  );
}

export default memo(LeadRow);
