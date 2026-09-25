/**
 * First-response tracking on Conversation.
 *
 * Answers "how long did this customer wait for a human?" without a Messages
 * scan, so Leak Guard / reports can query Conversation directly:
 *
 *   firstInboundAt       first message from the customer
 *   firstResponseAt      first HUMAN reply after that (origin 'user')
 *   firstResponseMs      firstResponseAt - firstInboundAt
 *   firstAutoResponseAt  first automated reply after that (automation / sequence)
 *   awaitingReplySince   oldest customer message no human has answered yet
 *                        (set on inbound, cleared by a human reply)
 *   responseConfidence   'live' when recorded as it happened; the backfill writes
 *                        'high' or 'heuristic'
 *
 * Machine mail (newsletters, no-reply, bulk headers) is not a customer waiting
 * for an answer, so it never starts the clock.
 *
 * Cost: inbound and human-reply updates ride on the Conversation write that
 * recordChannelMessage already does. The only extra write is one conditional
 * update per conversation lifetime for firstResponseAt (and one for
 * firstAutoResponseAt), skipped whenever the value is already known.
 */
import { isAutomatedSender } from './automatedSender.js';

// Automated replies that answer the customer. Broadcasts, meeting reminders and
// system alerts go out regardless of what the customer said, so they don't count.
const AUTO_REPLY_ORIGINS = new Set(['automation', 'sequence']);
const NOT_SENT = new Set(['failed', 'draft', 'scheduled']);

// Headers kept from inbound email to spot bulk / auto-generated mail.
export const BULK_HEADER_KEYS = [
  'list-unsubscribe',
  'list-id',
  'precedence',
  'auto-submitted',
  'feedback-id',
  'x-auto-response-suppress',
];

/**
 * Pick the bulk-mail headers out of mailparser's raw header lines.
 * Returns a plain object (lower-case keys, values capped) or undefined.
 */
export function pickBulkHeaders(headerLines) {
  if (!Array.isArray(headerLines)) return undefined;
  const out = {};
  for (const h of headerLines) {
    const key = String(h?.key || '').toLowerCase();
    if (!BULK_HEADER_KEYS.includes(key) || out[key]) continue;
    const line = String(h?.line || '');
    const value = line.slice(line.indexOf(':') + 1).replace(/\s+/g, ' ').trim();
    out[key] = value.slice(0, 300);
  }
  return Object.keys(out).length ? out : undefined;
}

/** True when the headers say this is bulk or auto-generated mail. */
export function isBulkMail(headers) {
  if (!headers) return false;
  const get = (k) => {
    const v = typeof headers.get === 'function' ? headers.get(k) : headers[k];
    return v == null ? '' : String(v).trim().toLowerCase();
  };
  if (get('list-unsubscribe') || get('list-id') || get('feedback-id') || get('x-auto-response-suppress')) return true;
  if (/^(bulk|list|junk)$/.test(get('precedence'))) return true;
  const auto = get('auto-submitted');
  return Boolean(auto) && auto !== 'no';
}

/** Does this inbound message start (or keep) the "customer is waiting" clock? */
export function isCustomerInbound({ channel, participantEmail, headers, isInternal }) {
  if (isInternal) return false;
  if (channel === 'email' && (isAutomatedSender({ channel, email: participantEmail }) || isBulkMail(headers))) return false;
  return true;
}

/**
 * Operators to merge into the Conversation update for this message.
 * Returns { $min?, $unset? }; never touches the same paths as the caller's $set.
 */
export function responseTrackingOps({ direction, origin, status, isInternal, customerInbound, timestamp }) {
  if (isInternal) return {};
  if (direction === 'incoming') {
    if (!customerInbound) return {};
    // $min sets the field when missing and keeps the earlier value otherwise.
    return { $min: { firstInboundAt: timestamp, awaitingReplySince: timestamp } };
  }
  if (NOT_SENT.has(status)) return {};
  if (origin === 'user') return { $unset: { awaitingReplySince: 1 } };
  return {};
}

/**
 * The one-time conditional update for the first human / automated reply, or
 * null when there is nothing to do. `conversation` is the doc the caller
 * already has in hand (used only to skip the write when already recorded).
 */
export function firstReplyUpdate({ direction, origin, status, isInternal, timestamp, conversation }) {
  if (isInternal || direction !== 'outgoing' || NOT_SENT.has(status) || !conversation?._id) return null;
  // The customer hasn't written yet (outreach, cold sequences): nothing to answer, no write.
  if (!conversation.firstInboundAt) return null;
  const t = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (origin === 'user') {
    if (conversation.firstResponseAt) return null;
    return {
      // Only after the customer wrote: outreach before that is not a "response".
      filter: { _id: conversation._id, firstInboundAt: { $lte: t }, firstResponseAt: { $exists: false } },
      update: [{
        $set: {
          firstResponseAt: t,
          firstResponseMs: { $subtract: [t, '$firstInboundAt'] },
          responseConfidence: 'live',
        },
      }],
    };
  }

  if (AUTO_REPLY_ORIGINS.has(origin)) {
    if (conversation.firstAutoResponseAt) return null;
    return {
      filter: { _id: conversation._id, firstInboundAt: { $lte: t }, firstAutoResponseAt: { $exists: false } },
      update: { $set: { firstAutoResponseAt: t } },
    };
  }

  return null;
}
