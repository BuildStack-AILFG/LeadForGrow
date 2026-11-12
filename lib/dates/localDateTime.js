/**
 * <input type="datetime-local"> gives "2026-11-12T15:00" with no timezone. Sent as-is, the
 * server (which runs in UTC) reads it as 15:00 UTC = 20:30 IST. Convert it in the browser,
 * where it means the user's own local time, to an exact ISO instant before sending.
 */
export function localInputToISO(value) {
  if (!value) return undefined;
  const s = String(value);
  // Already carries a timezone (Z or ±hh:mm) — leave it alone.
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Midnight of `date`'s day in a timezone given as a browser getTimezoneOffset() value
 * (minutes, UTC minus local: -330 for IST). Invalid / missing offset → the server's own day.
 */
export function startOfDayInOffset(date, tzOffsetMinutes) {
  const off = Number.parseInt(tzOffsetMinutes, 10);
  if (!Number.isFinite(off) || Math.abs(off) > 14 * 60) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const local = new Date(date.getTime() - off * 60000); // shift so UTC fields = local wall clock
  const midnightLocalAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(midnightLocalAsUtc + off * 60000);
}

/** Browser timezone offset for API calls (?tz=). */
export function browserTzParam() {
  return typeof window === 'undefined' ? '' : `tz=${new Date().getTimezoneOffset()}`;
}

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

function safeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz || DEFAULT_TIMEZONE });
    return tz || DEFAULT_TIMEZONE;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** Wall-clock parts of an instant in a timezone (month 1-12, weekday 0 = Sunday). */
export function zonedParts(date, tz = DEFAULT_TIMEZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: safeZone(tz), hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(date)).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)])
  );
  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return { ...parts, weekday };
}

/** The instant at which the wall clock in `tz` reads y-m-d h:mi (month 1-12). */
export function zonedTimeToDate(year, month, day, hour = 0, minute = 0, tz = DEFAULT_TIMEZONE) {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let guess = wall;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(guess, tz);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wall - shown;
  }
  return new Date(guess);
}

/** Format an instant in a timezone (server code runs in UTC, so always pass the zone). */
export function formatInTimeZone(date, tz = DEFAULT_TIMEZONE, options = {}) {
  const opts = Object.keys(options).length ? options : {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  };
  return new Date(date).toLocaleString('en-IN', { ...opts, timeZone: safeZone(tz) });
}
