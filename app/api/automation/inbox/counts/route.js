import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPermissions } from '@/lib/rbac';
import { countInboxQueues } from '@/lib/omnichannel/inboxViewQuery';

/**
 * GET /api/automation/inbox/counts
 * The numbers on the inbox tabs (Needs reply / Mine / Unassigned / Taken over / Unread). Same queries as the list,
 * so a badge and the list behind it always agree.
 */
async function handler(req) {
  try {
    const { user } = req;
    await dbConnect();
    const channel = new URL(req.url).searchParams.get('channel') || undefined;
    const counts = await countInboxQueues({ businessId: user.businessId, userId: user.userId, channel });
    return NextResponse.json({ success: true, data: counts });
  } catch (error) {
    console.error('[Inbox API] counts:', error);
    return NextResponse.json({ success: false, error: 'Failed to load counts' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
