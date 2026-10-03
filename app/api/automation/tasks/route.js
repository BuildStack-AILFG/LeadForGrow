import { dbConnect } from '@/lib/mongodb';
import Task from '@/models/automation/Task';
import Lead from '@/models/automation/Lead';
import { NextResponse } from 'next/server';
import { withTenantAuth, resolveTenant } from '@/lib/auth';

/** Pending tasks returned per request — enough for any screen, bounded for big teams. */
const TASK_LIST_LIMIT = 500;

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { user, business } = tenant;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'today', 'overdue', 'upcoming'
    const assignedTo = searchParams.get('assignedTo');
    const leadId = searchParams.get('leadId');
    const companyId = searchParams.get('companyId');
    // Reminder polling asks only for tasks due within N minutes (overdue included),
    // instead of downloading every pending task and filtering in the browser.
    const dueWithin = Number.parseInt(searchParams.get('dueWithin'), 10);

    const query = { businessId: business._id, status: 'pending' };

    // Role-based filtering: members only see their own tasks
    if (user.role === 'member') {
      query.assignedTo = user._id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (leadId) query.leadId = leadId;
    if (companyId) query.companyId = companyId;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Tab badges: four index-backed counts instead of downloading every task four times.
    if (searchParams.get('counts') === '1') {
      const { dueDate: _ignored, ...base } = query;
      const [todayCount, overdueCount, upcomingCount, allCount] = await Promise.all([
        Task.countDocuments({ ...base, dueDate: { $gte: today, $lt: tomorrow } }),
        Task.countDocuments({ ...base, dueDate: { $lt: today } }),
        Task.countDocuments({ ...base, dueDate: { $gte: tomorrow } }),
        Task.countDocuments(base),
      ]);
      return NextResponse.json({
        success: true,
        data: { today: todayCount, overdue: overdueCount, upcoming: upcomingCount, all: allCount },
      });
    }

    if (filter === 'today') {
      query.dueDate = { $gte: today, $lt: tomorrow };
    } else if (filter === 'overdue') {
      query.dueDate = { $lt: today };
    } else if (filter === 'upcoming') {
      query.dueDate = { $gte: tomorrow };
    }
    if (Number.isFinite(dueWithin) && dueWithin >= 0) {
      query.dueDate = { $lte: new Date(now.getTime() + Math.min(dueWithin, 1440) * 60000) };
    }

    let tasksQuery = Task.find(query)
      .populate('leadId', 'name phone serviceInterest')
      .populate('assignedTo', 'email firstName lastName')
      .sort({ dueDate: 1 });
    tasksQuery = tasksQuery.limit(Number.isFinite(dueWithin) ? 100 : TASK_LIST_LIMIT);
    const tasks = await tasksQuery.lean();

    // A task whose lead was deleted (without going through a cascade-delete path,
    // e.g. legacy/seed data) can never be actioned — auto-cancel it here so it
    // stops permanently polluting overdue counts and follow-up reminders.
    // Tasks linked to a contact, deal or company (no lead) are valid and kept.
    const isOrphan = (t) => t.leadId == null && !t.contactId && !t.dealId && !t.companyId;
    const orphaned = tasks.filter(isOrphan);
    const valid = tasks.filter((t) => !isOrphan(t));
    if (orphaned.length) {
      await Task.updateMany(
        { _id: { $in: orphaned.map((t) => t._id) } },
        { $set: { status: 'cancelled', notes: 'Auto-cancelled: associated lead no longer exists' } }
      );
    }

    return NextResponse.json({ success: true, data: valid });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { business } = tenant;
    const body = await request.json();
    const { leadId, contactId, companyId, dealId, type, title, description, dueDate, assignedTo, priority, autoSend, messageContent, reminderAt } = body;

    if (!type || !title || !dueDate || !assignedTo) {
      return NextResponse.json({ success: false, error: 'type, title, dueDate, and assignedTo are required' }, { status: 400 });
    }

    if (!leadId && !contactId && !dealId && !companyId) {
      return NextResponse.json({ success: false, error: 'Link task to a lead, contact, deal, or company' }, { status: 400 });
    }

    const task = await Task.create({
      businessId: business._id,
      leadId: leadId || undefined,
      contactId: contactId || undefined,
      companyId: companyId || undefined,
      dealId: dealId || undefined,
      type,
      title,
      description,
      dueDate: new Date(dueDate),
      assignedTo,
      priority: priority || 'medium',
      status: 'pending',
      autoSend: !!autoSend,
      messageContent,
      reminderAt: reminderAt ? new Date(reminderAt) : undefined,
      createdBy: tenant.user._id,
    });

    const { logTimelineEvent } = await import('@/lib/crm/timeline');
    await logTimelineEvent({
      businessId: business._id,
      entityType: companyId ? 'company' : leadId ? 'lead' : dealId ? 'deal' : 'contact',
      entityId: companyId || leadId || dealId || contactId,
      leadId: leadId || undefined,
      type: 'task_created',
      description: `Task created: ${title}`,
      performedBy: tenant.user._id,
      metadata: { taskId: task._id },
    });

    const populatedTask = await Task.findById(task._id)
      .populate('leadId', 'name phone serviceInterest')
      .populate('assignedTo', 'email firstName lastName');

    return NextResponse.json({ success: true, data: populatedTask }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
});
