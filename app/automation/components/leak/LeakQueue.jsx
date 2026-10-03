'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, MoreHorizontal, ListChecks, UserPlus, PhoneCall, Clock, UserX, ThumbsDown, CheckCircle2, BellOff } from 'lucide-react';
import { RULES, formatDuration } from '@/lib/leak/rules';
import { TemplateDialog, ReasonDialog, ReassignDialog } from './LeakDialogs';
import { TableFrame, Table, THead, Th, Td } from '@/app/components/ui/DataTable';
import { TableSkeleton } from '@/app/components/ui/Skeleton';
import EmptyState from '@/app/components/ui/EmptyState';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Select from '@/app/components/ui/Select';
import Avatar from '@/app/components/ui/Avatar';
import DropdownMenu from '@/app/components/ui/DropdownMenu';
import cx, { focusRing } from '@/app/components/ui/cx';

const SEVERITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral' };
const RULE_ORDER = ['all', 'R2', 'R1', 'R3', 'R5', 'R4'];

export const ago = (d) => (d ? formatDuration((Date.now() - new Date(d).getTime()) / 60000) : '');

/**
 * Leak queue — one table row per slipping lead (DESIGN_BRIEF §8 tables):
 * lead + why it's slipping · issue chips · owner · source/stage · waiting
 * time · row actions. Rule filters are a compact chip row with counts.
 */
export default function LeakQueue({ lr, mode }) {
  const [dialog, setDialog] = useState(null); // { kind, flag }
  const counts = lr.counts || {};

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Filter by issue" className="flex flex-wrap items-center gap-1.5">
          {RULE_ORDER.map((r) => {
            const selected = lr.rule === r;
            const n = r === 'all' ? counts.all || 0 : counts[r] || 0;
            return (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => lr.changeRule(r)}
                className={cx(
                  'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-dense font-medium transition-colors',
                  selected ? 'border-accent bg-accent-subtle text-accent-fg' : 'border-line bg-canvas text-fg-secondary hover:border-line-strong hover:text-fg',
                  focusRing
                )}
              >
                {r === 'all' ? 'All' : RULES[r].label}
                <span className={cx('tabular text-meta', selected ? 'text-accent-fg' : 'text-fg-tertiary')}>{n}</span>
              </button>
            );
          })}
        </div>
        {mode === 'radar' && <AssigneeFilter lr={lr} />}
      </div>

      {lr.listLoading && !lr.flags.length ? (
        <TableSkeleton rows={6} columns={5} />
      ) : lr.flags.length === 0 ? (
        <div className="rounded-lg border border-line">
          <EmptyState
            icon={CheckCircle2}
            title={lr.rule !== 'all' ? 'Nothing here for this filter.' : mode === 'mine' ? 'Nothing is slipping on your leads.' : 'No enquiries are slipping right now.'}
            description="New leaks appear here within 15 minutes."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line">
          <TableFrame>
            <Table className="min-w-[960px]">
              <THead>
                <tr>
                  <Th>Lead</Th>
                  <Th>Issue</Th>
                  {mode === 'radar' && <Th>Owner</Th>}
                  <Th>Source</Th>
                  <Th align="right">Waiting</Th>
                  <Th align="right"><span className="sr-only">Actions</span></Th>
                </tr>
              </THead>
              <tbody>
                {lr.flags.map((f) => (
                  <LeakRow key={f.leadId} flag={f} mode={mode} busy={!!lr.busy[f.leadId]} lr={lr} onDialog={(kind) => setDialog({ kind, flag: f })} />
                ))}
              </tbody>
            </Table>
          </TableFrame>
        </div>
      )}

      {dialog?.kind === 'template' && (
        <TemplateDialog flag={dialog.flag} onClose={() => setDialog(null)} onSend={(t) => lr.sendTemplate(dialog.flag, t)} />
      )}
      {dialog?.kind === 'reassign' && (
        <ReassignDialog flag={dialog.flag} loadTeam={lr.ensureTeam} onClose={() => setDialog(null)} onPick={(m) => lr.reassign(dialog.flag, m)} />
      )}
      {['outside', 'snooze', 'unqualified', 'dismiss'].includes(dialog?.kind) && (
        <ReasonDialog
          kind={dialog.kind}
          flag={dialog.flag}
          onClose={() => setDialog(null)}
          onSubmit={({ note, hours }) => {
            const f = dialog.flag;
            if (dialog.kind === 'outside') return lr.workedOutside(f, note);
            if (dialog.kind === 'snooze') return lr.snooze(f, hours, note);
            if (dialog.kind === 'unqualified') return lr.markUnqualified(f, note);
            return lr.dismiss(f, note);
          }}
        />
      )}
    </div>
  );
}

function AssigneeFilter({ lr }) {
  const [members, setMembers] = useState([]);
  useEffect(() => { lr.ensureTeam().then(setMembers).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="ml-auto w-48">
      <Select size="sm" aria-label="Filter by salesperson" value={lr.assignee} onChange={(e) => lr.changeAssignee(e.target.value)}>
        <option value="all">Everyone</option>
        <option value="unassigned">Unassigned</option>
        {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </Select>
    </div>
  );
}

function LeakRow({ flag, mode, busy, lr, onDialog }) {
  const canTemplate = !flag.lead.optedOutOfWhatsApp && Boolean(flag.lead.phone);
  const top = flag.flags[0]; // most urgent first
  const since = top.evidence?.awaitingReplySince || top.evidence?.createdAt || flag.detectedAt;
  const owner = flag.assignedTo?.name;
  const urgent = top.severity === 'high';

  return (
    <tr className="group/row [&>td]:border-b [&>td]:border-line [&>td]:bg-canvas hover:[&>td]:bg-subtle">
      <Td className="max-w-[340px] whitespace-normal py-2.5">
        <Link href={`/automation/leads/${flag.leadId}`} className={cx('rounded-sm font-medium text-fg hover:text-accent-fg', focusRing)}>
          {flag.lead.name || 'Unnamed lead'}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-dense text-fg-secondary">{top.reason}</p>
        {flag.flags.length > 1 && <p className="mt-0.5 text-meta text-fg-tertiary">+{flag.flags.length - 1} more issue{flag.flags.length > 2 ? 's' : ''}</p>}
      </Td>
      <Td className="whitespace-normal py-2.5">
        <div className="flex max-w-[260px] flex-wrap gap-1">
          {flag.flags.map((f) => (
            <Badge key={f.id} tone={SEVERITY_TONE[f.severity] || 'neutral'} dot>
              {RULES[f.rule]?.label}
            </Badge>
          ))}
          {flag.inProgress && <Badge tone="accent" dot>In progress</Badge>}
          {flag.lead.optedOutOfWhatsApp && (
            <Badge tone="neutral">
              <BellOff className="mr-1 inline h-3 w-3" strokeWidth={1.75} />
              Opted out
            </Badge>
          )}
        </div>
      </Td>
      {mode === 'radar' && (
        <Td>
          {owner ? (
            <span className="inline-flex max-w-[160px] items-center gap-2">
              <Avatar name={owner} size={20} />
              <span className="truncate text-fg-secondary">{owner}</span>
            </span>
          ) : (
            <span className="text-fg-tertiary">Unassigned</span>
          )}
        </Td>
      )}
      <Td muted className="max-w-[180px]">
        <span className="block truncate capitalize">{flag.lead.source || '—'}</span>
        {flag.lead.stage && <span className="block truncate text-meta text-fg-tertiary">{flag.lead.stage}</span>}
      </Td>
      <Td numeric className={cx(urgent ? 'font-medium text-danger' : 'text-fg-secondary')}>
        <span title={new Date(since).toLocaleString('en-IN')}>{ago(since)}</span>
      </Td>
      <Td align="right">
        <div className="flex items-center justify-end gap-1">
          {canTemplate && (
            <Button size="sm" icon={Send} loading={busy} onClick={() => onDialog('template')}>
              Template
            </Button>
          )}
          <Link href={`/automation/chat?leadId=${flag.leadId}`} tabIndex={-1}>
            <Button size="sm" variant={canTemplate ? 'ghost' : 'secondary'} icon={MessageCircle}>
              Reply
            </Button>
          </Link>
          <Button size="sm" variant="ghost" icon={ListChecks} aria-label="Create follow-up task" title="Follow-up task" disabled={busy} onClick={() => lr.createTask(flag)} />
          <DropdownMenu
            width={208}
            trigger={(p) => <Button {...p} size="sm" variant="ghost" icon={MoreHorizontal} aria-label="More actions" disabled={busy} />}
            items={[
              { label: 'Worked outside CRM', icon: PhoneCall, onSelect: () => onDialog('outside') },
              ...(mode === 'radar' ? [{ label: 'Give to someone else', icon: UserPlus, onSelect: () => onDialog('reassign') }] : []),
              { label: 'Snooze', icon: Clock, onSelect: () => onDialog('snooze') },
              { separator: true },
              { label: 'Mark unqualified', icon: UserX, onSelect: () => onDialog('unqualified') },
              { label: 'Not a leak', icon: ThumbsDown, onSelect: () => onDialog('dismiss') },
            ]}
          />
        </div>
      </Td>
    </tr>
  );
}
