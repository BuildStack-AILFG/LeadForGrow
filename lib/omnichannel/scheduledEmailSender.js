import { dbConnect } from '@/lib/mongodb';
import EmailDraft from '@/models/omnichannel/EmailDraft';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import Conversation from '@/models/omnichannel/Conversation';
import { sendChannelEmail } from './emailService';
import { recordChannelMessage } from './conversationService';

// Cap per run so one invocation can't spin forever on a large backlog — the
// next cron tick picks up the rest. Sequential is fine at current volume.
const MAX_PER_RUN = 50;
// A scheduled draft that keeps failing to send (bad mailbox, dead SMTP) is
// retried a few times, then parked as a normal draft (scheduledAt cleared) so
// the user can inspect and resend it manually instead of it retrying forever.
const MAX_ATTEMPTS = 3;

/**
 * Send every EmailDraft whose scheduledAt has arrived.
 *
 * Concurrency: each due draft is CLAIMED with an atomic findOneAndDelete —
 * deleting it is the lock, so two overlapping cron runs can never grab the
 * same draft and double-send. If the send fails, the draft is re-inserted for
 * a later retry; the email only ever leaves once because the claim happens
 * before the send, and a post-send recording failure never re-inserts.
 *
 * Regular auto-saved drafts have no scheduledAt, so the query never touches
 * them.
 */
export async function runScheduledEmailSends() {
  await dbConnect();
  const now = new Date();
  const summary = { claimed: 0, sent: 0, retried: 0, abandoned: 0, errors: [] };

  for (let i = 0; i < MAX_PER_RUN; i++) {
    const draft = await EmailDraft.findOneAndDelete(
      { scheduledAt: { $ne: null, $lte: now } },
      { sort: { scheduledAt: 1 } },
    ).lean();
    if (!draft) break;
    summary.claimed++;

    let sendResult;
    try {
      const [business, lead, conversation] = await Promise.all([
        Business.findById(draft.businessId),
        draft.leadId ? Lead.findById(draft.leadId) : null,
        draft.conversationId ? Conversation.findById(draft.conversationId) : null,
      ]);
      if (!business) throw new Error('Business not found for scheduled draft');

      // sendChannelEmail reads the recipient from lead.email (or the
      // conversation). For a lead-less draft, synthesize the minimal shape it
      // needs from the stored To recipient.
      const recipient = lead || { email: draft.to?.[0]?.email, name: draft.to?.[0]?.name };
      if (!recipient.email) throw new Error('No recipient email on scheduled draft');

      sendResult = await sendChannelEmail({
        business,
        lead: recipient,
        conversation,
        subject: draft.subject,
        body: draft.bodyHtml || draft.bodyText || '',
        replyToMessageId: draft.replyToMessageId,
        cc: draft.cc,
        bcc: draft.bcc,
        attachments: draft.attachments || [],
        isHtml: !!draft.bodyHtml,
        emailAccountId: draft.emailAccountId,
        userId: draft.createdBy, // enables the "user's default mailbox" fallback
      });
      if (!sendResult?.success) {
        throw new Error(sendResult?.error || 'Email send failed');
      }
    } catch (err) {
      // The email did NOT go out — safe to re-insert for a later retry.
      await requeueFailedDraft(draft, err, summary);
      continue;
    }

    // Send succeeded. Record it into the thread so it shows as a sent message.
    // A failure HERE must NOT re-insert the draft (that would resend the
    // email); recordChannelMessage is also idempotent on messageId, so a
    // partial record on a retry can't duplicate the thread entry either.
    try {
      await recordChannelMessage({
        businessId: draft.businessId,
        channel: 'email',
        leadId: draft.leadId,
        conversationId: draft.conversationId,
        messageId: sendResult.messageId || `out_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        direction: 'outgoing',
        type: 'email',
        content: {
          body: draft.bodyText || (draft.bodyHtml || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          html: draft.bodyHtml || undefined,
          cc: Array.isArray(draft.cc)
            ? draft.cc.map((c) => ({ name: c.name, address: c.email || c.address })).filter((c) => c.address)
            : [],
          attachments: draft.attachments || [],
        },
        status: 'sent',
        performedBy: draft.createdBy,
        subject: draft.subject,
        replyToMessageId: draft.replyToMessageId,
        emailAccountId: draft.emailAccountId || undefined,
        folder: 'sent',
      });

      if (draft.conversationId) {
        await Conversation.findByIdAndUpdate(draft.conversationId, {
          $set: { inboxStatus: 'intervened' },
        });
      }
    } catch (err) {
      // Email already delivered — log and move on rather than risk a resend.
      console.error('[scheduledEmailSender] recorded-message step failed after successful send', {
        draftId: String(draft._id),
        error: err.message,
      });
      summary.errors.push({ draftId: String(draft._id), stage: 'record', error: err.message });
    }
    summary.sent++;
  }

  return summary;
}

async function requeueFailedDraft(draft, err, summary) {
  const attempts = (draft.sendAttempts || 0) + 1;
  const giveUp = attempts >= MAX_ATTEMPTS;
  // Rebuild a clean draft doc — drop identity/timestamps so Mongoose assigns
  // fresh ones. When we give up, clear scheduledAt so it drops back to a plain
  // draft (no longer picked up by the query) with the error recorded.
  const { _id, createdAt, updatedAt, __v, ...rest } = draft;
  try {
    await EmailDraft.create({
      ...rest,
      scheduledAt: giveUp ? null : draft.scheduledAt,
      sendAttempts: attempts,
      sendError: (err.message || 'send failed').slice(0, 300),
    });
  } catch (reinsertErr) {
    console.error('[scheduledEmailSender] failed to requeue draft after send error', {
      draftId: String(draft._id),
      error: reinsertErr.message,
    });
  }
  if (giveUp) summary.abandoned++;
  else summary.retried++;
  summary.errors.push({ draftId: String(draft._id), stage: 'send', attempts, error: err.message });
}
