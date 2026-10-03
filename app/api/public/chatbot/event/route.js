import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withRateLimit } from '@/lib/rateLimit';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const EVENT_FIELDS = {
  conversation_started: 'settings.chatbot.stats.conversationsStarted',
};

async function postHandler(request) {
  try {
    const { businessId, event } = await request.json();
    if (!businessId || !event || !EVENT_FIELDS[event]) {
      return NextResponse.json({ success: false }, { status: 400, headers: CORS });
    }

    await dbConnect();
    await Business.findByIdAndUpdate(businessId, {
      $inc: { [EVENT_FIELDS[event]]: 1 },
    });

    return NextResponse.json({ success: true }, { headers: CORS });
  } catch {
    return NextResponse.json({ success: false }, { status: 500, headers: CORS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export const POST = withRateLimit(60, 60, postHandler);
