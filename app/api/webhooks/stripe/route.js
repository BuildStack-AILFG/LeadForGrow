import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import Subscription from '@/models/billing/Subscription';
import BillingInvoice from '@/models/billing/Invoice';
import { verifyStripeWebhook } from '@/lib/billing/stripe';
import { applyPlanQuotas } from '@/lib/plans';
import { serverErrorMessage } from '@/lib/api/serverError';

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = verifyStripeWebhook(rawBody, signature);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    await dbConnect();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const businessId = session.metadata?.businessId;
        const planId = session.metadata?.planId || 'growth';

        if (businessId) {
          const business = await Business.findById(businessId);
          if (business) {
            business.plan = planId;
            applyPlanQuotas(business, planId);
            await business.save();
          }

          await Subscription.findOneAndUpdate(
            { businessId },
            {
              businessId,
              plan: planId,
              status: 'active',
              provider: 'stripe',
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
            },
            { upsert: true }
          );
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const businessId = invoice.subscription_details?.metadata?.businessId ||
          invoice.metadata?.businessId;

        if (businessId) {
          await BillingInvoice.findOneAndUpdate(
            { externalId: invoice.id },
            {
              businessId,
              provider: 'stripe',
              externalId: invoice.id,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency?.toUpperCase() || 'USD',
              status: 'paid',
              pdfUrl: invoice.invoice_pdf,
              hostedUrl: invoice.hosted_invoice_url,
              paidAt: new Date(invoice.status_transitions?.paid_at * 1000),
            },
            { upsert: true }
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const businessId = sub.metadata?.businessId;
        if (businessId) {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: sub.id },
            { status: 'canceled' }
          );
          await Business.findByIdAndUpdate(businessId, { plan: 'free' });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook]', error);
    return NextResponse.json({ error: serverErrorMessage(error) }, { status: 500 });
  }
}
