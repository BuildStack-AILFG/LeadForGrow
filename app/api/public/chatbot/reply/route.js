import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { mergeChatbotConfig } from '@/lib/chatbot/defaults';
import { runSalesAgent } from '@/lib/ai/agent';
import { withRateLimit } from '@/lib/rateLimit';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function postHandler(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { businessId, message, history } = body;

    if (!businessId || !message?.trim()) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400, headers: CORS });
    }

    const business = await Business.findById(businessId).select('settings.chatbot settings.ai businessName').lean();
    if (!business) {
      return NextResponse.json({ success: false, error: 'Invalid Business ID' }, { status: 404, headers: CORS });
    }

    const config = mergeChatbotConfig(business.settings?.chatbot);
    if (!config.enabled || !config.published || !config.flow.aiEnabled) {
      return NextResponse.json({ success: false, error: 'AI replies are not enabled for this chatbot' }, { status: 403, headers: CORS });
    }

    const conversationHistory = Array.isArray(history)
      ? history.slice(-10).map((m) => ({ direction: m.type === 'user' ? 'incoming' : 'outgoing', content: { body: m.text } }))
      : [];

    const ai = await runSalesAgent({
      businessId,
      businessName: business.businessName || 'us',
      message: message.trim(),
      conversationHistory,
      channel: 'chatbot',
    });

    return NextResponse.json({
      success: true,
      reply: ai.reply,
      handoff: !!ai.handoff,
    }, { headers: CORS });
  } catch (error) {
    console.error('Chatbot AI reply error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export const POST = withRateLimit(20, 60, postHandler);
