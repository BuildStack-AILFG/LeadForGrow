/**
 * WhatsApp opt-out (a customer replied STOP) — one check every WhatsApp send
 * goes through, so no path can message someone who asked us to stop.
 *
 *   automated sends (automations, sequences, flows, AI, broadcasts)  → blocked
 *   templates, even typed by an agent (business-started messages)    → blocked
 *   an agent's typed reply after the customer wrote to us again      → allowed
 *     (they started that conversation; Meta's 24-hour window still applies)
 *
 * A customer opts back in by sending START (see lib/automation/leadManager.js).
 */
import Lead from '@/models/automation/Lead';
import Message from '@/models/automation/Message';
import { optOutDecision, OPTED_OUT_MESSAGE } from '@/lib/whatsapp/optOutRules';

/**
 * @returns {Promise<string|null>} an error message when the send must not go out
 */
export async function whatsappOptOutBlock(lead, businessId, { origin = 'automation', isTemplate = false } = {}) {
  if (!lead?._id) return null; // team alerts and test sends aren't to a lead
  let { optedOutOfWhatsApp: optedOut, optedOutAt } = lead;
  if (optedOut === undefined) {
    // Loaded with a projection that left the field out: look it up (cheap, by _id).
    const fresh = await Lead.findById(lead._id).select('optedOutOfWhatsApp optedOutAt').lean();
    optedOut = fresh?.optedOutOfWhatsApp;
    optedOutAt = fresh?.optedOutAt;
  }
  if (!optedOut) return null;

  let reengaged = false;
  if (origin === 'user' && !isTemplate) {
    reengaged = Boolean(await Message.exists({
      businessId,
      leadId: lead._id,
      direction: 'incoming',
      timestamp: { $gt: optedOutAt || new Date(0) },
    }));
  }
  return optOutDecision({ optedOut, origin, isTemplate, reengaged }) ? null : OPTED_OUT_MESSAGE;
}

/** Same check for senders that throw on failure (media, interactive buttons/lists). */
export async function assertWhatsAppAllowed(lead, business, opts) {
  const blocked = await whatsappOptOutBlock(lead, business?._id, opts);
  if (blocked) {
    const err = new Error(blocked);
    err.code = 'OPTED_OUT';
    throw err;
  }
}
