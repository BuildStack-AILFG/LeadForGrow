import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Lead from '@/models/automation/Lead';
import Message from '@/models/automation/Message';
import { qualifyLead } from '@/lib/ai/qualify';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const { leadId } = await req.json();
    if (!leadId) return NextResponse.json({ success: false, error: 'leadId required' }, { status: 400 });

    const lead = await Lead.findOne({ _id: leadId, businessId: req.user.businessId }).lean();
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    const messages = await Message.find({ businessId: req.user.businessId, leadId }).sort({ timestamp: -1 }).limit(30).lean();
    const result = await qualifyLead({ lead, messages: messages.reverse(), notes: lead.notes || [] });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
