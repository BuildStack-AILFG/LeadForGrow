import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Business from '@/models/Business';
import Message from '@/models/automation/Message';
import { analyzeConversation } from '@/lib/ai/analysis';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { leadId, conversationId, messages: provided } = body;

    let messages = provided || [];
    if (!messages.length && (conversationId || leadId)) {
      const filter = { businessId: req.user.businessId };
      if (conversationId) filter.conversationId = conversationId;
      else filter.leadId = leadId;
      messages = await Message.find(filter).sort({ timestamp: -1 }).limit(40).lean();
      messages.reverse();
    }

    const business = await Business.findById(req.user.businessId).select('businessName').lean();
    const result = await analyzeConversation({
      businessId: req.user.businessId,
      businessName: business?.businessName || 'Business',
      leadId,
      messages,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
