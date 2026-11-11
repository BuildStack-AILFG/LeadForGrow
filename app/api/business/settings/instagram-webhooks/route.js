import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { getSubscribedFields, enableSubscriptions, REQUIRED_FIELDS } from '@/lib/instagram/subscriptions';
import { serverErrorMessage } from '@/lib/api/serverError';
import MetaWebhookIngress from '@/models/MetaWebhookIngress';

/**
 * The last Instagram webhook calls Meta made for this account (matched by its Instagram account id or
 * Page ID), including ones that failed. Answers "is Meta calling us at all?" without database access.
 * Only this business's own ids are queried, so other tenants' traffic is never returned.
 */
async function recentInstagramEvents(business) {
  const ig = business.integrationCredentials?.instagram || {};
  const ids = [ig.igUserId, ig.pageId].filter(Boolean).map(String);
  if (!ids.length) return [];
  const rows = await MetaWebhookIngress.find({ 'payload.object': 'instagram', 'payload.entry.id': { $in: ids } })
    .sort({ createdAt: -1 }).limit(10).select('createdAt outcome processing.step payload.entry').lean();
  return rows.map((r) => {
    const entry = (r.payload?.entry || [])[0] || {};
    const kind = entry.messaging?.length ? 'message' : (entry.changes || []).map((c) => c.field).join(',') || 'other';
    return { at: r.createdAt, outcome: r.outcome, step: r.processing?.step || null, kind };
  });
}

// GET — which webhook fields Meta will deliver for this account.
export const GET = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const [result, recentEvents] = await Promise.all([getSubscribedFields(business), recentInstagramEvents(business)]);
    return NextResponse.json({ success: true, data: { ...result, required: REQUIRED_FIELDS, recentEvents } });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

// POST — subscribe the account to comments + messages (keeps any fields it already had).
export const POST = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const result = await enableSubscriptions(business);
    return NextResponse.json({ success: result.success, error: result.error, data: { fields: result.fields, required: REQUIRED_FIELDS } });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
