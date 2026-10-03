import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import { getIntegrationLogs } from '@/lib/integrations/service';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('integrations', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const data = await getIntegrationLogs(req.user.businessId, id, { limit, offset });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: serverErrorMessage(err) }, { status: 500 });
  }
});
