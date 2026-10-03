import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPermissions } from '@/lib/rbac';
import { assignConversation } from '@/lib/omnichannel/conversationService';
import { serverErrorMessage } from '@/lib/api/serverError';

async function handler(req, { params }) {
  try {
    const { user } = req;
    const { id } = await params;
    const body = await req.json();
    const { assignedTo, reason, claim } = body;

    await dbConnect();

    const toUserId = claim ? user.userId : assignedTo;
    if (!toUserId) {
      return NextResponse.json({ success: false, error: 'assignedTo required' }, { status: 400 });
    }

    const conversation = await assignConversation(id, user.businessId, {
      toUserId,
      assignedBy: user.userId,
      reason: reason || (claim ? 'claimed' : 'manual'),
    });

    const populated = await conversation.populate('assignedTo', 'firstName lastName email');

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error('[Inbox API] assign:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) || 'Failed' }, { status: 500 });
  }
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
