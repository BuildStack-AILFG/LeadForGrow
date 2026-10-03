/**
 * Email Auto-Reply (SLA safety net).
 *
 * When a customer emails us and no human replies within N minutes,
 * this module fires a polite "we've got your message" holding reply
 * so the lead knows we saw them. Executes as a delayed BullMQ job
 * (see lib/queue.js — job type 'email-auto-reply').
 *
 * Design notes:
 *   - Holding message only — commits to nothing, just acknowledges.
 *   - Every guardrail (see below) prevents a specific class of embarrassment:
 *       businessHoursOnly → no midnight "we'll get back to you" that looks weird
 *       skipKeywords       → no bland auto-reply to an angry/urgent message
 *       onePerConversation → no infinite AI-vs-customer ping-pong loops
 *       machine mail       → never answer no-reply / newsletter / Auto-Submitted
 *                            mail (bounces, and auto-responder loops per RFC 3834)
 *   - No AI call yet. Template with variable substitution ({{name}} etc.)
 *     is reliable, cheap, and gives the same UX. Swap to AI-generated text
 *     later by replacing renderTemplate() — call sites don't change.
 *
 * Flow:
 *   trigger (inbound email arrives)
 *     ↓ enqueue delayed job with delay=thresholdMinutes
 *   [threshold minutes pass]
 *     ↓
 *   worker (this file → runAutoReplyJob)
 *     ├─ Load business/conversation/trigger message
 *     ├─ Check guardrails (paused, human-replied, biz-hours, keywords, one-per)
 *     ├─ If any fails → skip silently, no send
 *     ├─ Render template with lead/business context
 *     ├─ Send via sendChannelEmail (uses the conversation's pinned mailbox)
 *     ├─ Mark conversation.lastAutoReplyAt + optionally pause
 *     └─ Increment business.emailAutoReply.totalSent
 */
import { dbConnect } from './mongodb';
import Business from '@/models/Business';
import Conversation from '@/models/omnichannel/Conversation';
import Message from '@/models/automation/Message';
import Lead from '@/models/automation/Lead';
import { isAutomatedSender } from '@/lib/omnichannel/automatedSender';
import { isBulkMail } from '@/lib/omnichannel/responseTracking';

/**
 * Simple mustache-like variable substitution. No dependency on Handlebars —
 * we only need three or four variables and they're all safe strings.
 */
function renderTemplate(template, vars) {
  let out = template || '';
  Object.entries(vars || {}).forEach(([key, val]) => {
    out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(val ?? ''));
  });
  return out;
}

/**
 * Check whether we're currently inside the business's working hours.
 * Uses the business.settings.businessHours block if present; defaults to
 * always-on if not configured.
 */
function isWithinBusinessHours(business) {
  const hours = business?.settings?.businessHours;
  if (!hours) return true;
  // Compute "now" in the tenant's timezone. Intl gets us HH:MM + weekday
  // without pulling in a heavy tz library.
  const now = new Date();
  const tz = hours.timezone || 'Asia/Kolkata';
  let hh, mm, weekday;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
    }).formatToParts(now);
    hh = Number(parts.find((p) => p.type === 'hour')?.value || 0);
    mm = Number(parts.find((p) => p.type === 'minute')?.value || 0);
    const wStr = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
    const wMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    weekday = wMap[wStr] ?? 1;
  } catch {
    return true; // If tz parsing fails, don't block — better a stray after-hours reply than none at all.
  }
  const workingDays = hours.workingDays || [1, 2, 3, 4, 5, 6];
  if (!workingDays.includes(weekday)) return false;
  const [startH, startM] = (hours.startTime || '09:00').split(':').map(Number);
  const [endH, endM] = (hours.endTime || '18:00').split(':').map(Number);
  const nowMin = hh * 60 + mm;
  const startMin = startH * 60 + (startM || 0);
  const endMin = endH * 60 + (endM || 0);
  return nowMin >= startMin && nowMin < endMin;
}

/**
 * Look at the trigger message body/subject for any skip-keyword. Match is
 * case-insensitive and word-boundary-agnostic (matches "cancellation" if
 * "cancel" is in the list — deliberately eager because false positives here
 * just mean "human handles it," which is the safer failure mode).
 */
function containsSkipKeyword(message, keywords) {
  if (!keywords?.length) return false;
  const haystack = `${message?.subject || ''} ${message?.content?.body || ''}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

/**
 * Called by the BullMQ worker (lib/queue.js) when an `email-auto-reply` job
 * fires. Returns a { status, reason? } summary so the queue can log outcomes.
 */
export async function runAutoReplyJob({ conversationId, triggerMessageId }) {
  await dbConnect();

  // Load context. If anything's missing (deleted mid-flight), skip silently.
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { status: 'skipped', reason: 'conversation_gone' };

  const business = await Business.findById(conversation.businessId);
  if (!business) return { status: 'skipped', reason: 'business_gone' };

  const cfg = business.settings?.emailAutoReply;
  if (!cfg?.enabled) return { status: 'skipped', reason: 'feature_disabled' };

  // Per-conversation opt-out (agent chose to handle manually, OR previous
  // auto-reply already fired and onePerConversation flipped this on).
  if (conversation.autoReplyPaused) {
    return { status: 'skipped', reason: 'conversation_paused' };
  }

  const triggerMessage = await Message.findById(triggerMessageId);
  if (!triggerMessage) return { status: 'skipped', reason: 'trigger_gone' };

  // Guardrail: machine mail. Nobody reads a reply to no-reply@ or a newsletter,
  // and answering another auto-responder can loop.
  if (isAutomatedSender({ channel: 'email', email: conversation.participantEmail }) || isBulkMail(triggerMessage.headers)) {
    return { status: 'skipped', reason: 'automated_sender' };
  }

  // The primary check: has ANY human replied to this conversation since the
  // trigger message arrived? If yes, we're done — human handled it.
  const humanReply = await Message.findOne({
    businessId: conversation.businessId,
    conversationId,
    direction: 'outgoing',
    origin: 'user',
    timestamp: { $gt: triggerMessage.timestamp },
  }).select('_id').lean();
  if (humanReply) return { status: 'skipped', reason: 'human_replied' };

  // Guardrail: skip keywords in the customer's message.
  if (containsSkipKeyword(triggerMessage, cfg.guardrails?.skipKeywords)) {
    return { status: 'skipped', reason: 'skip_keyword_matched' };
  }

  // Guardrail: business hours.
  if (cfg.guardrails?.businessHoursOnly && !isWithinBusinessHours(business)) {
    return { status: 'skipped', reason: 'outside_business_hours' };
  }

  // Guardrail: one-per-conversation. If a previous auto-reply already fired,
  // don't fire another. (We also set autoReplyPaused when we send below,
  // but this is a belt-and-braces check in case the flag write failed.)
  if (cfg.guardrails?.onePerConversation && conversation.lastAutoReplyAt) {
    return { status: 'skipped', reason: 'already_sent_once' };
  }

  // Resolve lead for template variables.
  const lead = conversation.leadId ? await Lead.findById(conversation.leadId).lean() : null;
  const leadName =
    (lead?.name || conversation.participantName || 'there').split(' ')[0]; // first name only

  const renderedBody = renderTemplate(cfg.template, {
    name: leadName,
    businessName: business.businessName || 'our team',
    subject: triggerMessage.subject || '',
  });
  const renderedSubject = triggerMessage.subject
    ? triggerMessage.subject.replace(/^Re:\s*/i, 'Re: ')
    : `Re: your enquiry`;
  // Ensure the outbound subject starts with "Re:" so recipient clients
  // thread it under the original correctly (many clients thread by
  // subject-normalization as a fallback when In-Reply-To is missing).
  const finalSubject = /^re:/i.test(renderedSubject) ? renderedSubject : `Re: ${renderedSubject}`;

  // Send via the same pipeline as manual composer sends — this reuses
  // sendChannelEmail's account resolution, immutable-sender rule, and
  // threading headers (In-Reply-To → triggerMessage.messageId).
  const { sendChannelEmail } = await import('@/lib/omnichannel/emailService');
  const result = await sendChannelEmail({
    business,
    lead: lead || { _id: conversation.leadId, name: leadName, email: triggerMessage.content?.participantEmail },
    conversation,
    subject: finalSubject,
    body: renderedBody,
    isHtml: false,
    replyToMessageId: triggerMessage.messageId,
  });

  if (!result?.success) {
    // Send failed (SMTP error, no mailbox, etc.). Log + surface but do NOT
    // retry aggressively — a broken send is usually a config issue, retry
    // won't fix it. Cron reconciliation can retry later.
    console.error('[emailAutoReply] send failed:', result?.error);
    return { status: 'failed', reason: result?.error || 'send_failed' };
  }

  // Record the outbound Message so it shows up in the inbox with the
  // violet "Auto" pill. Uses recordChannelMessage from Step 8's plumbing.
  try {
    const { recordChannelMessage } = await import('@/lib/omnichannel/conversationService');
    await recordChannelMessage({
      businessId: conversation.businessId,
      channel: 'email',
      conversationId: conversation._id,
      leadId: conversation.leadId,
      messageId: result.messageId || `auto_${Date.now()}`,
      direction: 'outgoing',
      type: 'email',
      content: { body: renderedBody, participantEmail: triggerMessage.content?.participantEmail },
      subject: finalSubject,
      status: 'sent',
      origin: 'automation',
      emailAccountId: result.emailAccountId,
      emailThreadId: result.threadId,
      inReplyTo: triggerMessage.messageId,
      references: triggerMessage.messageId ? [triggerMessage.messageId] : undefined,
    });
  } catch (recordErr) {
    // Recording failed but the email actually went out — log and move on.
    console.warn('[emailAutoReply] recordChannelMessage failed:', recordErr.message);
  }

  // Mark the conversation so onePerConversation catches future triggers.
  conversation.lastAutoReplyAt = new Date();
  if (cfg.guardrails?.onePerConversation) {
    conversation.autoReplyPaused = true;
  }
  await conversation.save();

  // Track fleet stats on the business.
  business.settings.emailAutoReply.lastRunAt = new Date();
  business.settings.emailAutoReply.totalSent = (business.settings.emailAutoReply.totalSent || 0) + 1;
  business.markModified('settings');
  await business.save();

  return { status: 'sent', messageId: result.messageId };
}

/**
 * Enqueue an auto-reply job for a freshly-arrived inbound email. Called
 * from lib/omnichannel/emailService.js:ingestInboundEmail immediately after
 * the incoming message + conversation are persisted.
 *
 * Delay = business.settings.emailAutoReply.thresholdMinutes. The worker
 * re-checks feature-enabled + guardrails at fire time, so this is safe to
 * call even when the feature is disabled (job runs, checks, exits early).
 */
export async function scheduleAutoReplyForInbound({ businessId, conversationId, messageId }) {
  if (!businessId || !conversationId || !messageId) return;

  try {
    const business = await Business.findById(businessId).select('settings.emailAutoReply').lean();
    const cfg = business?.settings?.emailAutoReply;
    if (!cfg?.enabled) return; // Feature off — don't queue useless jobs.

    const delayMs = Math.max(1, Number(cfg.thresholdMinutes) || 5) * 60 * 1000;

    const { enqueueEmailAutoReply } = await import('./queue');
    await enqueueEmailAutoReply({ conversationId, triggerMessageId: messageId }, delayMs);
  } catch (err) {
    // Non-fatal — the inbound message is already persisted; missing the
    // safety-net reply is acceptable degradation.
    console.warn('[emailAutoReply] failed to schedule:', err.message);
  }
}
