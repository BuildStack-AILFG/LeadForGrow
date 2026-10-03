/**
 * WhatsApp opt-out rules (pure — unit tested). See lib/whatsapp/optOut.js.
 */

export const OPTED_OUT_MESSAGE = 'This customer opted out of WhatsApp messages (they replied STOP). They can opt back in by sending START.';

// Standalone keywords only, so "stop the sale" or "start date?" don't trigger.
const STOP = /^(stop|unsubscribe|opt[\s-]?out|remove me|band karo|band karo message|bandh karo|roko|band kar do)\.?$/i;
const START = /^(start|unstop|subscribe|opt[\s-]?in|chalu karo|shuru karo)\.?$/i;

export const isStopKeyword = (body) => Boolean(body) && STOP.test(String(body).trim());
export const isStartKeyword = (body) => Boolean(body) && START.test(String(body).trim());

/** true = the send may go out. */
export function optOutDecision({ optedOut, origin = 'automation', isTemplate = false, reengaged = false }) {
  if (!optedOut) return true;
  return origin === 'user' && !isTemplate && reengaged;
}
