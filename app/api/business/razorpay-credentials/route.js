import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { encrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * Razorpay credential endpoints — Bring-Your-Own-Razorpay pattern.
 *
 * The business owner creates a Razorpay account themselves,
 * generates API keys in the Razorpay dashboard, and pastes them here.
 * LFG uses those keys to create Payment Links for the customer's bills.
 * Money flows directly from the paying customer to the business's own
 * Razorpay account and settles to their bank — LFG never holds funds,
 * never charges a cut, and stays out of Payment Aggregator licence scope.
 *
 * keySecret is encrypted at rest (lib/encryption) and NEVER returned in
 * GET responses. Same "write-only field" pattern used for Meta apiKey.
 */

const MASK = '••••••••';

function isMasked(v) {
  return typeof v === 'string' && v.trim() === MASK;
}

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId)
      .select('integrationCredentials.razorpay').lean();
    const rzp = business?.integrationCredentials?.razorpay || {};
    return NextResponse.json({
      success: true,
      data: {
        enabled: !!rzp.enabled,
        keyId: rzp.keyId || '',
        hasSecret: !!rzp.keySecret,
        hasWebhookSecret: !!rzp.webhookSecret,
        lastVerified: rzp.lastVerified || null,
      },
    });
  } catch (err) {
    console.error('[Razorpay creds] get:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch credentials' }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const { keyId, keySecret, webhookSecret } = await req.json();

    if (!keyId?.trim()) {
      return NextResponse.json({ success: false, error: 'Key ID is required' }, { status: 400 });
    }
    // Razorpay keyId format: rzp_test_XXXXX or rzp_live_XXXXX
    if (!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId.trim())) {
      return NextResponse.json({ success: false, error: 'Key ID should look like rzp_live_… or rzp_test_…' }, { status: 400 });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    business.integrationCredentials = business.integrationCredentials || {};
    business.integrationCredentials.razorpay = business.integrationCredentials.razorpay || {};
    const rzp = business.integrationCredentials.razorpay;

    rzp.keyId = keyId.trim();
    // Preserve the existing secret if the client sent the mask placeholder
    // (that's the UX pattern used everywhere else: field starts empty on the
    // client, mask means "leave stored value alone").
    if (keySecret && !isMasked(keySecret) && keySecret.trim()) {
      rzp.keySecret = encrypt(keySecret.trim());
    }
    if (webhookSecret !== undefined) {
      if (webhookSecret && !isMasked(webhookSecret) && webhookSecret.trim()) {
        rzp.webhookSecret = encrypt(webhookSecret.trim());
      } else if (webhookSecret === '' || webhookSecret === null) {
        rzp.webhookSecret = undefined;
      }
    }
    rzp.enabled = !!(rzp.keyId && rzp.keySecret);
    rzp.lastVerified = new Date();

    await business.save();
    return NextResponse.json({
      success: true,
      data: {
        enabled: rzp.enabled,
        keyId: rzp.keyId,
        hasSecret: !!rzp.keySecret,
        hasWebhookSecret: !!rzp.webhookSecret,
      },
    });
  } catch (err) {
    console.error('[Razorpay creds] save:', err);
    return NextResponse.json({ success: false, error: serverErrorMessage(err) || 'Failed to save credentials' }, { status: 500 });
  }
});

export const DELETE = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    await Business.updateOne(
      { _id: req.user.businessId },
      { $unset: { 'integrationCredentials.razorpay': '' } }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Razorpay creds] delete:', err);
    return NextResponse.json({ success: false, error: 'Failed to disconnect' }, { status: 500 });
  }
});
