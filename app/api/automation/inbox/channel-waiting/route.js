import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPermissions } from '@/lib/rbac';
import { countNeedsReplyByChannel } from '@/lib/omnichannel/inboxViewQuery';

/**
 * GET /api/automation/inbox/channel-waiting
 * "Waiting for reply" count per channel — powers the red badges on the channel
 * tabs so an agent sees which channel has an unanswered backlog at a glance.
 * One grouped aggregation; polled on its own light cadence, not per list refresh.
 */
async function handler(req) {
  try {
    const { user } = req;
    await dbConnect();
    const byChannel = await countNeedsReplyByChannel({ businessId: user.businessId });
    return NextResponse.json({ success: true, data: byChannel });
  } catch (error) {
    console.error('[Inbox API] channel-waiting:', error);
    return NextResponse.json({ success: false, error: 'Failed to load waiting counts' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
