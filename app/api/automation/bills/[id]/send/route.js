import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { dbConnect } from '@/lib/mongodb';
import Bill from '@/models/automation/Bill';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { renderBillPdf } from '@/lib/bills/pdfRenderer';
import { fetchLogoDataUrl } from '@/lib/bills/fetchLogoDataUrl';
import { decrypt } from '@/lib/encryption';

/**
 * POST /api/automation/bills/[id]/send
 *
 * Renders the bill to PDF, uploads it to Cloudinary (or /public in dev),
 * sends it as a WhatsApp document message to the customer, and updates the
 * bill status to "sent". Meta's document type only works inside the 24-hour
 * customer-care window — outside that, Meta rejects free-form messages and
 * we surface a clear error rather than silently failing.
 *
 * Idempotency: the cached pdfUrl is reused unless the bill was edited
 * (edits wipe pdfUrl on save, forcing regeneration).
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
      return NextResponse.json({ success: false, error: 'Cannot send a void bill' }, { status: 400 });
    }
    if (!bill.customerPhone?.trim()) {
      return NextResponse.json({ success: false, error: 'Add a customer phone number before sending' }, { status: 400 });
    }

    const business = await Business.findById(req.user.businessId).lean();
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 500 });

    // 1. Generate PDF (or reuse cached one) ────────────────────────────────
    let pdfUrl = bill.pdfUrl;
    if (!pdfUrl) {
      const [logoDataUrl, stampDataUrl] = await Promise.all([
        fetchLogoDataUrl(business?.logo),
        fetchLogoDataUrl(business?.billStampUrl),
      ]);
      const buffer = renderBillPdf({ bill: bill.toObject(), business, logoDataUrl, stampDataUrl });
      pdfUrl = await uploadPdf({ buffer, bill, businessId: req.user.businessId, req });
      bill.pdfUrl = pdfUrl;
    }

    // 2. Send WhatsApp document message via Meta Cloud API ─────────────────
    const creds = business.integrationCredentials?.whatsapp;
    const phoneNumberId = creds?.phoneNumberId;
    const encryptedKey = creds?.apiKey || creds?.accessToken;
    if (!phoneNumberId || !encryptedKey) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp not connected. Add your Meta credentials in Integrations first.',
      }, { status: 400 });
    }
    let apiKey;
    try { apiKey = decrypt(encryptedKey); }
    catch {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp credentials failed to decrypt — reconnect WhatsApp in Integrations.',
      }, { status: 500 });
    }

    const normalisedPhone = String(bill.customerPhone).replace(/[^\d]/g, '');
    const filename = `${bill.billNumber}.pdf`;
    const caption = `Bill ${bill.billNumber} · Total ₹${Number(bill.total).toLocaleString('en-IN')}`;

    // Attempt 1: free-form document. Works inside the 24h customer service
    // window (customer messaged the business in the last 24h). Meta rejects
    // with code 131047 outside that window — we detect that and retry via
    // the pre-approved `bill_delivery` template so bills reach cold numbers
    // too. Both attempts talk to the same /messages endpoint.
    const graphUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const authHeaders = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    let metaRes = await fetch(graphUrl, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalisedPhone,
        type: 'document',
        document: { link: pdfUrl, filename, caption },
      }),
    });
    let metaJson = await metaRes.json();
    let via = 'freeform';

    const isWindowClosed = metaJson?.error?.code === 131047
      || /24 hours/i.test(metaJson?.error?.message || '')
      || /re-engage/i.test(metaJson?.error?.message || '');

    if ((!metaRes.ok || metaJson.error) && isWindowClosed) {
      // ── Attempt 2: template fallback ────────────────────────────────
      // Requires an approved template called `bill_delivery` with:
      //   header: DOCUMENT
      //   body:   4 vars — {{1}} customer first name, {{2}} business name,
      //                    {{3}} bill number, {{4}} amount formatted
      // If the template isn't approved yet, Meta returns 132000/132001 and
      // we surface that clearly instead of the misleading window error.
      const firstName = String(bill.customerName || '').split(' ')[0] || 'there';
      const businessName = business?.businessName || 'us';
      const amountStr = Number(bill.total).toLocaleString('en-IN');

      const templateRes = await fetch(graphUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalisedPhone,
          type: 'template',
          template: {
            name: 'bill_delivery',
            language: { code: 'en_US' },
            components: [
              {
                type: 'header',
                parameters: [
                  { type: 'document', document: { link: pdfUrl, filename } },
                ],
              },
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: firstName },
                  { type: 'text', text: businessName },
                  { type: 'text', text: bill.billNumber },
                  { type: 'text', text: amountStr },
                ],
              },
            ],
          },
        }),
      });
      const templateJson = await templateRes.json();
      metaRes = templateRes;
      metaJson = templateJson;
      via = 'template';
    }

    if (!metaRes.ok || metaJson.error) {
      // Preserve the pdfUrl on the bill so a retry doesn't regenerate.
      await bill.save();
      const err = metaJson.error || {};
      // Special hint when the template isn't approved yet
      const templateNotFound = via === 'template' && (err.code === 132000 || err.code === 132001 || /template/i.test(err.message || ''));
      return NextResponse.json({
        success: false,
        error: templateNotFound
          ? 'Bill sent outside 24h window needs the "bill_delivery" template — build + submit it in WhatsApp Templates, then retry once Meta approves.'
          : err.message || 'WhatsApp send failed',
        metaError: { code: err.code, subcode: err.error_subcode, details: err.error_data?.details, via },
      }, { status: 502 });
    }

    // 3. Mark sent ─────────────────────────────────────────────────────────
    bill.status = 'sent';
    bill.sentAt = new Date();
    await bill.save();

    return NextResponse.json({
      success: true,
      data: {
        pdfUrl,
        metaMessageId: metaJson.messages?.[0]?.id || null,
        billNumber: bill.billNumber,
        sentTo: normalisedPhone,
        via, // 'freeform' (inside 24h) or 'template' (bill_delivery fallback)
      },
    });
  } catch (err) {
    console.error('[Bills] send:', err);
    return NextResponse.json({ success: false, error: err.message || 'Send failed' }, { status: 500 });
  }
});

/**
 * Upload a PDF buffer to Cloudinary. Falls back to local /public/uploads
 * in dev when Cloudinary env vars aren't set, mirroring the pattern used
 * by /api/automation/whatsapp-templates/upload-media.
 */
async function uploadPdf({ buffer, bill, businessId, req }) {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const { v2: cloudinary } = await import('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const uploaded = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `lfg/${businessId}/bills`,
          resource_type: 'raw',
          public_id: bill.billNumber,
          format: 'pdf',
          overwrite: true,
        },
        (err, result) => (err ? reject(err) : resolve(result)),
      ).end(buffer);
    });
    return uploaded.secure_url;
  }

  // Local fallback — dev only
  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'public', 'uploads', 'bills');
  await mkdir(dir, { recursive: true });
  const filename = `${bill.billNumber}-${Date.now()}.pdf`;
  await writeFile(path.join(dir, filename), buffer);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}/uploads/bills/${filename}`;
}
