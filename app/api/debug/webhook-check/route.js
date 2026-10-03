import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import MetaWebhookIngress from '@/models/MetaWebhookIngress';
import { withPlanAccess } from '@/lib/accessControl';

/**
 * GET /api/debug/webhook-check
 *
 * Quick sanity check for WhatsApp webhook wiring.
 * Returns the last 20 webhook ingress rows plus what's configured on the
 * business, so you can tell in one page whether Meta is talking to you at all.
 */
export const GET = withPlanAccess('automation', async (req) => {
  await dbConnect();
  const businessId = req.user.businessId;

  const business = await Business.findById(businessId).select('+integrationCredentials');
  const wa = business?.integrationCredentials?.whatsapp || {};

  // Only this business's rows, plus unattributed rows that carry its own
  // phone number / WABA id (the "why didn't it match?" case). Other tenants'
  // traffic is never returned.
  const ownIds = [];
  if (wa.phoneNumberId) ownIds.push({ 'payload.entry.changes.value.metadata.phone_number_id': String(wa.phoneNumberId) });
  if (wa.businessAccountId) ownIds.push({ 'payload.entry.id': String(wa.businessAccountId) });
  const recent = await MetaWebhookIngress
    .find({ $or: [{ businessId }, ...(ownIds.length ? [{ businessId: null, $or: ownIds }] : [])] })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const yourIngress = recent.filter((r) => String(r.businessId) === String(businessId));
  const globalIngress = recent.filter((r) => !r.businessId);

  return NextResponse.json({
    business: {
      businessId: String(businessId),
      whatsappConfigured: Boolean(wa.enabled && wa.phoneNumberId && wa.apiKey),
      phoneNumberId: wa.phoneNumberId || null,
      businessAccountId: wa.businessAccountId || null,
      provider: wa.provider || null,
    },
    webhookUrls: {
      shared: `${originFrom(req)}/api/webhooks/meta`,
      perBusiness: `${originFrom(req)}/api/webhooks/meta/${businessId}`,
    },
    ingressCounts: {
      totalLast20: recent.length,
      forThisBusiness: yourIngress.length,
      globalOrUnattributed: globalIngress.length,
    },
    lastForThisBusiness: yourIngress.slice(0, 5).map(summarise),
    lastGlobal: globalIngress.slice(0, 5).map(summarise),
    hint:
      recent.length === 0
        ? '❌ No webhooks for this business or its phone number. Meta is not reaching your URL. Re-check callback URL in Meta dashboard matches your current ngrok URL, and that verify token matches.'
        : yourIngress.length === 0
          ? '⚠️ Webhooks are arriving but none matched this business. Business is resolved by phone_number_id — make sure your business.integrationCredentials.whatsapp.phoneNumberId equals the Meta phone_number_id.'
          : `✅ ${yourIngress.length} webhook(s) reached this business. Check the fields below to see what Meta sent.`,
  });
});

function originFrom(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

function summarise(row) {
  const payload = row.payload || {};
  const change = payload.entry?.[0]?.changes?.[0] || {};
  const value = change.value || {};
  return {
    at: row.createdAt,
    route: row.route,
    outcome: row.outcome,
    step: row.processing?.step,
    object: payload.object,
    field: change.field,
    hasMessages: Boolean(value.messages?.length),
    hasStatuses: Boolean(value.statuses?.length),
    phoneNumberId: value.metadata?.phone_number_id || null,
    wabaId: payload.entry?.[0]?.id || null,
    error: row.processing?.error,
  };
}
