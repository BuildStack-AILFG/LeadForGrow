import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { encryptOnce } from '@/lib/encryption';
import { serializeCommentRule, sanitizeCommentRules } from '@/lib/automation/commentRules';
import { getSafetySummary } from '@/lib/social/sendSafety';

export const GET = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const fb = business.integrationCredentials?.facebook || {};
    const ads = business.integrationCredentials?.facebookAds || {};

    const enabled = fb.enabled || (ads.enabled && ads.pageId);
    const facebook = {
      enabled: !!enabled,
      pageId: fb.pageId || ads.pageId,
      pageName: fb.pageName || ads.pageName,
      accessToken: fb.accessToken ? '••••' : undefined,
      // Whether inbound webhooks can be verified. The secret itself is never sent.
      hasAppSecret: Boolean(fb.appSecret || ads.appSecret),
      platformAppSecret: Boolean(process.env.META_APP_SECRET),
      webhookStatus: fb.webhookStatus || (enabled ? 'active' : 'pending'),
      messengerAutoReply: !!fb.messengerAutoReply,
      aiReplyEnabled: !!fb.aiReplyEnabled,
      commentLeadMode: fb.commentLeadMode === 'all' ? 'all' : 'matched',
      safety: await getSafetySummary(business._id, 'facebook'),
      lastVerified: fb.lastVerified || ads.lastVerified,
      commentAutomations: (fb.commentAutomations || []).map(serializeCommentRule),
    };

    return NextResponse.json({ success: true, data: { facebook } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

// Manual connect — paste a Page ID + Page Access Token directly. The webhook
// matches inbound Messenger/comment events by integrationCredentials.facebook.pageId.
export const PUT = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const pageId = (body.pageId || '').trim();
    const accessToken = (body.accessToken || '').trim();
    const pageName = (body.pageName || '').trim();
    // Optional; blank keeps the stored one. The Meta app secret signs this
    // Page's webhooks and is needed to verify them.
    const appSecret = (body.appSecret || '').trim();

    if (!pageId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Page ID and Access Token are both required' },
        { status: 400 }
      );
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    business.integrationCredentials = business.integrationCredentials || {};
    business.integrationCredentials.facebook = {
      ...(business.integrationCredentials.facebook || {}),
      enabled: true,
      pageId,
      pageName: pageName || business.integrationCredentials.facebook?.pageName || null,
      accessToken: encryptOnce(accessToken), // encrypted at rest
      appSecret: appSecret
        ? encryptOnce(appSecret)
        : business.integrationCredentials.facebook?.appSecret || null,
      webhookStatus: 'active',
      lastVerified: new Date(),
    };
    business.markModified('integrationCredentials');
    await business.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

// Save keyword comment-automation rules and/or the messengerAutoReply toggle.
export const PATCH = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    business.integrationCredentials = business.integrationCredentials || {};
    business.integrationCredentials.facebook = business.integrationCredentials.facebook || {};

    if (Array.isArray(body.commentAutomations)) {
      business.integrationCredentials.facebook.commentAutomations = sanitizeCommentRules(
        body.commentAutomations,
        business.integrationCredentials.facebook.commentAutomations
      );
    }

    if (typeof body.messengerAutoReply === 'boolean') {
      business.integrationCredentials.facebook.messengerAutoReply = body.messengerAutoReply;
    }

    if (typeof body.aiReplyEnabled === 'boolean') {
      business.integrationCredentials.facebook.aiReplyEnabled = body.aiReplyEnabled;
    }

    if (['matched', 'all'].includes(body.commentLeadMode)) {
      business.integrationCredentials.facebook.commentLeadMode = body.commentLeadMode;
    }

    business.markModified('integrationCredentials');
    await business.save();

    return NextResponse.json({
      success: true,
      data: {
        commentAutomations: (business.integrationCredentials.facebook.commentAutomations || []).map(serializeCommentRule),
        commentLeadMode: business.integrationCredentials.facebook.commentLeadMode === 'all' ? 'all' : 'matched',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    business.integrationCredentials.facebook = {
      enabled: false,
      pageId: null,
      pageName: null,
      accessToken: null,
      webhookStatus: 'pending',
      messengerAutoReply: false,
      commentAutomations: business.integrationCredentials.facebook?.commentAutomations || [],
    };
    business.markModified('integrationCredentials');
    await business.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
