import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Lead from '@/models/automation/Lead';
import { withPlanAccess } from '@/lib/accessControl';
import { mergeChatbotConfig, DEFAULT_CHATBOT_CONFIG } from '@/lib/chatbot/defaults';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;

    const business = await Business.findById(businessId).select('businessName settings.chatbot').lean();
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const config = mergeChatbotConfig(business.settings?.chatbot);

    const [totalBotLeads, weekBotLeads] = await Promise.all([
      Lead.countDocuments({ businessId, source: 'bot' }),
      Lead.countDocuments({
        businessId,
        source: 'bot',
        receivedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        businessId: business._id.toString(),
        businessName: business.businessName,
        config,
        stats: {
          totalLeads: totalBotLeads,
          weekLeads: weekBotLeads,
          ...config.stats,
        },
      },
    });
  } catch (error) {
    console.error('[Chatbot Admin GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const body = await req.json();

    const business = await Business.findById(businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const current = mergeChatbotConfig(business.settings?.chatbot);
    const incoming = body.config || body;

    const next = mergeChatbotConfig({
      ...current,
      ...incoming,
      appearance: { ...current.appearance, ...(incoming.appearance || {}) },
      messages: { ...current.messages, ...(incoming.messages || {}) },
      flow: {
        ...current.flow,
        ...(incoming.flow || {}),
        questions: incoming.flow?.questions ?? current.flow.questions,
      },
      stats: { ...current.stats, ...(incoming.stats || {}) },
    });

    if (incoming.published === true && !current.published) {
      next.lastPublishedAt = new Date();
    }

    if (!business.settings) business.settings = {};
    business.settings.chatbot = next;
    business.markModified('settings.chatbot');
    await business.save();

    return NextResponse.json({
      success: true,
      data: { config: next, businessId: business._id.toString() },
      message: 'Chatbot settings saved',
    });
  } catch (error) {
    console.error('[Chatbot Admin PUT]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export { DEFAULT_CHATBOT_CONFIG };
