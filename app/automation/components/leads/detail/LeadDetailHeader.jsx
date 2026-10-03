'use client';

import Link from 'next/link';
import { ChevronLeft, Phone, MessageSquare, ArrowRightLeft, XCircle, Trash2, MoreHorizontal } from 'lucide-react';
import StatusBadge from '../StatusBadge';
import LeadScoreBadge from '../LeadScoreBadge';
import WhatsAppIndicator from '../WhatsAppIndicator';
import Button from '@/app/components/ui/Button';
import DropdownMenu from '@/app/components/ui/DropdownMenu';
import cx, { focusRing } from '@/app/components/ui/cx';

/**
 * Lead record header (DESIGN_BRIEF §8 record pages): breadcrumb, name, key
 * status chips; exactly one primary action (Convert, or WhatsApp once
 * converted), Call/WhatsApp secondary, the rest in the ⋯ menu.
 */
export default function LeadDetailHeader({ lead, intelligence, updating, onCall, onWhatsApp, onConvert, onLost, onDelete }) {
  const converted = lead.status === 'converted';

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-line bg-canvas px-4 py-3 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Link href="/automation/leads" className={cx('inline-flex items-center gap-1 rounded-sm text-dense text-fg-tertiary hover:text-fg', focusRing)}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Leads
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="truncate text-page font-semibold text-fg">{lead.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} />
              <WhatsAppIndicator lead={lead} />
              <LeadScoreBadge intelligence={intelligence} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button icon={Phone} onClick={onCall} disabled={updating}>
            Call
          </Button>
          <Button variant={converted ? 'primary' : 'secondary'} icon={MessageSquare} onClick={onWhatsApp}>
            WhatsApp
          </Button>
          {!converted && (
            <Button variant="primary" icon={ArrowRightLeft} onClick={onConvert} disabled={updating} className="hidden sm:inline-flex">
              Convert lead
            </Button>
          )}
          <DropdownMenu
            width={180}
            trigger={(p) => <Button {...p} icon={MoreHorizontal} aria-label="More actions" />}
            items={[
              ...(!converted ? [{ label: 'Convert lead', icon: ArrowRightLeft, onSelect: onConvert, disabled: updating }] : []),
              { label: 'Mark as lost', icon: XCircle, onSelect: onLost, disabled: updating },
              { separator: true },
              { label: 'Delete lead', icon: Trash2, danger: true, onSelect: onDelete },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
