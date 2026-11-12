/**
 * Business hours utilities for workflow delays and execution windows.
 */

import { zonedParts, zonedTimeToDate } from '../dates/localDateTime.js';

const DAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export function getAutomationSettings(business) {
  const settings = business?.settings?.automation || {};
  return {
    timezone: settings.timezone || business?.settings?.timezone || 'Asia/Kolkata',
    businessHours: settings.businessHours || {
      start: '09:00',
      end: '18:00',
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    },
    workingDaysOnly: settings.workingDaysOnly !== false,
    maxExecutionsPerHour: settings.maxExecutionsPerHour || 500,
    retryPolicy: settings.retryPolicy || { maxRetries: 3, backoffMs: 5000 },
  };
}

// Business hours are wall-clock times in the business timezone. The server runs in UTC,
// so getHours()/setHours() would read "09:00" as 09:00 UTC (14:30 IST).
export function isWithinBusinessHours(business, date = new Date()) {
  const { businessHours, timezone } = getAutomationSettings(business);
  const local = zonedParts(date, timezone);
  const allowedDays = (businessHours.days || []).map((d) => DAY_MAP[d] ?? -1);
  if (allowedDays.length && !allowedDays.includes(local.weekday)) return false;

  const [startH, startM] = (businessHours.start || '09:00').split(':').map(Number);
  const [endH, endM] = (businessHours.end || '18:00').split(':').map(Number);
  const mins = local.hour * 60 + local.minute;
  const startMins = startH * 60 + (startM || 0);
  const endMins = endH * 60 + (endM || 0);
  return mins >= startMins && mins < endMins;
}

export function msUntilNextBusinessWindow(business, from = new Date()) {
  const { businessHours, timezone } = getAutomationSettings(business);
  const allowedDays = (businessHours.days || ['mon', 'tue', 'wed', 'thu', 'fri']).map((d) => DAY_MAP[d]);
  const [startH, startM] = (businessHours.start || '09:00').split(':').map(Number);

  const today = zonedParts(from, timezone);
  for (let i = 0; i < 8; i++) {
    const cal = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    if (allowedDays.includes(cal.getUTCDay())) {
      const windowStart = zonedTimeToDate(cal.getUTCFullYear(), cal.getUTCMonth() + 1, cal.getUTCDate(), startH, startM || 0, timezone);
      if (windowStart > from) return windowStart.getTime() - from.getTime();
      if (isWithinBusinessHours(business, from)) return 0;
    }
  }
  return 3600000;
}

export function adjustDelayForBusinessHours(business, delayMs) {
  if (!getAutomationSettings(business).workingDaysOnly) return delayMs;
  const target = new Date(Date.now() + delayMs);
  if (isWithinBusinessHours(business, target)) return delayMs;
  return delayMs + msUntilNextBusinessWindow(business, target);
}
