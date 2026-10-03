import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Bill from '@/models/automation/Bill';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { getRazorpayClient } from '@/lib/payments/razorpay';
import { decrypt } from '@/lib/encryption';
import { serverErrorMessage } from '@/lib/api/serverError';

/**
 * POST /api/automation/bills/[id]/payment-link
 *
 * Generates a Razorpay Payment Link for the bill total using the business's
 * own Razorpay account (BYORzp) and optionally sends it to the customer via
 * WhatsApp. Idempotent-ish: if the bill already has an active link with the
 * same amount, we reuse it instead of creating a duplicate on Razorpay.
 *
 * Body: { sendOnWhatsApp?: boolean } (default true)
 *
 * Returns the Razorpay short URL. If the 24h WhatsApp window is closed, the
 * link is created + persisted but the WhatsApp send fails with a decoded
 * error — user can still copy the link and share it any other way.
 */
export const POST = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }

    const bill = await Bill.findOne({ _id: id, businessId: req.user.businessId });
    if (!bill) return NextResponse.json({ success: false, error: 'Bill not found' }, { status: 404 });
    if (bill.status === 'void') {
      return NextResponse.json({ success: false, error: 'Cannot generate a link for a void bill' }, { status: 400 });
    }
    if (!bill.customerPhone?.trim()) {
      return NextResponse.json({ success: false, error: 'Add a customer phone number first' }, { status: 400 });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business?.integrationCredentials?.razorpay?.enabled) {
      return NextResponse.json({
        success: false,
        error: 'Razorpay not connected. Add your keys in Settings → Payments to enable payment links.',
      }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const sendOnWhatsApp = body.sendOnWhatsApp !== false;

    // ── 1. Reuse or create the Razorpay Payment Link ─────────────────────
    let shortUrl = bill.paymentLink?.shortUrl;
    let linkId   = bill.paymentLink?.id;
    const reuse  = shortUrl && linkId
      && bill.paymentLink.status !== 'cancelled'
      && bill.paymentLink.status !== 'expired'
      && Number(bill.paymentLink.lastAmount) === Number(bill.total);

    if (!reuse) {
      const rzp = getRazorpayClient(business);
      const description = `Bill ${bill.billNumber} · ${business.businessName || 'Payment'}`;
      const created = await rzp.createLink({
        amount: bill.total,
        description,
        customerName: bill.customerName,
        customerPhone: bill.customerPhone,
        customerEmail: bill.customerEmail,
        // reference_id must be unique per business on Razorpay — we suffix
        // with the bill's Mongo id to survive re-creates after cancellation.
        referenceId: `BILL-${bill._id.toString()}-${Date.now()}`,
        notes: {
          businessId: String(bill.businessId),
          billId: String(bill._id),
          billNumber: bill.billNumber,
        },
      }).catch((err) => {
        throw new Error(err.message || 'Razorpay refused the link request');
      });

      shortUrl = created.short_url;
      linkId   = created.id;
      bill.paymentLink = {
        id: linkId,
        shortUrl,
        status: created.status || 'created',
        createdAt: new Date(),
        lastAmount: bill.total,
      };
      await bill.save();
    }

    // ── 2. Optional WhatsApp send ─────────────────────────────────────────
    let whatsappResult = { sent: false, reason: 'not_requested' };
    if (sendOnWhatsApp) {
      whatsappResult = await sendLinkOnWhatsApp({ bill, business, shortUrl });
    }

    return NextResponse.json({
      success: true,
      data: {
        shortUrl,
        linkId,
        reused: reuse,
        whatsapp: whatsappResult,
      },
    });
  } catch (err) {
    console.error('[Bills] payment-link:', err);
    return NextResponse.json({ success: false, error: serverErrorMessage(err) || 'Failed to create payment link' }, { status: 500 });
  }
});

/**
 * DELETE /api/automation/bills/[id]/payment-link — cancel the link on
 * Razorpay's side and clear it from the bill. Doesn't touch bill.status
 * (an already-paid bill should stay paid; this is only for "generated
 * wrong amount, want to redo").
 */
export const DELETE = withPlanAccess('automation', async (req, ctx) => {
  try {
    await dbConnect();
    const { id } = await ctx.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid bill id' }, { status: 400 });
    }
    const bill = await Bill.findOne({ _id: id, businessId: req.user.businessId });
    if (!bill?.paymentLink?.id) {
      return NextResponse.json({ success: false, error: 'No payment link to cancel' }, { status: 400 });
    }
    const business = await Business.findById(req.user.businessId);
    try {
      const rzp = getRazorpayClient(business);
      await rzp.cancelLink(bill.paymentLink.id);
    } catch (err) {
      // If Razorpay already cancelled or the link expired, ignore — still clear locally
      console.warn('[Bills] payment-link cancel:', err.message);
    }
    bill.paymentLink = undefined;
    await bill.save();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Bills] payment-link delete:', err);
    return NextResponse.json({ success: false, error: 'Failed to cancel link' }, { status: 500 });
  }
});

/**
 * Send the payment link as a WhatsApp text message.
 * Note: uses free-form text (24h window). Templates would need a pre-
 * approved "payment_link" template with the URL as a variable — worth
 * doing later, but MVP relies on the customer being inside the 24h window
 * (usually is — bills are sent right after service).
 */
async function sendLinkOnWhatsApp({ bill, business, shortUrl }) {
  const creds = business.integrationCredentials?.whatsapp;
  if (!creds?.phoneNumberId || !creds?.apiKey) {
    return { sent: false, reason: 'whatsapp_not_connected' };
  }
  let apiKey;
  try { apiKey = decrypt(creds.apiKey); }
  catch { return { sent: false, reason: 'whatsapp_send_failed', error: 'Credentials failed to decrypt' }; }
  const to = String(bill.customerPhone).replace(/[^\d]/g, '');
  const body =
    `Hi ${bill.customerName?.split(' ')[0] || 'there'}, here's your payment link for Bill ${bill.billNumber}:\n\n` +
    `${shortUrl}\n\n` +
    `Amount: ₹${Number(bill.total).toLocaleString('en-IN')}\n` +
    `From: ${business.businessName || 'us'}`;

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${creds.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: true, body },
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        sent: false,
        reason: 'whatsapp_send_failed',
        error: data.error?.message,
        code: data.error?.code,
      };
    }
    return { sent: true, messageId: data.messages?.[0]?.id || null };
  } catch (err) {
    return { sent: false, reason: 'whatsapp_send_failed', error: err.message };
  }
}
