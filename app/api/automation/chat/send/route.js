import { NextResponse } from 'next/server';
import { dbConnect } from '../../../../../lib/mongodb';
import Business from '../../../../../models/Business';
import Lead from '../../../../../models/automation/Lead';
import { sendAutoWhatsApp } from '../../../../../lib/integrations/whatsapp';
import { withPermissions } from '../../../../../lib/rbac';
import { emitChatMessage } from '../../../../../lib/realtime/publish';

/**
 * POST /api/automation/chat/send
 * Send a manual reply via WhatsApp
 */
async function handler(req) {
  try {
    const { user } = req;
    const body = await req.json();
    const { leadId, message, templateName, templateLanguage, headerMediaUrl, variables } = body;

    // Either a free-text message OR a template name is required
    if (!leadId || (!message && !templateName)) {
      return NextResponse.json(
        { success: false, error: 'Lead ID and either message text or templateName are required' },
        { status: 400 },
      );
    }

    await dbConnect();

    const lead = await Lead.findOne({ _id: leadId, businessId: user.businessId });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found or unauthorized' }, { status: 404 });
    }

    const business = await Business.findById(user.businessId);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Send template if templateName provided (allowed outside 24h window),
    // otherwise send free text (only allowed inside 24h window).
    const result = await sendAutoWhatsApp(
      lead,
      business,
      message || '',
      templateName || null,
      headerMediaUrl || null,
      templateLanguage || 'en',
      null,
      Array.isArray(variables) ? variables : null,
      null,
      { origin: 'user' }, // an agent typed this
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send message' }, { status: 500 });
    }

    await emitChatMessage(user.businessId, {
      leadId,
      messageId: result.messageId,
      direction: 'outbound',
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('[Chat API] Error sending message:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
