import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Conversation from '@/models/omnichannel/Conversation';
import { withPermissions } from '@/lib/rbac';

/**
 * POST /api/automation/inbox/conversations/bulk
 * Apply one triage action to many conversations at once (the bulk-select bar in
 * the inbox). Scoped to the caller's business so ids from another tenant are
 * ignored. Actions mirror the single-conversation ones:
 *   done      → status 'closed'      (leaves the Needs-reply / open queues)
 *   archive   → isArchived true      (leaves the inbox)
 *   unarchive → isArchived false
 *   read      → inboxStatus 'read'
 */
const PATCHES = {
  done: { status: 'closed' },
  archive: { isArchived: true },
  unarchive: { isArchived: false },
  read: { inboxStatus: 'read' },
};

async function handler(req) {
  try {
    const { user } = req;
    const { ids, action } = await req.json();
    const patch = PATCHES[action];
    if (!Array.isArray(ids) || !ids.length || !patch) {
      return NextResponse.json({ success: false, error: 'ids[] and a valid action are required' }, { status: 400 });
    }
    await dbConnect();
    const res = await Conversation.updateMany(
      { _id: { $in: ids.slice(0, 200) }, businessId: user.businessId },
      { $set: patch }
    );
    return NextResponse.json({ success: true, modified: res.modifiedCount ?? res.nModified ?? 0 });
  } catch (error) {
    console.error('[Inbox API] bulk:', error);
    return NextResponse.json({ success: false, error: 'Bulk action failed' }, { status: 500 });
  }
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
