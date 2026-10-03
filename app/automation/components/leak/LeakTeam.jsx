'use client';

import { Users } from 'lucide-react';
import { formatDuration } from '@/lib/leak/rules';
import MetricStrip from '@/app/components/ui/MetricStrip';
import { TableFrame, Table, THead, Th, Td } from '@/app/components/ui/DataTable';
import EmptyState from '@/app/components/ui/EmptyState';
import Avatar from '@/app/components/ui/Avatar';
import Button from '@/app/components/ui/Button';

/**
 * Per salesperson: what's open now and how their enquiries went over the scan
 * window. Numbers sit next to how many leads each person had, so a busy rep
 * isn't compared unfairly with a quiet one.
 */
export default function LeakTeam({ summary, onOpenQueue }) {
  const team = summary?.team || [];
  const scan = summary?.scan || {};
  return (
    <div className="space-y-4">
      <MetricStrip
        metrics={[
          { label: 'Enquiries (90 days)', value: scan.enquiries ?? '—' },
          { label: 'Slipped', value: scan.leakPct != null ? `${scan.leakPct}%` : '—' },
          { label: 'First reply, typical', value: scan.firstReplyMedianMin != null ? formatDuration(scan.firstReplyMedianMin) : '—', note: 'Business hours' },
          { label: 'Replied within target', value: scan.withinSlaPct != null ? `${scan.withinSlaPct}%` : '—' },
        ]}
      />

      <div className="overflow-hidden rounded-lg border border-line">
        {team.length === 0 ? (
          <EmptyState compact icon={Users} title="No team numbers yet." description="They appear after the first scan." />
        ) : (
          <TableFrame>
            <Table className="min-w-[640px]">
              <THead>
                <tr>
                  <Th>Salesperson</Th>
                  <Th align="right">Open now</Th>
                  <Th align="right">Leads (90 days)</Th>
                  <Th align="right">Slipped</Th>
                  <Th align="right">First reply</Th>
                  <Th align="right"><span className="sr-only">Queue</span></Th>
                </tr>
              </THead>
              <tbody>
                {team.map((t) => (
                  <tr key={t.ownerId || 'unassigned'} className="[&>td]:border-b [&>td]:border-line [&>td]:bg-canvas hover:[&>td]:bg-subtle">
                    <Td>
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={t.name} size={24} />
                        <span className="font-medium text-fg">{t.name}</span>
                      </span>
                    </Td>
                    <Td numeric className={t.openNow ? 'font-medium text-danger' : 'text-fg-tertiary'}>{t.openNow}</Td>
                    <Td numeric muted>{t.leads}</Td>
                    <Td numeric muted>{t.leakPct != null ? `${t.leakPct}%` : '—'}</Td>
                    <Td numeric muted>{t.firstReplyMedianMin != null ? formatDuration(t.firstReplyMedianMin) : '—'}</Td>
                    <Td align="right">
                      {t.openNow > 0 && (
                        <Button size="sm" variant="ghost" onClick={() => onOpenQueue(t.ownerId || 'unassigned')}>
                          Open queue
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableFrame>
        )}
      </div>
      <p className="text-meta text-fg-tertiary">Leave and availability aren’t tracked yet, so check before reading a high number as a problem.</p>
    </div>
  );
}
