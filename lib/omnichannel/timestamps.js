/**
 * Message / conversation timestamps must be real dates. Epoch SECONDS mistaken for milliseconds land in January 1970
 * (11 WhatsApp conversations were found stored as "1970-01-21": the real time is the same number x 1000, Aug 2026),
 * which shows a 1970 date in the inbox and sorts a conversation to the wrong end of every list.
 *
 * A value between 1e9 and 5e9 ms is 12 Jan - 2 Mar 1970: never a real message time, but exactly what seconds between
 * 2001 and 2128 look like. Those are read as seconds. Anything else is returned unchanged; junk becomes "now".
 */
export function normalizeTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  const ms = date.getTime();
  if (!Number.isFinite(ms)) return new Date();
  if (ms >= 1e9 && ms < 5e9) return new Date(ms * 1000);
  return date;
}
