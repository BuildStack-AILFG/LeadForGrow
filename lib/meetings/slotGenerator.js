/**
 * Generate available booking slots for a meeting type.
 *
 * Working hours ("09:00"–"18:00") are wall-clock times in the meeting's timezone
 * (availabilityRules.timezone, default Asia/Kolkata). The server runs in UTC, so slots are
 * built with explicit timezone maths instead of Date#setHours (which used UTC and shifted
 * every slot by +5:30 for IST).
 */
import { zonedParts, zonedTimeToDate, formatInTimeZone, DEFAULT_TIMEZONE } from '../dates/localDateTime.js';

function parseTime(timeStr) {
  const [h, m] = (timeStr || '09:00').split(':').map(Number);
  return { hours: h, minutes: m || 0 };
}

/** ISO weekday (Mon = 1 … Sun = 7) from a 0 = Sunday weekday. */
function isoWeekday(d) {
  return d === 0 ? 7 : d;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function generateAvailableSlots({
  meetingType,
  existingBookings = [],
  fromDate = new Date(),
  daysAhead = 14,
  hostAvailability = null,
}) {
  const rules = meetingType.availabilityRules || {};
  const duration = meetingType.durationMinutes || 30;
  const bufferBefore = rules.bufferBeforeMinutes || 0;
  const bufferAfter = rules.bufferAfterMinutes || 15;
  const minNoticeMs = (rules.minNoticeHours ?? 2) * 60 * 60 * 1000;
  const workingDays = rules.workingDays || [1, 2, 3, 4, 5];
  const { hours: startH, minutes: startM } = parseTime(rules.startTime || '09:00');
  const { hours: endH, minutes: endM } = parseTime(rules.endTime || '18:00');
  const maxDays = Math.min(daysAhead, rules.maxDaysAhead || 30);
  const now = new Date();
  const earliest = new Date(now.getTime() + minNoticeMs);

  const tz = rules.timezone || meetingType.timezone || DEFAULT_TIMEZONE;

  const slots = [];
  const first = zonedParts(fromDate, tz); // today's date in the meeting's timezone

  for (let day = 0; day < maxDays; day++) {
    // Calendar date `day` days after today (UTC date maths on plain y/m/d avoids DST issues).
    const cal = new Date(Date.UTC(first.year, first.month - 1, first.day + day));
    const y = cal.getUTCFullYear();
    const m = cal.getUTCMonth() + 1;
    const d = cal.getUTCDate();

    if (!workingDays.includes(isoWeekday(cal.getUTCDay()))) continue;

    let slotStart = zonedTimeToDate(y, m, d, startH, startM, tz);
    const dayEnd = zonedTimeToDate(y, m, d, endH, endM, tz);

    let dailyCount = 0;
    const dailyLimit = rules.dailyLimit || 0;

    while (slotStart.getTime() + duration * 60000 <= dayEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      const bufferedStart = new Date(slotStart.getTime() - bufferBefore * 60000);
      const bufferedEnd = new Date(slotEnd.getTime() + bufferAfter * 60000);

      if (slotStart >= earliest) {
        const conflict = existingBookings.some((b) => {
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          return overlaps(bufferedStart, bufferedEnd, bStart, bEnd);
        });

        const hostBlocked =
          hostAvailability?.blockedSlots?.some((block) => {
            const bs = new Date(block.start);
            const be = new Date(block.end);
            return overlaps(slotStart, slotEnd, bs, be);
          }) ?? false;

        if (!conflict && !hostBlocked) {
          if (dailyLimit === 0 || dailyCount < dailyLimit) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              label: formatSlotLabel(slotStart, tz),
            });
            dailyCount++;
          }
        }
      }

      slotStart = new Date(slotStart.getTime() + (duration + bufferAfter) * 60000);
    }
  }

  return slots;
}

function formatSlotLabel(date, tz = DEFAULT_TIMEZONE) {
  return formatInTimeZone(date, tz, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function isSlotAvailable(slotStart, slotEnd, existingBookings, bufferMinutes = 15) {
  const bufferedEnd = new Date(new Date(slotEnd).getTime() + bufferMinutes * 60000);
  const bufferedStart = new Date(new Date(slotStart).getTime() - bufferMinutes * 60000);
  return !existingBookings.some((b) =>
    overlaps(bufferedStart, bufferedEnd, new Date(b.startTime), new Date(b.endTime))
  );
}
