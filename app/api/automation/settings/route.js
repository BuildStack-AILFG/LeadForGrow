import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withPlanAccess } from '@/lib/accessControl';
import { getAutomationSettings } from '@/lib/automation/businessHours';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const business = await Business.findById(req.user.businessId).lean();
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    const settings = business.settings?.automation || {};
    return NextResponse.json({
      success: true,
      data: {
        ...getAutomationSettings(business),
        defaults: settings.defaults || {
          autoAssign: true,
          createTaskOnNewLead: false,
          sendWelcomeWhatsApp: true,
        },
        sla: settings.sla || { firstResponse: 15, followUp: 60, escalation: 120 },
        followUp: settings.followUp || { maxAttempts: 5, intervalHours: 24, channels: ['whatsapp', 'email'] },
        assignment: settings.assignment || {
          strategy: business.settings?.assignmentStrategy || 'round-robin',
          respectWorkingHours: true,
        },
        retryPolicy: settings.retryPolicy || { maxRetries: 3, backoffMs: 5000 },
        approvalRules: settings.approvalRules || { requireApproval: false },
        timezone: settings.timezone || 'Asia/Kolkata',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const body = await req.json();
    const business = await Business.findById(req.user.businessId);
    if (!business) return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });

    business.settings = business.settings || {};
    business.settings.automation = {
      ...(business.settings.automation || {}),
      ...body,
      businessHours: body.businessHours || business.settings.automation?.businessHours,
    };

    if (body.assignment?.strategy) {
      business.settings.assignmentStrategy = body.assignment.strategy;
    }

    await business.save();
    return NextResponse.json({ success: true, data: business.settings.automation });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
