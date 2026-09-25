import Lead from '@/models/automation/Lead';
import Broadcast from '@/models/automation/Broadcast';
import Business from '@/models/Business';
import EmailAccount from '@/models/omnichannel/EmailAccount';
import { sendCustomerEmail, buildUnsubscribeUrl } from '@/lib/integrations/email';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { createTransporterForAccount, formatFromHeader } from '@/lib/omnichannel/mailerFromAccount';

function applyVars(text, lead, business) {
  if (!text) return '';
  return text
    .replace(/\{\{name\}\}/gi, lead.name || '')
    .replace(/\{\{email\}\}/gi, lead.email || '')
    .replace(/\{\{phone\}\}/gi, lead.phone || '')
    .replace(/\{\{business\.name\}\}/gi, business?.businessName || '');
}

/**
 * Resolve a variable-mapping row against a lead. Used to fill Meta template
 * variables {{1}}, {{2}}, … with real values per recipient.
 */
function resolveVariableValue(mapping, lead) {
  if (!mapping) return '';
  if (mapping.source === 'literal') return mapping.literalValue || '';
  const path = String(mapping.source || '').split('.');
  if (path[0] === 'lead') {
    const key = path[1];
    if (!key) return '';
    if (key === 'name') return lead.name || '';
    if (key === 'email') return lead.email || '';
    if (key === 'phone') return lead.phone || '';
    // Support any first-level scalar on the lead (city, company, etc.)
    return String(lead[key] ?? '');
  }
  if (path[0] === 'custom') {
    const key = path.slice(1).join('.');
    return String(lead.customFields?.[key] ?? '');
  }
  return '';
}

/**
 * Build the ordered array of Meta template body variables for one lead.
 * Missing indexes fall back to lead.name so Meta never gets an empty string.
 */
export function resolveTemplateVariables(variableMapping, lead) {
  if (!Array.isArray(variableMapping) || !variableMapping.length) return null;
  const maxIndex = Math.max(...variableMapping.map((m) => Number(m.index) || 0));
  return Array.from({ length: maxIndex }, (_, i) => {
    const mapping = variableMapping.find((m) => Number(m.index) === i + 1);
    const value = resolveVariableValue(mapping, lead);
    return value || lead.name || 'Customer';
  });
}

export async function buildAudience(businessId, audience, { channel = 'whatsapp' } = {}) {
  const query = { businessId, archived: { $ne: true } };

  // Guard: 'tags' / 'manual' with an empty selector must return zero, not everyone.
  if (audience.type === 'manual') {
    if (!audience.leadIds?.length) return [];
    query._id = { $in: audience.leadIds };
  }
  if (audience.type === 'tags') {
    if (!audience.tags?.length) return [];
    query.tags = { $in: audience.tags };
  }
  if (audience.type === 'filter' && audience.filters) {
    const f = audience.filters;
    if (f.status) query.status = f.status;
    if (f.source) query.source = f.source;
    if (f.tags?.length) query.tags = { $in: f.tags };
    if (f.assignedTo) query.assignedTo = f.assignedTo;
  }

  // Meta compliance — never message opted-out leads on WhatsApp
  if (channel === 'whatsapp' || channel === 'both') {
    query.optedOutOfWhatsApp = { $ne: true };
  }
  // CAN-SPAM / GDPR compliance — never email leads who unsubscribed
  if (channel === 'email' || channel === 'both') {
    query.optedOutOfEmail = { $ne: true };
  }

  // Engagement filter — only leads active within the last N days.
  // Cuts Meta quality drops by ensuring the recipient is a warm contact.
  if (audience.engagementDays > 0) {
    const cutoff = new Date(Date.now() - audience.engagementDays * 24 * 60 * 60 * 1000);
    query.lastContactedAt = { $gte: cutoff };
  }

  return Lead.find(query).limit(audience.limit || 5000).lean();
}

/**
 * Resolve the "send from this mailbox with this signature" context ONCE for an
 * email broadcast. Builds the account transporter and resolves the chosen
 * signature a single time — never per-recipient — so a 5k-person campaign
 * decrypts credentials and renders the signature exactly once. Returns null
 * when no mailbox is selected, in which case the engine keeps the legacy
 * business-wide email transport (sendCustomerEmail).
 */
async function resolveEmailSender(broadcast) {
  const accountId = broadcast.content?.emailAccountId;
  if (!accountId) return null;
  const account = await EmailAccount.findById(accountId);
  if (!account) return null;
  try {
    return {
      transporter: await createTransporterForAccount(account),
      from: formatFromHeader(account),
      // Instance method: signatureId → default → legacy → ''. Resolved once.
      signatureHtml: account?.resolveSignatureHtml
        ? account.resolveSignatureHtml(broadcast.content?.signatureId)
        : (account?.signature || ''),
    };
  } catch (err) {
    console.warn('[Broadcast] could not build email sender, falling back to legacy transport:', err.message);
    return null;
  }
}

/**
 * Send one broadcast email from the selected mailbox, with the resolved
 * signature appended and a compliant unsubscribe footer. Mirrors the inbox
 * provenance of sendCustomerEmail (origin='broadcast') so the send shows the
 * "Broadcast" pill and threads on reply, without going through the legacy
 * business-wide transport.
 */
async function sendBroadcastEmailViaAccount(sender, lead, business, body, subject, bodyHtml = null) {
  const unsubscribeUrl = buildUnsubscribeUrl(lead, business);
  const unsubHtml = unsubscribeUrl
    ? `<p style="color:#94a3b8;font-size:11px;margin-top:16px;">Don't want these emails? <a href="${unsubscribeUrl}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a></p>`
    : '';
  // Rich HTML from the WYSIWYG editor is used verbatim; a plain-text body is
  // escaped into <br>-separated HTML. `body` is always the text/plain part.
  const bodyContentHtml = bodyHtml || String(body || '').replace(/\n/g, '<br>');
  const html = `<div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#334155;font-size:15px;line-height:1.6;">${bodyContentHtml}${sender.signatureHtml ? `<br><br>${sender.signatureHtml}` : ''}${unsubHtml}</div>`;
  const text = String(body || '') + (unsubscribeUrl ? `\n\n---\nUnsubscribe: ${unsubscribeUrl}` : '');

  const info = await sender.transporter.sendMail({
    from: sender.from,
    to: lead.email,
    subject,
    html,
    text,
    headers: unsubscribeUrl
      ? {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      : undefined,
  });

  // Inbox provenance — guarded so a recording hiccup never fails the send.
  if (lead?._id && business?._id) {
    try {
      const { recordChannelMessage } = await import('@/lib/omnichannel/conversationService');
      await recordChannelMessage({
        businessId: business._id,
        channel: 'email',
        leadId: lead._id,
        messageId: info.messageId || `email_out_${Date.now()}`,
        direction: 'outgoing',
        type: 'email',
        content: { body, participantId: lead.email, participantEmail: lead.email, participantName: lead.name },
        subject,
        status: 'sent',
        origin: 'broadcast',
        folder: 'sent',
      });
    } catch (recordErr) {
      console.warn('[Broadcast] recordChannelMessage failed:', recordErr.message);
    }
  }
  return info;
}

export async function sendBroadcast(broadcastId) {
  const broadcast = await Broadcast.findById(broadcastId);
  if (!broadcast || broadcast.status === 'sent') return broadcast;

  const business = await Business.findById(broadcast.businessId);
  if (!business) throw new Error('Business not found');

  await Broadcast.updateOne({ _id: broadcastId }, { $set: { status: 'sending', sentAt: new Date() } });

  const leads = broadcast.testMode
    ? (broadcast.testRecipients || []).map((r) => ({ name: r.name, email: r.email, phone: r.phone }))
    : await buildAudience(broadcast.businessId, broadcast.audience, { channel: broadcast.channel });

  // Resolve the "from this mailbox + signature" context ONCE for email sends.
  const emailSender = (broadcast.channel === 'email' || broadcast.channel === 'both')
    ? await resolveEmailSender(broadcast)
    : null;

  const recipients = [];
  let sent = 0;
  let failed = 0;
  let qualityFailures = 0; // Meta-quality drops specifically (#131049 / #131050 / #131026)
  let abortReason = null;

  // Guardrails
  const CHECK_EVERY = 10;                // Sample failure rate every N sends
  const MIN_SAMPLE = 10;                 // Don't judge before at least this many attempts
  const QUALITY_FAIL_THRESHOLD = 0.20;   // Abort if >20% of attempted sends are Meta quality drops
  const THROTTLE_MS = 400;               // Small delay between sends to avoid burst-flagging

  const isQualityError = (errText) => {
    const s = String(errText || '');
    return /131049|131050|131026|healthy ecosystem|undeliverable/i.test(s);
  };

  for (let i = 0; i < leads.length; i += 1) {
    const lead = leads[i];
    const recipient = { leadId: lead._id, email: lead.email, phone: lead.phone, name: lead.name, status: 'pending' };
    try {
      if (broadcast.channel === 'email' || broadcast.channel === 'both') {
        if (lead.email) {
          const body = applyVars(broadcast.content?.body || '', lead, business);
          const subject = applyVars(broadcast.content?.subject || broadcast.name, lead, business);
          const bodyHtml = broadcast.content?.bodyHtml
            ? applyVars(broadcast.content.bodyHtml, lead, business)
            : null;
          if (emailSender) {
            // Selected mailbox + signature path.
            try {
              await sendBroadcastEmailViaAccount(emailSender, lead, business, body, subject, bodyHtml);
              recipient.status = 'sent';
              sent++;
            } catch (err) {
              recipient.status = 'failed';
              recipient.error = err.message;
              failed++;
            }
          } else {
            // Legacy business-wide transport (no mailbox picked / not configured).
            const result = await sendCustomerEmail(lead, business, body, subject, { origin: 'broadcast' });
            recipient.status = result.success ? 'sent' : 'failed';
            recipient.error = result.error;
            if (result.success) sent++;
            else failed++;
          }
        } else {
          recipient.status = 'skipped';
          recipient.error = 'No email';
        }
      }
      if (broadcast.channel === 'whatsapp' || broadcast.channel === 'both') {
        if (lead.phone) {
          const msg = applyVars(broadcast.content?.whatsappTemplate || broadcast.content?.body || '', lead, business);
          const resolvedVars = resolveTemplateVariables(broadcast.content?.variableMapping, lead);
          const result = await sendAutoWhatsApp(
            lead,
            business,
            msg,
            broadcast.content?.whatsappTemplateName,
            broadcast.content?.whatsappHeaderMediaUrl || null,
            broadcast.content?.whatsappTemplateLanguage || 'en',
            null,
            resolvedVars,
            null,
            { origin: 'broadcast' }
          );
          if (recipient.status !== 'sent') {
            recipient.status = result.success ? 'sent' : 'failed';
            recipient.error = result.error || result.reason;
            if (result.success && result.messageId) {
              recipient.metaMessageId = result.messageId;
            }
            if (!result.success) recipient.failedAt = new Date();
          }
          if (result.success) sent++;
          else failed++;
        }
      }
      recipient.sentAt = new Date();
    } catch (err) {
      recipient.status = 'failed';
      recipient.error = err.message;
      failed++;
    }
    recipients.push(recipient);

    // Count Meta quality-based drops separately for the auto-pause guardrail
    if (recipient.status === 'failed' && isQualityError(recipient.error)) {
      qualityFailures += 1;
    }

    // Auto-pause: if Meta is dropping too many, stop the rest of this broadcast.
    // Continuing would just burn quality rating further.
    const attempted = i + 1;
    if (attempted >= MIN_SAMPLE && attempted % CHECK_EVERY === 0) {
      const qualityRate = qualityFailures / attempted;
      if (qualityRate > QUALITY_FAIL_THRESHOLD) {
        abortReason = `Auto-paused: ${qualityFailures} of ${attempted} sends were Meta quality-drops (>${Math.round(QUALITY_FAIL_THRESHOLD * 100)}%). Remaining ${leads.length - attempted} recipients skipped to protect your business quality rating.`;
        console.warn('[Broadcast]', abortReason);
        break;
      }
    }

    // Throttle: small delay between sends to avoid burst-triggered rate limits.
    // For <100 recipients this adds ~40s max — safe for HTTP timeout on serverless.
    if (i + 1 < leads.length) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }

  await Broadcast.updateOne(
    { _id: broadcastId },
    {
      $set: {
        status: abortReason ? 'failed' : (failed === leads.length ? 'failed' : 'sent'),
        completedAt: new Date(),
        recipients,
        abortReason: abortReason || undefined,
        'analytics.total': leads.length,
        'analytics.sent': sent,
        'analytics.failed': failed,
        'analytics.qualityDrops': qualityFailures,
      },
    }
  );

  return Broadcast.findById(broadcastId);
}

export async function retryFailedRecipients(broadcastId) {
  const broadcast = await Broadcast.findById(broadcastId);
  if (!broadcast) return null;

  const failedRecipients = (broadcast.recipients || []).filter((r) => r.status === 'failed');
  if (!failedRecipients.length) return broadcast;

  const business = await Business.findById(broadcast.businessId);
  for (const recipient of failedRecipients) {
    const lead = recipient.leadId
      ? await Lead.findById(recipient.leadId)
      : { name: recipient.name, email: recipient.email, phone: recipient.phone };
    if (!lead) continue;
    try {
      if (broadcast.channel === 'email' && lead.email) {
        await sendCustomerEmail(lead, business, broadcast.content?.body, broadcast.content?.subject, { origin: 'broadcast' });
        recipient.status = 'sent';
      }
      if (broadcast.channel === 'whatsapp' && lead.phone) {
        await sendAutoWhatsApp(
          lead,
          business,
          broadcast.content?.whatsappTemplate || broadcast.content?.body,
          broadcast.content?.whatsappTemplateName,
          null,
          broadcast.content?.whatsappTemplateLanguage || 'en',
          null,
          null,
          null,
          { origin: 'broadcast' }
        );
        recipient.status = 'sent';
      }
    } catch {
      /* keep failed */
    }
  }

  await Broadcast.updateOne({ _id: broadcastId }, { $set: { recipients: broadcast.recipients } });
  return Broadcast.findById(broadcastId);
}

export default { buildAudience, sendBroadcast, retryFailedRecipients };
