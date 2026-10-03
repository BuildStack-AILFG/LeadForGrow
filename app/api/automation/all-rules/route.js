import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    const baseQuery = { businessId };
    let flowQuery = { ...baseQuery };

    // Build search query
    if (q) {
      flowQuery.$or = [
        { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { description: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ];
    }

    // Fetch WhatsApp Flows (published only)
    const whatsappFlows = await WhatsAppFlow.find({ ...flowQuery, status: 'published' })
      .select('name description status triggerType totalExecutions completed failed active publishedAt')
      .sort({ updatedAt: -1 })
      .lean();

    // Transform WhatsApp flows to match Automation Rules format
    const flows = whatsappFlows.map((flow) => ({
      _id: flow._id.toString(),
      id: flow._id.toString(),
      name: flow.name,
      description: flow.description || '',
      type: 'whatsapp_flow',
      category: 'whatsapp',
      status: 'active', // Published flows are active
      icon: '💬',
      channel: 'whatsapp',
      trigger: flow.triggerType || 'incoming_message',
      active: flow.status === 'published',
      runs: flow.totalExecutions || 0,
      createdAt: flow.publishedAt || new Date(),
      updatedAt: flow.publishedAt || new Date(),
      analytics: {
        total: flow.totalExecutions || 0,
        completed: flow.completed || 0,
        failed: flow.failed || 0,
        active: flow.active || 0,
      },
    }));

    return NextResponse.json({
      success: true,
      data: flows,
      count: flows.length,
      message: `${flows.length} active automation rule${flows.length !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    console.error('[Automation All Rules]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
