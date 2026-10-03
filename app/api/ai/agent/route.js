import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Business from '@/models/Business';
import Message from '@/models/automation/Message';
import { runSalesAgent } from '@/lib/ai/agent';
import { getAiSettings } from '@/lib/ai/settings';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const aiSettings = await getAiSettings(req.user.businessId);
    if (aiSettings.enabled === false || aiSettings.agentEnabled === false) {
      return NextResponse.json({ success: false, error: 'AI agent is disabled' }, { status: 403 });
    }

    const body = await req.json();
    const { message, leadId, conversationId, channel } = body;
    if (!message?.trim()) return NextResponse.json({ success: false, error: 'message required' }, { status: 400 });

    const business = await Business.findById(req.user.businessId).select('businessName').lean();
    let conversationHistory = body.messages || [];
    if (!conversationHistory.length && (conversationId || leadId)) {
      const filter = { businessId: req.user.businessId };
      if (conversationId) filter.conversationId = conversationId;
      else filter.leadId = leadId;
      conversationHistory = await Message.find(filter).sort({ timestamp: -1 }).limit(20).lean();
      conversationHistory.reverse();
    }

    const result = await runSalesAgent({
      businessId: req.user.businessId,
      businessName: business?.businessName || 'Business',
      message: message.trim(),
      leadId,
      conversationHistory,
      channel,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
