import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Conversation from '@/models/omnichannel/Conversation';
import Message from '@/models/automation/Message';
import Task from '@/models/automation/Task';
import MeetingBooking from '@/models/meetings/MeetingBooking';
import Activity from '@/models/automation/Activity';
import { withPermissions } from '@/lib/rbac';
import { markConversationRead } from '@/lib/omnichannel/conversationService';

async function getHandler(req, { params }) {
  try {
    const { user } = req;
    const { id } = await params;
    await dbConnect();

    const conversation = await Conversation.findOne({ _id: id, businessId: user.businessId })
      .populate('leadId')
      .populate('contactId')
      .populate('companyId')
      .populate('dealId')
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const leadId = conversation.leadId?._id || conversation.leadId;

    const [messages, tasks, meetings, activities, previousConversations] = await Promise.all([
      Message.find({ conversationId: id }).sort({ timestamp: 1 }).limit(200).lean(),
      leadId
        ? Task.find({ businessId: user.businessId, leadId, status: { $ne: 'completed' } }).limit(10).lean()
        : [],
      leadId
        ? MeetingBooking.find({
            businessId: user.businessId,
            leadId,
            status: { $in: ['scheduled', 'confirmed'] },
            startTime: { $gte: new Date() },
          })
            .sort({ startTime: 1 })
            .limit(5)
            .lean()
        : [],
      leadId
        ? Activity.find({ businessId: user.businessId, leadId }).sort({ performedAt: -1 }).limit(20).lean()
        : [],
      Conversation.find({
        businessId: user.businessId,
        leadId,
        _id: { $ne: id },
      })
        .sort({ lastMessageAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
        tasks,
        meetings,
        activities,
        previousConversations,
      },
    });
  } catch (error) {
    console.error('[Inbox API] conversation detail:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

async function patchHandler(req, { params }) {
  try {
    const { user } = req;
    const { id } = await params;
    const body = await req.json();
    await dbConnect();

    const allowed = [
      'isPinned', 'isFavorite', 'isArchived', 'isSpam', 'inboxStatus', 'status',
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (body.markRead) {
      await markConversationRead(id, user.businessId);
    }

    // Done / reopen: keep closedAt in step with status (closed -> now, open -> cleared).
    const update = { $set: updates };
    if (updates.status === 'closed') update.$set.closedAt = new Date();
    else if (updates.status === 'open') update.$unset = { closedAt: 1 };

    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, businessId: user.businessId },
      update,
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error('[Inbox API] conversation patch:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}

export const GET = withPermissions(['dashboard_access', 'reports_access'], getHandler);
export const PATCH = withPermissions(['dashboard_access', 'reports_access'], patchHandler);
