import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Lead from '@/models/automation/Lead';
import Activity from '@/models/automation/Activity';
import { verifyUnsubscribeToken } from '@/lib/unsubscribeToken';
import { withRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/unsubscribe/[token]
 * Public endpoint (no auth) — one click from an email footer.
 * Flips optedOutOfEmail = true for the lead+business encoded in the token.
 */
async function getHandler(req, { params }) {
  const { token } = await params;
  const parsed = verifyUnsubscribeToken(token);

  if (!parsed) {
    return htmlResponse(400, 'Invalid link', 'This unsubscribe link is not valid. It may have been tampered with.');
  }

  await dbConnect();

  const lead = await Lead.findOne({ _id: parsed.leadId, businessId: parsed.businessId });
  if (!lead) {
    return htmlResponse(404, 'Not found', 'We could not locate your record. You may already be unsubscribed.');
  }

  if (lead.optedOutOfEmail) {
    return htmlResponse(
      200,
      'Already unsubscribed',
      `${lead.email || 'This email'} is already unsubscribed from broadcasts. You will not receive further email campaigns.`
    );
  }

  lead.optedOutOfEmail = true;
  lead.optedOutOfEmailAt = new Date();
  lead.optedOutOfEmailReason = 'One-click unsubscribe link';
  lead.optedOutOfEmailSource = 'unsubscribe_link';
  await lead.save();

  await Activity.create({
    businessId: lead.businessId,
    leadId: lead._id,
    entityType: 'lead',
    entityId: lead._id,
    type: 'email_opted_out',
    description: `Lead unsubscribed via email link (${lead.email || 'unknown email'})`,
    metadata: { source: 'unsubscribe_link' },
  }).catch(() => {});

  return htmlResponse(
    200,
    'Unsubscribed',
    `You have been unsubscribed. ${lead.email || 'This email'} will no longer receive broadcast campaigns.`
  );
}

/**
 * POST — RFC 8058 "one-click unsubscribe" per List-Unsubscribe-Post header.
 * Gmail and other mail clients POST here directly when the user hits the
 * native "Unsubscribe" link in the message header.
 */

function htmlResponse(status, title, message) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; background: #f4f6fa; margin: 0; padding: 40px 20px; }
    .card { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); text-align: center; }
    h1 { font-size: 20px; margin: 0 0 12px; color: #0f172a; }
    p { color: #475569; line-height: 1.5; margin: 0; font-size: 14px; }
    .icon { font-size: 40px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${status === 200 ? '✓' : '⚠'}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export const GET = withRateLimit(20, 60, getHandler);
export const POST = GET;
