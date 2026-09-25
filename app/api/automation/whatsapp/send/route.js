import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import { sendAutoWhatsApp } from '@/lib/integrations/whatsapp';
import { withTenantAuth } from '@/lib/auth';
import { emitChatMessage } from '@/lib/realtime/publish';

export const POST = withTenantAuth(async (req) => {
  try {
    const { leadId, message } = await req.json();

    if (!leadId || !message) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    await dbConnect();

    const lead = await Lead.findOne({ _id: leadId, businessId: req.user.businessId });
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });

    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    // Sent by an agent from the lead page.
    const result = await sendAutoWhatsApp(lead, business, message, null, null, 'en', null, null, null, { origin: 'user' });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send WhatsApp' }, { status: 500 });
    }

    await emitChatMessage(req.user.businessId, { leadId, direction: 'outbound' });
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[WhatsApp Send API] Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
});
