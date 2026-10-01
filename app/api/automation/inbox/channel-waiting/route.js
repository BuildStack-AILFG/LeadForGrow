import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPermissions } from '@/lib/rbac';
import { countNeedsReplyByChannel } from '@/lib/omnichannel/inboxViewQuery';
import Conversation from '@/models/omnichannel/Conversation';

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
    const [byChannel, channels] = await Promise.all([
      countNeedsReplyByChannel({ businessId: user.businessId }),
      // Channels this business has any conversation on — the inbox hides filter
      // icons for channels that have never been used (e.g. Facebook not connected).
      Conversation.distinct('channel', { businessId: user.businessId }),
    ]);
    return NextResponse.json({ success: true, data: byChannel, channels: channels.filter(Boolean) });
  } catch (error) {
    console.error('[Inbox API] channel-waiting:', error);
    return NextResponse.json({ success: false, error: 'Failed to load waiting counts' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], handler);
