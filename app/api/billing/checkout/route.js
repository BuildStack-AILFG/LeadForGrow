import { NextResponse } from 'next/server';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { getBillingPlan, getStripePriceId } from '@/lib/billing/plans';
import { createCheckoutSession } from '@/lib/billing/stripe';
import { createRazorpaySubscription } from '@/lib/billing/razorpay';
import { getEnv } from '@/lib/env';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { planId, provider = 'stripe' } = await req.json();
    const plan = getBillingPlan(planId);

    if (!plan || plan.id === 'free') {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });
    }

    const appUrl = getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

    if (provider === 'stripe') {
      const priceId = getStripePriceId(planId);
      if (!priceId) {
        return NextResponse.json({ success: false, error: 'Stripe price not configured' }, { status: 503 });
      }

      const session = await createCheckoutSession({
        businessId: tenant.business._id,
        planId,
        priceId,
        customerEmail: tenant.user.email,
        successUrl: `${appUrl}/automation/settings/billing?success=1`,
        cancelUrl: `${appUrl}/automation/settings/billing?canceled=1`,
      });

      return NextResponse.json({ success: true, url: session.url, sessionId: session.id, provider: 'stripe' });
    }

    if (provider === 'razorpay') {
      const razorpayPlanId = process.env[plan.razorpayPlanEnv];
      if (!razorpayPlanId) {
        return NextResponse.json({ success: false, error: 'Razorpay plan not configured' }, { status: 503 });
      }

      const subscription = await createRazorpaySubscription({ planId: razorpayPlanId });
      return NextResponse.json({
        success: true,
        provider: 'razorpay',
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        keyId: process.env.RAZORPAY_KEY_ID,
        businessId: tenant.business._id.toString(),
        planId,
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported payment provider' }, { status: 400 });
  } catch (error) {
    console.error('[Billing Checkout]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
