import { disconnectInstagram } from '@/lib/social/disconnect';
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

    const ig = business.integrationCredentials?.instagram || {};
    const fb = business.integrationCredentials?.facebookAds || {};

    const enabled = ig.enabled || (fb.enabled && fb.pageId);
    const instagram = {
      enabled: !!enabled,
      pageId: ig.pageId || fb.pageId,
      igUserId: ig.igUserId,
      username: ig.username || fb.pageName,
      profilePicture: ig.profilePicture,
      accessToken: ig.accessToken ? '••••' : undefined,
      // Whether inbound webhooks can be verified. The secret itself is never sent.
      hasAppSecret: Boolean(ig.appSecret),
      platformAppSecret: Boolean(process.env.INSTAGRAM_APP_SECRET),
      webhookStatus: ig.webhookStatus || (enabled ? 'active' : 'pending'),
      aiReplyEnabled: !!ig.aiReplyEnabled,
      commentLeadMode: ig.commentLeadMode === 'all' ? 'all' : 'matched',
      safety: await getSafetySummary(business._id, 'instagram'),
      lastSyncAt: ig.lastSyncAt || ig.lastVerified || fb.lastVerified,
      lastVerified: ig.lastVerified,
      commentAutomations: (ig.commentAutomations || []).map(serializeCommentRule),
    };

    return NextResponse.json({ success: true, data: { instagram } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withPlanAccess('settings', async (req) => {
  try {
    const appId = process.env.META_APP_ID || process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/auth/meta/callback?scope=instagram`;
    if (!appId) {
      return NextResponse.json({
        success: false,
        error: 'META_APP_ID not configured. Add it to environment variables.',
      }, { status: 400 });
    }
    const scopes = ['instagram_basic', 'instagram_manage_messages', 'pages_show_list', 'pages_messaging'].join(',');
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=instagram`;
    return NextResponse.json({ success: true, data: { authUrl } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

// Manual connect — paste a Page ID + Page Access Token directly (used when the
// full Meta OAuth app isn't set up yet, and for Phase-1 testing). The webhook
// matches inbound events by integrationCredentials.instagram.pageId.
export const PUT = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const pageId = (body.pageId || '').trim();
    const accessToken = (body.accessToken || '').trim();
    const username = (body.username || '').trim();
    const igUserId = (body.igUserId || '').trim();
    // Optional here; blank keeps the stored one. Needed to verify inbound
    // webhooks unless INSTAGRAM_APP_SECRET is set at platform level.
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
    business.integrationCredentials.instagram = {
      ...(business.integrationCredentials.instagram || {}),
      enabled: true,
      pageId,
      accessToken: encryptOnce(accessToken), // encrypted at rest
      appSecret: appSecret
        ? encryptOnce(appSecret)
        : business.integrationCredentials.instagram?.appSecret || null,
      igUserId: igUserId || business.integrationCredentials.instagram?.igUserId || null,
      username: username || business.integrationCredentials.instagram?.username || null,
      webhookStatus: 'active',
      disconnectedAt: null,
      lastVerified: new Date(),
    };
    business.markModified('integrationCredentials');
    await business.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

// Save the keyword comment-automation rules and/or the channel AI switch.
export const PATCH = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const rules = Array.isArray(body.commentAutomations) ? body.commentAutomations : null;
    const leadMode = ['matched', 'all'].includes(body.commentLeadMode) ? body.commentLeadMode : null;
    if (!rules && typeof body.aiReplyEnabled !== 'boolean' && !leadMode) {
      return NextResponse.json({ success: false, error: 'commentAutomations, aiReplyEnabled or commentLeadMode required' }, { status: 400 });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    business.integrationCredentials = business.integrationCredentials || {};
    business.integrationCredentials.instagram = business.integrationCredentials.instagram || {};

    if (rules) {
      business.integrationCredentials.instagram.commentAutomations = sanitizeCommentRules(
        rules,
        business.integrationCredentials.instagram.commentAutomations
      );
    }

    if (typeof body.aiReplyEnabled === 'boolean') {
      business.integrationCredentials.instagram.aiReplyEnabled = body.aiReplyEnabled;
    }
    if (leadMode) {
      business.integrationCredentials.instagram.commentLeadMode = leadMode;
    }

    business.markModified('integrationCredentials');
    await business.save();

    return NextResponse.json({
      success: true,
      data: {
        commentAutomations: (business.integrationCredentials.instagram.commentAutomations || []).map(serializeCommentRule),
        aiReplyEnabled: !!business.integrationCredentials.instagram.aiReplyEnabled,
        commentLeadMode: business.integrationCredentials.instagram.commentLeadMode === 'all' ? 'all' : 'matched',
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
    // Stops Meta's events, clears the credentials and marks the account disconnected. Automation rules, the AI
    // switch and "create a lead from" stay saved (they can't run while disconnected); leads and conversations are kept.
    const result = await disconnectInstagram(business);
    business.markModified('integrationCredentials');
    await business.save();
    return NextResponse.json({ success: true, webhook: result.webhook, keptRules: result.keptRules });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
