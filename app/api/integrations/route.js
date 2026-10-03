import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import { listIntegrations, connectIntegration } from '@/lib/integrations/service';
import { serverErrorMessage } from '@/lib/api/serverError';

function getBaseUrl(req) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}

export const GET = withPlanAccess('integrations', async (req) => {
  try {
    await dbConnect();
    const baseUrl = getBaseUrl(req);
    const data = await listIntegrations(req.user.businessId, baseUrl);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[Integrations GET]', err);
    return NextResponse.json({ success: false, error: serverErrorMessage(err) }, { status: 500 });
  }
});

export const POST = withPlanAccess('integrations', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const { integrationId, credentials, config, testOnConnect } = body;

    if (!integrationId) {
      return NextResponse.json({ success: false, error: 'integrationId is required' }, { status: 400 });
    }

    const baseUrl = getBaseUrl(req);
    const result = await connectIntegration(
      req.user.businessId,
      integrationId,
      { credentials, config, testOnConnect: testOnConnect !== false },
      req.user.userId,
      baseUrl
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('[Integrations POST]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
});
