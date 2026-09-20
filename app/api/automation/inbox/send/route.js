import { workingDraftFilter } from '@/lib/omnichannel/draftFields';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import Conversation from '@/models/omnichannel/Conversation';
import EmailDraft from '@/models/omnichannel/EmailDraft';
import { withPermissions } from '@/lib/rbac';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { sendMetaMediaMessage } from '@/lib/integrations/whatsappMedia';
import { recordChannelMessage } from '@/lib/omnichannel/conversationService';
import { sendChannelEmail } from '@/lib/omnichannel/emailService';
import { mimeToMessageType } from '@/lib/omnichannel/mediaTypes';

async function handler(req) {
  try {
    const { user } = req;
    const body = await req.json();
    const {
      conversationId,
      leadId,
      channel = 'whatsapp',
      message = '',
      isInternal = false,
      subject,
      replyToMessageId,
      replyAll = false,
      cc,
      bcc,
      mediaUrl,
      mimeType,
      fileName,
      messageType,
      scheduledAt,
      draftId,
      bodyHtml,
      attachments = [],
      // Template-based send fields — used when the 24h WhatsApp window is closed
      templateName,
      templateLanguage,
      templateHeaderMediaUrl,
      templateVariables,
      // Multi-user email: composer's From-picker sends this so the sender
      // resolver in sendChannelEmail can pick the right mailbox.
      emailAccountId,
      // Multi-signature: composer's signature-picker sends this so the
      // sender appends the specific signature the user chose. When absent,
      // sendChannelEmail falls back to the mailbox's default signature.
      signatureId,
    } = body;

    const hasMedia = !!mediaUrl;
    const hasTemplate = !!templateName;
    if (!message?.trim() && !hasMedia && !hasTemplate && !isInternal) {
      return NextResponse.json({ success: false, error: 'Message, media, or template required' }, { status: 400 });
    }

    await dbConnect();
    const business = await Business.findById(user.businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    let conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, businessId: user.businessId })
      : null;

    const resolvedLeadId = leadId || conversation?.leadId;
    const lead = resolvedLeadId
      ? await Lead.findOne({ _id: resolvedLeadId, businessId: user.businessId })
      : null;

    if (!lead && !isInternal) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const activeChannel = conversation?.channel || channel;
    const resolvedType = messageType || mimeToMessageType(mimeType, fileName);

    if (scheduledAt && activeChannel === 'email') {
      const draft = await EmailDraft.create({
        businessId: user.businessId,
        conversationId: conversation?._id,
        leadId: lead._id,
        // Pin the mailbox so the scheduled sender uses the same From the user
        // chose. Falls back to the conversation's pinned account, then the
        // user's default, inside sendChannelEmail when absent.
        emailAccountId: emailAccountId || conversation?.emailAccountId || undefined,
        to: [{ email: lead.email, name: lead.name }],
        cc: cc || [],
        bcc: bcc || [],
        subject,
        bodyHtml: bodyHtml || message,
        bodyText: message,
        attachments,
        replyToMessageId,
        scheduledAt: new Date(scheduledAt),
        createdBy: user.userId,
      });
      return NextResponse.json({ success: true, data: draft, scheduled: true });
    }

    if (isInternal) {
      const result = await recordChannelMessage({
        businessId: user.businessId,
        channel: activeChannel,
        leadId: lead._id,
        conversationId: conversation?._id,
        messageId: `internal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        direction: 'outgoing',
        type: 'text',
        content: { body: message.trim() },
        isInternal: true,
        performedBy: user.userId,
      });
      return NextResponse.json({ success: true, data: result.message });
    }

    let externalMessageId;

    if (activeChannel === 'whatsapp') {
      if (hasMedia) {
        const result = await sendMetaMediaMessage(lead, business, {
          mediaUrl,
          mimeType,
          fileName,
          caption: message.trim() || undefined,
          messageType: resolvedType,
        });
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error || 'Media send failed' }, { status: 500 });
        }
        externalMessageId = result.messageId;
      } else {
        // Template send is required outside the 24h window; free text works within it.
        const result = await sendAutoWhatsApp(
          lead,
          business,
          message.trim(),
          templateName || null,
          templateHeaderMediaUrl || null,
          templateLanguage || 'en',
          null,
          Array.isArray(templateVariables) ? templateVariables : null,
        );
        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error || 'Send failed' }, { status: 500 });
        }
        externalMessageId = result.messageId;
      }
    } else if (activeChannel === 'email') {
      const emailResult = await sendChannelEmail({
        business,
        lead,
        conversation,
        subject: subject || conversation?.lastMessagePreview || 'Follow up',
        body: bodyHtml || message.trim(),
        replyToMessageId,
        cc,
        bcc,
        attachments,
        isHtml: !!bodyHtml,
        emailAccountId,      // explicit picker choice, if any
        userId: user.userId, // enables the "user's default" fallback
        signatureId,         // explicit signature choice, if any
      });
      if (!emailResult.success) {
        return NextResponse.json({ success: false, error: emailResult.error }, { status: 500 });
      }
      externalMessageId = emailResult.messageId;
    } else if (activeChannel === 'instagram') {
      const { sendInstagramMessage, sendInstagramMedia, sendInstagramCommentReply } = await import('@/lib/instagram/send');
      const { IG_COMMENT_PARTICIPANT_PREFIX } = await import('@/lib/instagram/handler');
      const participantId = conversation?.participantId || '';
      const isCommentThread = participantId.startsWith(IG_COMMENT_PARTICIPANT_PREFIX);

      let igResult;
      if (isCommentThread) {
        // Reply to the most recent comment on this thread — stored on the
        // conversation by the webhook handler so we don't have to walk Messages.
        const targetCommentId = conversation?.metadata?.get?.('lastCommentId')
          || conversation?.metadata?.lastCommentId;
        if (!targetCommentId) {
          return NextResponse.json({ success: false, error: 'No comment to reply to on this thread' }, { status: 400 });
        }
        if (hasMedia) {
          return NextResponse.json({ success: false, error: 'Media replies to comments are not supported by Instagram' }, { status: 400 });
        }
        igResult = await sendInstagramCommentReply(business, targetCommentId, message.trim());
      } else {
        igResult = hasMedia
          ? await sendInstagramMedia(business, participantId, { mediaUrl, messageType: resolvedType })
          : await sendInstagramMessage(business, participantId, message.trim());
      }

      if (!igResult.success) {
        // A human's reply isn't limited, but a platform block seen here must still pause automation + alert.
        const { recordSendResult } = await import('@/lib/social/sendSafety');
        await recordSendResult(business, 'instagram', igResult);
        return NextResponse.json({ success: false, error: igResult.error }, { status: 500 });
      }
      externalMessageId = igResult.messageId;
    } else if (activeChannel === 'facebook') {
      const { sendMessengerMessage, sendMessengerMedia, sendFacebookCommentReply } = await import('@/lib/facebook/send');
      const { FB_COMMENT_PARTICIPANT_PREFIX } = await import('@/lib/facebook/handler');
      const participantId = conversation?.participantId || '';
      const isCommentThread = participantId.startsWith(FB_COMMENT_PARTICIPANT_PREFIX);

      let fbResult;
      if (isCommentThread) {
        const targetCommentId = conversation?.metadata?.get?.('lastCommentId')
          || conversation?.metadata?.lastCommentId;
        if (!targetCommentId) {
          return NextResponse.json({ success: false, error: 'No comment to reply to on this thread' }, { status: 400 });
        }
        fbResult = await sendFacebookCommentReply(business, targetCommentId, message.trim());
      } else {
        fbResult = hasMedia
          ? await sendMessengerMedia(business, participantId, { mediaUrl, messageType: resolvedType })
          : await sendMessengerMessage(business, participantId, message.trim());
      }

      if (!fbResult.success) {
        const { recordSendResult } = await import('@/lib/social/sendSafety');
        await recordSendResult(business, 'facebook', fbResult);
        return NextResponse.json({ success: false, error: fbResult.error }, { status: 500 });
      }
      externalMessageId = fbResult.messageId;
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported channel' }, { status: 400 });
    }

    const result = await recordChannelMessage({
      businessId: user.businessId,
      channel: activeChannel,
      leadId: lead._id,
      contactId: lead.contactId,
      companyId: lead.companyId,
      conversationId: conversation?._id,
      messageId: externalMessageId || `out_${Date.now()}`,
      direction: 'outgoing',
      type: hasMedia ? resolvedType : (activeChannel === 'email' ? 'email' : 'text'),
      content: {
        body: message.trim() || fileName || '',
        html: activeChannel === 'email' && bodyHtml ? bodyHtml : undefined,
        mediaUrl,
        mimeType,
        fileName,
        caption: message.trim() || undefined,
        participantId: conversation?.participantId,
      },
      status: 'sent',
      performedBy: user.userId,
      subject,
      replyToMessageId,
      folder: activeChannel === 'email' ? 'sent' : undefined,
    });

    if (conversation) {
      await Conversation.findByIdAndUpdate(conversation._id, {
        $set: { inboxStatus: 'intervened' },
      });
    }

    if (draftId) {
      await EmailDraft.findOneAndDelete({ _id: draftId, businessId: user.businessId });
    }
    // The auto-saved working draft of this thread is obsolete once the reply is sent (drafts used to pile up forever).
    if (activeChannel === 'email' && conversation?._id) {
      await EmailDraft.deleteMany(workingDraftFilter({ businessId: user.businessId, conversationId: conversation._id, userId: user.userId }));
    }

    return NextResponse.json({ success: true, data: result.message, messageId: externalMessageId });
  } catch (error) {
    console.error('[Inbox API] send:', error);
    return NextResponse.json({ success: false, error: error.message || 'Send failed' }, { status: 500 });
  }
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
