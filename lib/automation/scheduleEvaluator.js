/**
 * Recurring schedule evaluation for workflow triggers.
 */
import { zonedParts, DEFAULT_TIMEZONE } from '../dates/localDateTime.js';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseTime(timeStr = '09:00') {
  const [h, m] = String(timeStr).split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

/** Simple cron-like check: minute hour dom month dow */
function matchesCronField(field, value) {
  if (field === '*') return true;
  if (field.startsWith('*/')) {
    const step = Number(field.slice(2));
    return step > 0 && value % step === 0;
  }
  if (field.includes(',')) return field.split(',').map(Number).includes(value);
  if (field.includes('-')) {
    const [a, b] = field.split('-').map(Number);
    return value >= a && value <= b;
  }
  return Number(field) === value;
}

/**
 * Wall clock of `date` in a timezone, with the same getters as Date. The server runs in UTC,
 * so plain getHours()/getDay() would run "09:00" schedules at 09:00 UTC (14:30 IST).
 */
function wallClock(date, tz) {
  const p = zonedParts(date, tz || DEFAULT_TIMEZONE);
  return {
    getMinutes: () => p.minute,
    getHours: () => p.hour,
    getDate: () => p.day,
    getMonth: () => p.month - 1,
    getDay: () => p.weekday,
  };
}

export function matchesCronExpression(expr, date = new Date(), tz = DEFAULT_TIMEZONE) {
  date = wallClock(date, tz);
  if (!expr?.trim()) return false;
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [min, hour, dom, month, dow] = parts;
  return (
    matchesCronField(min, date.getMinutes()) &&
    matchesCronField(hour, date.getHours()) &&
    matchesCronField(dom, date.getDate()) &&
    matchesCronField(month, date.getMonth() + 1) &&
    matchesCronField(dow, date.getDay())
  );
}

/**
 * Evaluate triggerConfig for a recurring sequence.
 * config: { scheduleType, intervalMinutes, intervalHours, time, weekday, dayOfMonth, cron, timezone, businessHoursOnly }
 */
export function shouldRunSchedule(config = {}, lastRunAt, now = new Date()) {
  if (!config || config.enabled === false) return false;

  const last = lastRunAt ? new Date(lastRunAt) : null;
  const type = config.scheduleType || config.type || 'daily';

  if (type === 'cron' && config.cron) {
    if (!matchesCronExpression(config.cron, now, config.timezone)) return false;
    if (last && now - last < 55000) return false;
    return true;
  }

  if (type === 'minutes') {
    const interval = (config.intervalMinutes || config.interval || 30) * 60000;
    return !last || now - last >= interval;
  }

  if (type === 'hours') {
    const interval = (config.intervalHours || config.interval || 1) * 3600000;
    return !last || now - last >= interval;
  }

  const { hours, minutes } = parseTime(config.time || '09:00');
  const instant = now;
  now = wallClock(instant, config.timezone);
  const atTime = now.getHours() === hours && now.getMinutes() === minutes;
  if (!atTime) return false;
  if (last && instant - last < 3600000) return false;

  if (type === 'weekly' || type === 'weekday') {
    const day = config.weekday ?? config.day;
    if (typeof day === 'number') return now.getDay() === day;
    if (typeof day === 'string') return WEEKDAYS[now.getDay()] === day.toLowerCase();
    return type === 'weekly' ? now.getDay() === 1 : true;
  }

  if (type === 'monthly') {
    const dom = config.dayOfMonth || config.day || 1;
    return now.getDate() === dom;
  }

  if (type === 'yearly') {
    const dom = config.dayOfMonth || 1;
    const mon = (config.month || 1) - 1;
    return now.getDate() === dom && now.getMonth() === mon;
  }

  // daily default
  return true;
}

export function isWithinBusinessHoursWindow(business, now = new Date()) {
  const hours = business?.settings?.automation?.businessHours
    || business?.settings?.businessHours
    || { startTime: '09:00', endTime: '18:00', workingDays: [1, 2, 3, 4, 5, 6] };
  now = wallClock(now, business?.settings?.automation?.timezone || business?.settings?.timezone || hours.timezone);
  const day = now.getDay();
  const workingDays = hours.workingDays || [1, 2, 3, 4, 5, 6];
  if (!workingDays.includes(day)) return false;
  const { hours: startH, minutes: startM } = parseTime(hours.startTime || '09:00');
  const { hours: endH, minutes: endM } = parseTime(hours.endTime || '18:00');
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= startH * 60 + startM && mins <= endH * 60 + endM;
}
