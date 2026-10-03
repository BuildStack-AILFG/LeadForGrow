import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Business from '@/models/Business';
import { prepareMeetingBriefing, processMeetingAfter } from '@/lib/ai/meetingAssistant';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { action = 'briefing', leadId, meetingId, notes } = body;
    const business = await Business.findById(req.user.businessId).select('businessName').lean();
    const businessName = business?.businessName || 'Business';

    if (action === 'after') {
      const result = await processMeetingAfter({ businessId: req.user.businessId, businessName, leadId, meetingId, notes });
      return NextResponse.json({ success: true, data: result });
    }

    const result = await prepareMeetingBriefing({ businessId: req.user.businessId, businessName, leadId, meetingId });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
