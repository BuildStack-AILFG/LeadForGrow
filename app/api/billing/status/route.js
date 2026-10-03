import { NextResponse } from 'next/server';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import Subscription from '@/models/billing/Subscription';
import BillingInvoice from '@/models/billing/Invoice';
import { getUsageSummary } from '@/models/billing/UsageRecord';
import { BILLING_PLANS } from '@/lib/billing/plans';
import { createBillingPortalSession } from '@/lib/billing/stripe';
import { getEnv } from '@/lib/env';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const businessId = tenant.business._id;

    const [subscription, invoices, usage] = await Promise.all([
      Subscription.findOne({ businessId }).sort({ createdAt: -1 }).lean(),
      BillingInvoice.find({ businessId }).sort({ createdAt: -1 }).limit(12).lean(),
      getUsageSummary(businessId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        plan: tenant.business.plan || 'free',
        subscription,
        invoices,
        usage,
        quotas: tenant.business.quotas || {},
        plans: Object.values(BILLING_PLANS),
      },
    });
  } catch (error) {
    console.error('[Billing Status]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const subscription = await Subscription.findOne({ businessId: tenant.business._id }).lean();

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ success: false, error: 'No Stripe customer on file' }, { status: 400 });
    }

    const appUrl = getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const portal = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${appUrl}/automation/settings/billing`,
    });

    return NextResponse.json({ success: true, url: portal.url });
  } catch (error) {
    console.error('[Billing Portal]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
