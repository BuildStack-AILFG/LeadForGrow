import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Business from '@/models/Business';
import Message from '@/models/automation/Message';
import { generateReply } from '@/lib/ai/reply';
import { getAiSettings } from '@/lib/ai/settings';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const aiSettings = await getAiSettings(req.user.businessId);
    if (aiSettings.enabled === false || aiSettings.replyAssistEnabled === false) {
      return NextResponse.json({ success: false, error: 'AI reply assist is disabled' }, { status: 403 });
    }

    const body = await req.json();
    const { style = 'smart', channel, customerName, lastMessage, leadId, conversationId } = body;

    const business = await Business.findById(req.user.businessId).select('businessName').lean();
    let messages = body.messages || [];
    if (conversationId || leadId) {
      const filter = { businessId: req.user.businessId };
      if (conversationId) filter.conversationId = conversationId;
      else filter.leadId = leadId;
      messages = await Message.find(filter).sort({ timestamp: -1 }).limit(20).lean();
      messages.reverse();
    }

    const result = await generateReply({
      businessId: req.user.businessId,
      businessName: business?.businessName || 'Business',
      channel,
      style,
      customerName,
      lastMessage: lastMessage || messages.filter((m) => m.direction === 'incoming').pop()?.content?.body,
      messages,
      leadId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
