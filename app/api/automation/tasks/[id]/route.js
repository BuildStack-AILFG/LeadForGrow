import { NextResponse } from 'next/server';
import { dbConnect } from "@/lib/mongodb";
import Task from '@/models/automation/Task';
import Activity from '@/models/automation/Activity';
import mongoose from 'mongoose';
import { withPlanAccess } from '@/lib/accessControl';
import { resolveTaskScopeForUser, taskOwnerFilter } from '@/lib/crm/taskVisibility';

// PUT - Update task
export const PUT = withPlanAccess('tasks', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const user = req.user;
    const businessId = user.businessId;
    const body = await req.json();
    const { performedBy, status, dueDate, notes, autoSend, messageContent } = body;

    const scope = await resolveTaskScopeForUser(user);
    const task = await Task.findOne({ _id: id, businessId, ...taskOwnerFilter(scope) });
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const updates = {};
    if (status) {
      updates.status = status;
      if (status === 'completed') {
        updates.completedAt = new Date();
        updates.completedBy = performedBy || user.userId;

        await Activity.create({
          leadId: task.leadId, businessId,
          type: 'follow_up_completed',
          description: `Follow-up task completed: ${task.title}`,
          performedBy: performedBy || user.userId,
          metadata: { taskId: id }
        });
      }
    }

    if (dueDate) {
      updates.dueDate = new Date(dueDate);
    }
    if (notes) updates.notes = notes;
    if (autoSend !== undefined) updates.autoSend = autoSend;
    if (messageContent !== undefined) updates.messageContent = messageContent;

    const updatedTask = await Task.findByIdAndUpdate(id, updates, { new: true })
      .populate('leadId', 'name phone serviceInterest')
      .populate('assignedTo', 'email');

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
});

// DELETE - Delete task
export const DELETE = withPlanAccess('tasks', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const user = req.user;
    const businessId = user.businessId;

    const scope = await resolveTaskScopeForUser(user);
    const task = await Task.findOneAndDelete({ _id: id, businessId, ...taskOwnerFilter(scope) });
    if (!task) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
});
