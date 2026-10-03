import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { getSubscribedFields, enableSubscriptions, REQUIRED_FIELDS } from '@/lib/instagram/subscriptions';

// GET — which webhook fields Meta will deliver for this account.
export const GET = withPlanAccess('settings', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const result = await getSubscribedFields(business);
    return NextResponse.json({ success: true, data: { ...result, required: REQUIRED_FIELDS } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
