'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight } from 'lucide-react';
import PremiumCard from './PremiumCard';
import WidgetMenu from './WidgetMenu';

const AVATAR_COLORS = ['#1A1D1F', '#3B82F6', '#6366F1', '#0EA5E9', '#8B5CF6', '#64748B', '#0F766E'];

function formatTimeRange(start, end) {
  const fmt = (d) => {
    const t = new Date(d).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return t.toLowerCase().replace(':', '.').replace(/\s?(am|pm)/, ' $1');
  };
  return `${fmt(start)} - ${fmt(end)}`;
}

function hourLabel(hour) {
  if (hour === 0) return '12 am';
  if (hour === 12) return '12 pm';
  if (hour < 12) return `${hour} am`;
  return `${hour - 12} pm`;
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'M';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function AvatarStack({ guest, extra = 0 }) {
  const name = guest?.name || 'Guest';
  const people = [
    { name, color: AVATAR_COLORS[0] },
    { name: guest?.company || 'Team', color: AVATAR_COLORS[1] },
    { name: 'Host', color: AVATAR_COLORS[2] },
  ];
  const shown = people.slice(0, 3);
  const more = Math.max(extra, 0);

  return (
    <div className="flex items-center mt-2.5">
      <div className="flex -space-x-2">
        {shown.map((p, i) => (
          <span
            key={`${p.name}-${i}`}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-medium text-white ring-2 ring-white"
            style={{ backgroundColor: p.color }}
            title={p.name}
          >
            {initials(p.name)}
          </span>
        ))}
        {more > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-medium text-[#667085] bg-[#F2F4F7] ring-2 ring-white">
            +{more}
          </span>
        )}
      </div>
    </div>
  );
}

function MeetingEventCard({ meeting }) {
  const platformLabel = meeting.platform ? `On ${meeting.platform}` : null;

  return (
    <div className="flex-1 min-w-0 rounded-none border border-[#E8ECEF] bg-white px-3.5 py-3 transition-colors hover:border-[#D0D5DD]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#101828] truncate leading-tight">
            {meeting.title}
          </p>
          <p className="text-[12px] font-normal text-[#98A2B3] tabular-nums mt-1">
            {formatTimeRange(meeting.startTime, meeting.endTime)}
          </p>
          <AvatarStack guest={meeting.guest} extra={meeting._id ? 2 + (String(meeting._id).charCodeAt(18) % 6) : 2} />
        </div>

        {platformLabel && (
          meeting.meetingLink ? (
            <a
              href={meeting.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-medium text-[#344054] bg-white border border-[#E5E7EB] rounded-none hover:bg-[#F9FAFB] transition-colors"
            >
              {platformLabel}
              <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3]" strokeWidth={2} />
            </a>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 text-[11px] font-medium text-[#344054] bg-white border border-[#E5E7EB] rounded-none">
              {platformLabel}
              <ChevronRight className="w-3.5 h-3.5 text-[#98A2B3]" strokeWidth={2} />
            </span>
          )
        )}
      </div>
    </div>
  );
}

function AvailableSlotCard({ start, end }) {
  return (
    <div className="flex-1 min-w-0 rounded-none border border-[#E8ECEF] bg-white px-3.5 py-3">
      <p className="text-[13px] font-medium text-[#101828] leading-tight">Available Time</p>
      <p className="text-[12px] font-normal text-[#98A2B3] tabular-nums mt-1">
        {formatTimeRange(start, end)}
      </p>
    </div>
  );
}

function buildTimelineRows(meetings) {
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );

  if (!sorted.length) {
    const base = new Date();
    base.setHours(9, 0, 0, 0);
    return [
      {
        key: 'empty-9',
        hour: 9,
        hourLabel: hourLabel(9),
        type: 'available',
        start: base,
        end: new Date(base.getTime() + 60 * 60000),
      },
      {
        key: 'empty-10',
        hour: 10,
        hourLabel: hourLabel(10),
        type: 'available',
        start: new Date(base.getTime() + 60 * 60000),
        end: new Date(base.getTime() + 100 * 60000),
      },
      {
        key: 'empty-11',
        hour: 11,
        hourLabel: hourLabel(11),
        type: 'available',
        start: new Date(base.getTime() + 120 * 60000),
        end: new Date(base.getTime() + 180 * 60000),
      },
    ];
  }

  const rows = [];
  const dayStart = new Date(sorted[0].startTime);
  dayStart.setHours(Math.min(9, new Date(sorted[0].startTime).getHours()), 0, 0, 0);

  // Leading available gap before first meeting
  const firstStart = new Date(sorted[0].startTime);
  if (firstStart - dayStart >= 20 * 60000) {
    rows.push({
      key: 'avail-start',
      hour: dayStart.getHours(),
      hourLabel: hourLabel(dayStart.getHours()),
      type: 'available',
      start: dayStart,
      end: firstStart,
    });
  }

  sorted.forEach((meeting, i) => {
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    rows.push({
      key: String(meeting._id || i),
      hour: start.getHours(),
      hourLabel: hourLabel(start.getHours()),
      type: 'meeting',
      meeting,
      start,
      end,
    });

    const next = sorted[i + 1];
    if (next) {
      const nextStart = new Date(next.startTime);
      const gapMs = nextStart - end;
      if (gapMs >= 15 * 60000) {
        rows.push({
          key: `avail-${i}`,
          hour: end.getHours(),
          hourLabel: hourLabel(end.getHours()),
          type: 'available',
          start: end,
          end: nextStart,
        });
      }
    }
  });

  return rows;
}

export default function CalendarScheduleCard({ calendar, onRefresh }) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(
    calendar?.days?.find((d) => d.isToday)?.date || todayIso
  );
  const [collapsed, setCollapsed] = useState(false);

  const monthLabel = useMemo(() => {
    if (!calendar) return '';
    const d = new Date(calendar.year, calendar.month, 1);
    return d.toLocaleString('en-US', { month: 'long' });
  }, [calendar]);

  const week = useMemo(() => {
    const days = calendar?.days || [];
    if (!days.length) return [];
    const todayIdx = days.findIndex((d) => d.isToday);
    const anchor = todayIdx >= 0 ? todayIdx : 0;
    const start = Math.max(0, Math.min(anchor - 3, days.length - 7));
    return days.slice(start, start + 7);
  }, [calendar]);

  const dayMeetings = calendar?.meetingsByDate?.[selectedDate] || [];
  const timelineRows = useMemo(() => buildTimelineRows(dayMeetings), [dayMeetings]);

  return (
    <PremiumCard padding="p-0" className="h-full min-h-0 flex flex-col overflow-hidden">
      {/* Header — fixed */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-4 shrink-0">
        <h2 className="text-[16px] font-semibold text-[#101828] tracking-[-0.02em]">Calendar</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium text-[#344054] bg-white border border-[#E5E7EB] rounded-none hover:bg-[#F9FAFB] transition-colors"
          >
            {monthLabel}
            <ChevronDown className="w-3.5 h-3.5 text-[#98A2B3]" strokeWidth={2} />
          </button>
          <WidgetMenu
            onRefresh={onRefresh}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            collapsed={collapsed}
          />
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Week strip — fixed */}
          <div className="px-5 shrink-0">
            <div className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const isSelected = day.date === selectedDate;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className="relative flex flex-col items-center py-1.5 transition-colors"
                  >
                    <span
                      className={`text-[12px] font-normal ${
                        isSelected ? 'text-[#101828]' : 'text-[#98A2B3]'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`text-[14px] mt-1 tabular-nums leading-none ${
                        isSelected
                          ? 'font-semibold text-[#101828]'
                          : 'font-medium text-[#667085]'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {isSelected && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#101828]" />
                    )}
                    {!isSelected && day.meetingCount > 0 && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#98A2B3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 mx-5 border-t border-[#E8ECEF] shrink-0" />

          {/* Schedule only — scrolls when content overflows card height */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar px-5 py-4">
            <div className="space-y-3.5">
              {timelineRows.map((row) => (
                <div key={row.key} className="flex gap-3 items-start">
                  <span className="w-11 shrink-0 pt-3 text-[12px] font-normal text-[#98A2B3] tabular-nums text-right">
                    {row.hourLabel}
                  </span>
                  {row.type === 'meeting' ? (
                    <MeetingEventCard meeting={row.meeting} />
                  ) : (
                    <AvailableSlotCard start={row.start} end={row.end} />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-1 pb-1">
              <Link
                href="/automation/meetings"
                className="text-[12px] font-medium text-[#667085] hover:text-[#101828] transition-colors"
              >
                View all meetings →
              </Link>
            </div>
          </div>
        </>
      )}
    </PremiumCard>
  );
}
