import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import AutomationRule from '@/models/automation/AutomationRule';
import { withPlanAccess } from '@/lib/accessControl';

export const GET = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const wa = business.integrationCredentials?.whatsapp || {};
    const templateCount = await AutomationRule.countDocuments({
      businessId: business._id,
      type: 'manual_template',
      'config.isMetaTemplate': true,
    });

    return NextResponse.json({
      success: true,
      data: {
        businessName: business.businessName,
        whatsapp: {
          enabled: wa.enabled || false,
          provider: wa.provider || 'meta',
          phoneNumberId: wa.phoneNumberId,
          businessAccountId: wa.businessAccountId,
          appId: wa.appId,
          // Secrets are surfaced only as "set / not set" — never the raw value.
          hasAccessToken: !!wa.apiKey,
          hasAppSecret: !!wa.appSecret,
          hasVerifyToken: !!wa.verifyToken,
          displayNumber: wa.displayNumber || wa.phoneNumberId,
          businessName: business.businessName,
          qualityRating: wa.qualityRating || 'Unknown',
          verificationStatus: wa.enabled ? 'Verified' : 'Not connected',
          webhookStatus: wa.enabled ? 'active' : 'inactive',
          templateCount,
          lastVerified: wa.lastVerified,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

// Manual credential save — writes straight to integrationCredentials.whatsapp.*
// so the values reliably persist (the catalog connect form's encrypt/test
// pipeline was dropping them). Blank fields keep their existing value, so you
// can update just one thing (e.g. only the verify token).
export const PUT = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const phoneNumberId = (body.phoneNumberId || '').trim();
    const accessToken = (body.accessToken || '').trim();

    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const existing = business.integrationCredentials?.whatsapp?.toObject?.()
      || business.integrationCredentials?.whatsapp
      || {};

    // Access token + phone number id are the minimum to send/receive.
    const finalToken = accessToken || existing.apiKey;
    const finalPhone = phoneNumberId || existing.phoneNumberId;
    if (!finalToken || !finalPhone) {
      return NextResponse.json(
        { success: false, error: 'Access Token and Phone Number ID are required' },
        { status: 400 }
      );
    }

    const pick = (incoming, prev) => {
      const v = (incoming || '').trim();
      return v || prev || undefined;
    };

    business.integrationCredentials = business.integrationCredentials || {};
    business.integrationCredentials.whatsapp = {
      ...existing,
      enabled: true,
      provider: 'meta',
      apiKey: finalToken,
      phoneNumberId: finalPhone,
      businessAccountId: pick(body.businessAccountId, existing.businessAccountId),
      appId: pick(body.appId, existing.appId),
      appSecret: pick(body.appSecret, existing.appSecret),
      verifyToken: pick(body.verifyToken, existing.verifyToken),
      lastVerified: new Date(),
    };
    business.markModified('integrationCredentials');
    await business.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
