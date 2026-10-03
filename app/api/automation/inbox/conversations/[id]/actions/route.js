import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Conversation from '@/models/omnichannel/Conversation';
import Message from '@/models/automation/Message';
import Activity from '@/models/automation/Activity';
import { withPermissions } from '@/lib/rbac';
import { assignConversation, markConversationRead } from '@/lib/omnichannel/conversationService';
import { notifyConversationAssigned } from '@/lib/omnichannel/notifications';
import { emitDashboardMetrics } from '@/lib/realtime/publish';
import { serverErrorMessage } from '@/lib/api/serverError';

async function handler(req, { params }) {
  try {
    const { user } = req;
    const { id } = await params;
    const body = await req.json();
    const { action, ...data } = body;

    await dbConnect();
    const conversation = await Conversation.findOne({ _id: id, businessId: user.businessId });
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    let result = conversation;

    switch (action) {
      case 'close':
        conversation.status = 'closed';
        conversation.closedAt = new Date();
        await conversation.save();
        break;

      case 'reopen':
        conversation.status = 'open';
        conversation.closedAt = null;
        await conversation.save();
        break;

      case 'snooze':
        conversation.snoozedUntil = data.until ? new Date(data.until) : new Date(Date.now() + 3600000);
        await conversation.save();
        break;

      case 'unsnooze':
        conversation.snoozedUntil = null;
        await conversation.save();
        break;

      case 'mark_unread':
        conversation.inboxStatus = 'unread';
        conversation.unreadCount = Math.max(1, conversation.unreadCount || 1);
        await conversation.save();
        break;

      case 'delete':
        conversation.isDeleted = true;
        conversation.status = 'archived';
        conversation.isArchived = true;
        await conversation.save();
        break;

      case 'transfer':
        result = await assignConversation(id, user.businessId, {
          toUserId: data.assignedTo,
          fromUserId: conversation.assignedTo,
          assignedBy: user.userId,
          reason: data.reason || 'transferred',
        });
        await notifyConversationAssigned({
          businessId: user.businessId,
          toUserId: data.assignedTo,
          conversationId: id,
          channel: conversation.channel,
          assignedBy: user.userId,
        });
        break;

      case 'merge': {
        const { targetConversationId } = data;
        if (!targetConversationId) {
          return NextResponse.json({ success: false, error: 'targetConversationId required' }, { status: 400 });
        }
        await Message.updateMany(
          { businessId: user.businessId, conversationId: id },
          { $set: { conversationId: targetConversationId } }
        );
        conversation.isDeleted = true;
        conversation.isArchived = true;
        await conversation.save();
        result = await Conversation.findById(targetConversationId);
        break;
      }

      case 'export': {
        const messages = await Message.find({ businessId: user.businessId, conversationId: id })
          .sort({ timestamp: 1 })
          .lean();
        const exportData = {
          conversation: conversation.toObject(),
          messages,
          exportedAt: new Date().toISOString(),
        };
        return NextResponse.json({ success: true, data: exportData });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    await Activity.create({
      businessId: user.businessId,
      leadId: conversation.leadId,
      entityType: 'lead',
      entityId: conversation.leadId,
      type: 'conversation_assigned',
      description: `Conversation ${action}`,
      performedBy: user.userId,
      metadata: { conversationId: id, action, ...data },
    });

    await emitDashboardMetrics(user.businessId, { type: 'inbox_update' });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[Inbox API] actions:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) || 'Failed' }, { status: 500 });
  }
}

export const POST = withPermissions(['dashboard_access', 'reports_access'], handler);
