import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withAuth } from '@/lib/auth';
import Business from '@/models/Business';
import Message from '@/models/automation/Message';
import Lead from '@/models/automation/Lead';
import Deal from '@/models/automation/Deal';
import { generateSummary } from '@/lib/ai/summarize';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { type, entityType, entityId, content, leadId, dealId } = body;
    if (!type) return NextResponse.json({ success: false, error: 'type required' }, { status: 400 });

    const business = await Business.findById(req.user.businessId).select('businessName').lean();
    let textContent = content;

    if (!textContent && type === 'conversation' && (entityId || leadId)) {
      const filter = { businessId: req.user.businessId };
      if (entityId) filter.conversationId = entityId;
      else filter.leadId = leadId;
      const messages = await Message.find(filter).sort({ timestamp: 1 }).limit(50).lean();
      textContent = messages.map((m) => `${m.direction}: ${m.content?.body || ''}`).join('\n');
    }

    if (!textContent && type === 'account' && leadId) {
      const lead = await Lead.findOne({ _id: leadId, businessId: req.user.businessId }).lean();
      const messages = await Message.find({ businessId: req.user.businessId, leadId }).sort({ timestamp: -1 }).limit(20).lean();
      textContent = `Lead: ${JSON.stringify(lead)}\nMessages:\n${messages.map((m) => m.content?.body).join('\n')}`;
    }

    if (!textContent && type === 'deal' && dealId) {
      const deal = await Deal.findOne({ _id: dealId, businessId: req.user.businessId }).lean();
      textContent = JSON.stringify(deal);
    }

    if (!textContent) return NextResponse.json({ success: false, error: 'content or entity required' }, { status: 400 });

    const result = await generateSummary({
      businessId: req.user.businessId,
      businessName: business?.businessName || 'Business',
      type,
      content: textContent,
      entityType: entityType || type,
      entityId: entityId || leadId || dealId,
      persist: true,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
