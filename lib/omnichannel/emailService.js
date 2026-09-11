import { sendBusinessEmail } from '@/lib/businessMailer';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import EmailThread from '@/models/omnichannel/EmailThread';
import Message from '@/models/automation/Message';
import { dbConnect } from '@/lib/mongodb';
import { recordChannelMessage } from '@/lib/omnichannel/conversationService';
import { createTransporterForAccount, formatFromHeader } from '@/lib/omnichannel/mailerFromAccount';

/**
 * Resolve which EmailAccount will send this message.
 * Priority (highest wins):
 *   1. Explicit emailAccountId on the caller (composer From-picker).
 *   2. Existing conversation's pinned emailAccountId (reply keeps the same
 *      mailbox — never silently switches sender identity mid-thread).
 *   3. Personal default for the sending user.
 *   4. null — caller falls back to the legacy business SMTP path.
 */
async function resolveSendingAccount({ business, conversation, emailAccountId, userId }) {
  if (emailAccountId) {
    const account = await EmailAccount.findOne({
      _id: emailAccountId,
      businessId: business._id,
      status: { $nin: ['archived', 'disconnected'] },
    });
    if (account) return account;
  }

  if (conversation?.emailAccountId) {
    const pinned = await EmailAccount.findOne({
      _id: conversation.emailAccountId,
      businessId: business._id,
      status: { $nin: ['archived', 'disconnected'] },
    });
    if (pinned) return pinned;
  }

  if (userId) {
    const mine = await EmailAccount.findOne({
      businessId: business._id,
      userId,
      isDefault: true,
      status: 'active',
    });
    if (mine) return mine;
  }

  return null;
}

export async function sendChannelEmail({
  business,
  lead,
  conversation,
  subject,
  body,
  replyToMessageId,
  cc,
  bcc,
  attachments = [],
  isHtml = false,
  emailAccountId,
  userId,
  signatureId,
}) {
  // Note: origin lives on the caller side. sendChannelEmail does not call
  // recordChannelMessage itself (its caller — /api/automation/inbox/send —
  // does). Non-composer callers use sendCustomerEmail/sendMeetingEmail
  // which record with their own origin.
  await dbConnect();

  const to = lead.email || conversation?.participantEmail;
  if (!to) {
    return { success: false, error: 'No email address for recipient' };
  }

  const account = await resolveSendingAccount({ business, conversation, emailAccountId, userId });

  // Look up the parent message (if this is a reply) so we can thread properly
  // via In-Reply-To and References headers.
  let inReplyToMessage = null;
  if (replyToMessageId) {
    inReplyToMessage = await Message.findOne({
      businessId: business._id,
      messageId: replyToMessageId,
    });
  }

  // Signature resolution — priority:
  //   1. Explicit signatureId passed by the composer (user picked one)
  //   2. Account's default from signatures[] (isDefault=true)
  //   3. Legacy account.signature string
  //   4. Nothing
  // The instance method encapsulates this; we still keep the legacy
  // signatureLogoUrl path below for accounts that only used the old
  // single-signature model.
  let signatureHtml = '';
  const resolvedSig = account?.resolveSignatureHtml
    ? account.resolveSignatureHtml(signatureId)
    : (account?.signature || '');

  // Only prepend the legacy account-wide logo when the resolved signature
  // is the legacy plain text (i.e. no HTML markup) — new multi-signatures
  // embed their own logo inside the HTML, so re-adding the account logo
  // would double it up.
  const isPlainLegacy =
    resolvedSig && !/<[a-z][\s\S]*>/i.test(resolvedSig);
  if (isPlainLegacy && account?.signatureLogoUrl) {
    const w = Number(account.signatureLogoWidth) || 180;
    signatureHtml += `<img src="${account.signatureLogoUrl}" alt="" width="${w}" style="max-width:${w}px;height:auto;display:block;margin:0 0 8px 0;border:0;outline:0;" />`;
  }
  if (resolvedSig) {
    signatureHtml += isPlainLegacy ? resolvedSig.replace(/\n/g, '<br>') : resolvedSig;
  }

  const html = isHtml
    ? `${body}${signatureHtml ? `<br><br>${signatureHtml}` : ''}`
    : `${(body || '').replace(/\n/g, '<br>')}${signatureHtml ? `<br><br>${signatureHtml}` : ''}`;
  const text = isHtml ? (body || '').replace(/<[^>]+>/g, '') : body;

  const mailOptions = {
    to,
    subject,
    html,
    text,
    cc: cc?.map((c) => c.email || c).filter(Boolean),
    bcc: bcc?.map((c) => c.email || c).filter(Boolean),
    attachments: attachments.map((a) => ({
      filename: a.fileName || a.filename,
      path: a.url,
      contentType: a.mimeType,
    })),
    headers: {},
  };

  // Threading headers — required for the customer's reply to fold back into
  // this conversation instead of starting a fresh thread.
  if (inReplyToMessage?.messageId) {
    mailOptions.headers['In-Reply-To'] = inReplyToMessage.messageId;
    mailOptions.headers['References'] = inReplyToMessage.messageId;
  }

  let sendResult;
  let providerMessageId;

  if (account) {
    // Per-account send — the multi-user path this whole refactor exists for.
    try {
      const transporter = await createTransporterForAccount(account);
      mailOptions.from = formatFromHeader(account);
      const info = await transporter.sendMail(mailOptions);
      // info.messageId is the RFC-822 Message-ID Nodemailer generated (or the
      // one we injected via headers). Persist it so replies thread.
      providerMessageId = info.messageId;
      sendResult = { success: true, messageId: info.messageId, response: info.response };
    } catch (err) {
      console.error('[sendChannelEmail] per-account send failed', err);
      return { success: false, error: err.message || 'Email send failed' };
    }
  } else {
    // Backward-compat: no per-user account connected AND no default. Fall
    // through to the legacy business SMTP so existing tenants keep working.
    const legacy = await sendBusinessEmail(business, mailOptions);
    if (!legacy?.success) {
      return { success: false, error: legacy?.error || 'Email send failed' };
    }
    providerMessageId = legacy.messageId;
    sendResult = legacy;
  }

  // Use the real provider messageId if we got one; otherwise fall back to a
  // local id so downstream indexes don't collide. Any real messageId beats
  // an invented one for threading purposes.
  const messageId =
    providerMessageId || `email_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  let thread = conversation?.emailThreadId
    ? await EmailThread.findById(conversation.emailThreadId)
    : null;

  if (!thread) {
    thread = await EmailThread.create({
      businessId: business._id,
      emailAccountId: account?._id,
      conversationId: conversation?._id,
      leadId: lead._id,
      subject,
      participants: [{ email: to, name: lead.name }],
      externalThreadId: messageId,
      lastMessageAt: new Date(),
      messageCount: 1,
    });
  } else {
    thread.messageCount += 1;
    thread.lastMessageAt = new Date();
    await thread.save();
  }

  return {
    success: true,
    messageId,
    threadId: thread._id,
    emailAccountId: account?._id || null,
    response: sendResult.response,
  };
}

export async function ingestInboundEmail(businessId, {
  from,
  fromName,
  subject,
  body,
  html,
  externalMessageId,   // The RFC 822 Message-ID of THIS message.
  threadId,            // Provider-specific thread hint (Gmail threadId, etc.).
  inReplyTo,           // From the message's In-Reply-To header.
  references = [],     // From the message's References header (oldest → newest).
  timestamp = new Date(),
  emailAccountId,      // Which of OUR mailboxes received this message.
  headers,             // Optional Map of extra headers we want to persist.
  attachments = [],    // Cloudinary-uploaded files [{url, fileName, mimeType, size, isInline, contentId}].
  cc = [],             // [{name, address}] from parsed CC header — surfaced in the UI.
}) {
  const { matchCustomer } = await import('@/lib/omnichannel/customerMatching');
  const matched = await matchCustomer(businessId, {
    email: from,
    name: fromName,
    channel: 'email',
    createIfMissing: true,
  });

  const { recordChannelMessage } = await import('@/lib/omnichannel/conversationService');
  const Message = (await import('@/models/automation/Message')).default;

  // Threading resolution — try to find our outbound Message this reply relates
  // to, so the inbound folds into the same Conversation + EmailThread.
  //
  // Priority (highest wins):
  //   1. inReplyTo (immediate parent) — matches OUR outbound Message.messageId.
  //   2. Any id in References (walks the chain in reverse-chronological order).
  //   3. Provider-hinted threadId → matches an existing EmailThread.
  //   4. Fallback: create a new EmailThread.
  //
  // Priority 1 & 2 span mailboxes: a reply to Bob's outbound that lands in
  // Alice's shared inbox will still fold into the original thread.
  let parentMessage = null;
  if (inReplyTo) {
    parentMessage = await Message.findOne({ businessId, messageId: inReplyTo });
  }
  if (!parentMessage && references.length) {
    // Walk newest → oldest; whichever we find first is the closest ancestor.
    for (let i = references.length - 1; i >= 0; i--) {
      const ref = references[i];
      if (!ref) continue;
      const m = await Message.findOne({ businessId, messageId: ref });
      if (m) {
        parentMessage = m;
        break;
      }
    }
  }

  let thread = null;
  if (parentMessage?.emailThreadId) {
    thread = await EmailThread.findById(parentMessage.emailThreadId);
  }
  if (!thread && threadId) {
    thread = await EmailThread.findOne({ businessId, externalThreadId: threadId });
  }
  if (!thread) {
    thread = await EmailThread.create({
      businessId,
      emailAccountId: emailAccountId || null,
      leadId: matched.lead._id,
      subject,
      participants: [{ email: from, name: fromName }],
      externalThreadId: threadId || externalMessageId,
      lastMessageAt: timestamp,
      messageCount: 1,
    });
  } else {
    thread.messageCount = (thread.messageCount || 0) + 1;
    thread.lastMessageAt = timestamp;
    await thread.save();
  }

  const { message, conversation } = await recordChannelMessage({
    businessId,
    channel: 'email',
    // If we found the parent, reuse its conversation — this is what actually
    // groups the reply under the original outbound in the inbox UI.
    conversationId: parentMessage?.conversationId,
    leadId: matched.lead._id,
    contactId: matched.contact?._id,
    companyId: matched.company?._id,
    dealId: matched.deal?._id,
    // Prefer the real RFC Message-ID; the recordChannelMessage idempotency
    // guard (findOne by messageId) then dedupes if the same message is
    // synced twice — critical when IMAP fetch overlaps with a previous run.
    messageId: externalMessageId || `email_in_${Date.now()}`,
    direction: 'incoming',
    type: 'email',
    content: {
      body: body || html?.replace(/<[^>]+>/g, '') || '',
      // Sanitized HTML (dompurify) — safe to render via
      // dangerouslySetInnerHTML in the UI. Enables marketing / rich emails
      // to look normal instead of a stripped plain-text mess.
      html: html || '',
      participantId: from,
      participantEmail: from,
      participantName: fromName,
      // CC list from parsed headers — MessageBubble's EmailSenderHeader
      // renders it as a small dim "cc: name1, name2" line below the sender.
      cc: Array.isArray(cc) ? cc : [],
      // Persist every parsed attachment so the MessageBubble can render a
      // card per file. Even inline images from Gmail-style CID embeds land
      // here — user chose card-per-attachment over inline HTML rendering
      // so agents get a consistent UX across all file types.
      attachments: Array.isArray(attachments) ? attachments : [],
    },
    timestamp,
    subject,
    emailThreadId: thread._id,
    emailAccountId: emailAccountId || parentMessage?.emailAccountId || null,
    inReplyTo,
    references,
    headers,
  });

  // Fire-and-forget: schedule the SLA safety-net auto-reply. The worker
  // re-checks feature-enabled + guardrails at fire time, so this is safe
  // to call unconditionally — even when the feature is off, the enqueue
  // helper short-circuits without doing work.
  if (message?.direction === 'incoming' && conversation?._id) {
    try {
      const { scheduleAutoReplyForInbound } = await import('@/lib/emailAutoReply');
      // No await — we don't want the ingest path to block on queueing.
      scheduleAutoReplyForInbound({
        businessId,
        conversationId: conversation._id,
        messageId: message._id,
      });
    } catch (schedErr) {
      // Non-fatal; the customer message is already stored.
      console.warn('[ingestInboundEmail] auto-reply schedule failed:', schedErr.message);
    }
  }

  return { message, conversation, lead: matched.lead, thread };
}

export default { sendChannelEmail, ingestInboundEmail };
