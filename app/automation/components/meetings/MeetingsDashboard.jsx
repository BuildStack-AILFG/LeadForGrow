'use client';

import Link from 'next/link';
import { Plus, Copy, ExternalLink, Pencil, CalendarDays, Link2, ArrowRight, Check, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import MetricStrip from '@/app/components/ui/MetricStrip';
import EmptyState from '@/app/components/ui/EmptyState';
import cx, { focusRing } from '@/app/components/ui/cx';
import AutoPageIntro from '../shared/tour/AutoPageIntro';

const STATUS_TONE = {
  scheduled: 'info',
  confirmed: 'accent',
  completed: 'success',
  cancelled: 'neutral',
  no_show: 'warning',
  rescheduled: 'info',
};
const STATUS_LABEL = { no_show: 'No-show' };
const statusLabel = (s) => STATUS_LABEL[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const timeOf = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function dayLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(today)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

function groupByDay(bookings) {
  const groups = [];
  for (const b of bookings) {
    const label = dayLabel(b.startTime);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(b);
    else groups.push({ label, items: [b] });
  }
  return groups;
}

const iconBtn = cx('inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-tertiary hover:bg-muted hover:text-fg', focusRing);

function SectionHeader({ title, count, action }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 className="text-body font-semibold text-fg">
        {title}
        {count != null && <span className="ml-1.5 font-normal text-fg-tertiary tabular">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

export default function MeetingsDashboard({ dashboard, onCreate, onEdit, onNoShow, onComplete }) {
  const kpis = dashboard?.kpis || {};
  const upcoming = dashboard?.upcomingBookings || [];
  const awaiting = dashboard?.awaitingOutcome || [];
  const links = dashboard?.bookingLinks || [];

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${slug}`);
    toast.success('Booking link copied');
  };

  const metrics = [
    { label: 'Meetings booked', value: kpis.meetingsBooked ?? 0 },
    { label: 'Upcoming', value: upcoming.length },
    { label: 'Show-up rate', value: `${Math.max(0, 100 - (kpis.noShowRate ?? 0))}%`, note: `${kpis.noShowRate ?? 0}% no-shows` },
    { label: 'Converted to deals', value: `${kpis.conversionRate ?? 0}%` },
  ];

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-page font-semibold text-fg">Meetings</h1>
          <p className="mt-0.5 text-body text-fg-secondary">Share a booking link, then track who is coming and how each meeting went.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/automation/meetings/analytics" tabIndex={-1}>
            <Button variant="ghost">Analytics</Button>
          </Link>
          <Button variant="primary" icon={Plus} onClick={onCreate}>New booking link</Button>
        </div>
      </header>

      <AutoPageIntro />

      <MetricStrip metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {awaiting.length > 0 && (
            <section className="overflow-hidden rounded-lg border border-line bg-canvas">
              <SectionHeader
                title="Awaiting outcome"
                count={awaiting.length}
                action={<span className="hidden text-meta text-fg-tertiary sm:inline">No-shows get a rebook message automatically</span>}
              />
              <ul className="divide-y divide-line">
                {awaiting.map((b) => (
                  <li key={b._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-body font-medium text-fg">{b.guest?.name || 'Guest'}</p>
                      <p className="truncate text-meta text-fg-tertiary">
                        {b.meetingTypeId?.title || 'Meeting'} · {shortDate(b.startTime)}, {timeOf(b.startTime)}
                        {b.assignedTo?.name ? ` · ${b.assignedTo.name}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" icon={Check} onClick={() => onComplete(String(b._id))}>Completed</Button>
                      <Button size="sm" icon={UserX} onClick={() => onNoShow(String(b._id))}>No-show</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-lg border border-line bg-canvas">
            <SectionHeader
              title="Upcoming"
              count={upcoming.length}
              action={
                <Link href="/automation/meetings/team" className={cx('inline-flex items-center gap-1 rounded-sm text-meta font-medium text-accent-fg hover:underline', focusRing)}>
                  Team schedules <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarDays}
                title="No upcoming meetings"
                description={links.length ? 'Share one of your booking links and new bookings will show up here.' : 'Create a booking link, share it with customers, and their bookings will show up here.'}
                action={!links.length && <Button variant="primary" icon={Plus} onClick={onCreate}>New booking link</Button>}
              />
            ) : (
              groupByDay(upcoming).map((g) => (
                <div key={g.label}>
                  <p className="border-b border-line bg-subtle px-4 py-1.5 text-meta font-medium text-fg-secondary">{g.label}</p>
                  <ul className="divide-y divide-line">
                    {g.items.map((b) => (
                      <li key={b._id} className="group/row flex items-center gap-4 px-4 py-3 hover:bg-subtle">
                        <span className="w-[68px] shrink-0 text-dense font-medium text-fg tabular">{timeOf(b.startTime)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body font-medium text-fg">{b.guest?.name || 'Guest'}</p>
                          <p className="truncate text-meta text-fg-tertiary">
                            {b.meetingTypeId?.title || 'Meeting'}
                            {b.meetingTypeId?.durationMinutes ? ` · ${b.meetingTypeId.durationMinutes} min` : ''}
                            {b.assignedTo?.name ? ` · with ${b.assignedTo.name}` : ''}
                          </p>
                        </div>
                        <Badge tone={STATUS_TONE[b.status] || 'neutral'}>{statusLabel(b.status)}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="overflow-hidden rounded-lg border border-line bg-canvas">
            <SectionHeader
              title="Booking links"
              count={links.length}
              action={
                <Link href="/automation/meetings/templates" className={cx('rounded-sm text-meta font-medium text-accent-fg hover:underline', focusRing)}>
                  Templates
                </Link>
              }
            />
            {links.length === 0 ? (
              <EmptyState
                compact
                icon={Link2}
                title="No booking links yet"
                description="A booking link lets customers pick a free slot themselves."
              />
            ) : (
              <ul className="divide-y divide-line">
                {links.map((m) => (
                  <li key={m._id} className="flex items-center gap-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-fg">{m.title}</p>
                      <p className="truncate text-meta text-fg-tertiary">
                        /book/{m.bookingSlug}
                        {m.durationMinutes ? ` · ${m.durationMinutes} min` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => copyLink(m.bookingSlug)} className={iconBtn} title="Copy link" aria-label={`Copy link for ${m.title}`}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <a href={`/book/${m.bookingSlug}`} target="_blank" rel="noreferrer" className={iconBtn} title="Open booking page" aria-label={`Open booking page for ${m.title}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(m)} className={iconBtn} title="Edit settings & reminders" aria-label={`Edit ${m.title}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Link
            href="/automation/settings/integrations"
            className={cx('flex items-center justify-between rounded-lg border border-line bg-canvas px-4 py-3 text-body text-fg-secondary hover:bg-subtle', focusRing)}
          >
            Calendar & video integrations
            <ArrowRight className="h-4 w-4 text-fg-tertiary" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
