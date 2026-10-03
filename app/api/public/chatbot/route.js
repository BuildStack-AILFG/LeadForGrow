import { NextResponse } from 'next/server';
import { ingestLead } from '@/lib/leadProcessor';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { mergeChatbotConfig } from '@/lib/chatbot/defaults';
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
    const { businessId, name, email, phone, responses, supportType, supportMessage, transcript } = body;

    if (!businessId || !name || (!email && !phone)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
      }, { status: 400, headers: CORS });
    }

    const business = await Business.findById(businessId).select('settings.chatbot businessName').lean();
    if (!business) {
      return NextResponse.json({ success: false, error: 'Invalid Business ID' }, { status: 404, headers: CORS });
    }

    const config = mergeChatbotConfig(business.settings?.chatbot);
    if (!config.enabled || !config.published) {
      return NextResponse.json({
        success: false,
        error: 'Chatbot is not active',
      }, { status: 403, headers: CORS });
    }

    const leadData = {
      name,
      email,
      phone,
      serviceInterest: supportType === 'technical' ? 'Technical Support' : supportType === 'sales' ? 'Sales Support' : 'Chatbot Inquiry',
      message: supportMessage || '',
      metadata: {
        botResponses: responses || [],
        supportType,
        supportMessage,
        chatTranscript: transcript || [],
      },
    };

    const metadata = {
      source: 'bot',
      sourceDetails: 'Website Chatbot',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    };

    const result = await ingestLead(leadData, businessId, metadata);

    if (result.success) {
      Business.findByIdAndUpdate(businessId, {
        $inc: { 'settings.chatbot.stats.leadsCaptured': 1 },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: config.messages?.thankYou || 'Lead captured successfully',
      }, { status: 201, headers: CORS });
    }

    return NextResponse.json({ success: false, error: 'Failed to process lead' }, { status: 500, headers: CORS });
  } catch (error) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export const POST = withRateLimit(5, 60, postHandler);
