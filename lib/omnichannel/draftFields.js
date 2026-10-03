/**
 * Email drafts (folders API + composer auto-save).
 *
 * Bugs this fixes (found from a real mailbox: 120 drafts, ~30 of them real):
 *  - the composer auto-saves every 2 s and every save POSTed a NEW draft, so one reply became up to 28 rows and the folder
 *    counter ("Drafts (76)") was mostly stale versions of the same draft;
 *  - the draft body was saved only as HTML, so the Drafts tab showed "Empty draft" and "Continue editing" inserted nothing;
 *  - POST/PUT spread the whole request body into the document, so a client could set businessId / createdBy (cross-tenant write).
 *
 * The rule now: ONE working draft per (business, conversation, user); saves update it, sending deletes it, and only known
 * fields are ever written.
 */

const ALLOWED_FIELDS = [
  'emailAccountId', 'conversationId', 'leadId', 'to', 'cc', 'bcc',
  'subject', 'bodyHtml', 'bodyText', 'attachments', 'replyToMessageId',
];

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

/** HTML from the composer -> plain text (block tags become line breaks). */
export function htmlToPlainText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Only known draft fields, with bodyText derived from bodyHtml when the client did not send it. */
export function pickDraftFields(body = {}) {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (body?.[key] !== undefined) out[key] = body[key];
  }
  if (out.bodyHtml !== undefined && out.bodyText === undefined) out.bodyText = htmlToPlainText(out.bodyHtml);
  return out;
}

/** The single unscheduled "working draft" of a thread for one user (scheduled drafts are separate, they are not edited by auto-save). */
export function workingDraftFilter({ businessId, conversationId, userId }) {
  return {
    businessId,
    conversationId,
    createdBy: userId,
    $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }],
  };
}

export default { htmlToPlainText, pickDraftFields, workingDraftFilter };
