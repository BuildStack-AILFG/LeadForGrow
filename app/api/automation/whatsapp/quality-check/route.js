import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Integration from '@/models/Integration';
import { withPlanAccess } from '@/lib/accessControl';
import { getPhoneNumberQuality } from '@/lib/whatsapp/templates';
import { decryptCredentials } from '@/lib/integrations/credentials';
import { decrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

// Simple in-memory cache — keyed by businessId, 5 min TTL
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = String(req.user.businessId);
    const { searchParams } = new URL(req.url);
    const bypass = searchParams.get('refresh') === '1';

    if (!bypass) {
      const cached = cache.get(businessId);
      if (cached && Date.now() - cached.at < TTL_MS) {
        return NextResponse.json({ success: true, cached: true, ...cached.data });
      }
    }

    // Resolve creds from either store
    const [integration, business] = await Promise.all([
      Integration.findOne({ businessId, integrationId: 'whatsapp-cloud' }),
      Business.findById(businessId).select('+integrationCredentials'),
    ]);
    const legacy = business?.integrationCredentials?.whatsapp || {};
    const modern = integration?.credentials
      ? decryptCredentials('whatsapp-cloud', integration.credentials.toObject?.() || integration.credentials)
      : {};

    const apiKey = modern.accessToken || (legacy.apiKey ? decrypt(legacy.apiKey) : null);
    const phoneNumberId = modern.phoneNumberId || legacy.phoneNumberId;

    if (!apiKey || !phoneNumberId) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp not configured. Set API Key + Phone Number ID in Settings → Integrations.' },
        { status: 400 },
      );
    }

    const data = await getPhoneNumberQuality({ apiKey, phoneNumberId });
    cache.set(businessId, { at: Date.now(), data });
    return NextResponse.json({ success: true, cached: false, ...data });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
