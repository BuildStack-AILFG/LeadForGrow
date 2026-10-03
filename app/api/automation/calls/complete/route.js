import { NextResponse } from 'next/server';
import Activity from '@/models/automation/Activity';
import Lead from '@/models/automation/Lead';
import Task from '@/models/automation/Task';
import { withAuth } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const POST = withAuth()(async (req) => {
    try {
        const { businessId: bodyBusinessId, userId: bodyUserId, leadId, notes, followUpTime, duration, provider } = await req.json();
        const user = req.user;
        const businessId = bodyBusinessId || user.businessId;
        const userId = bodyUserId || user.userId;

        if (!leadId) {
            return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
        }

        // 1. Create a detailed activity log
        const activity = await Activity.create({
            businessId,
            leadId,
            type: 'contacted',
            description: `Desktop Call: ${notes?.substring(0, 50)}${notes?.length > 50 ? '...' : ''}`,
            metadata: {
                channel: 'desktop-dialer',
                provider,
                durationSeconds: duration,
                notes: notes,
                callTimestamp: new Date(),
                followUpTime: followUpTime
            },
            performedBy: userId || 'system'
        });

        // 2. Update Lead status to 'contacted'
        await Lead.findByIdAndUpdate(leadId, {
            $set: { status: 'contacted' },
            $push: { activities: activity._id }
        });

        // 3. Create Follow-up Task if requested
        if (followUpTime) {
            const leadDoc = await Lead.findById(leadId);
            await Task.create({
                businessId,
                leadId,
                type: 'call',
                title: `Scheduled Callback: ${leadDoc?.name || 'Lead'}`,
                description: `Follow-up call scheduled from Live Dialer. \nNotes from previous call: ${notes}`,
                dueDate: new Date(followUpTime),
                assignedTo: userId,
                status: 'pending'
            });
        }

        return NextResponse.json({ success: true, activity });

    } catch (error) {
        console.error('[API Complete Call] Error:', error);
        return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
    }
});
