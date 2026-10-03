import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Broadcast from '@/models/automation/Broadcast';
import { withPlanAccess } from '@/lib/accessControl';
import { sendBroadcast } from '@/lib/broadcasts/engine';
import { normalizeBroadcastEmailContent, EmailContentError } from '@/lib/broadcasts/emailContent';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const query = { businessId };
    if (status) query.status = status;

    const broadcasts = await Broadcast.find(query).sort({ updatedAt: -1 }).limit(500).lean();
    return NextResponse.json({ success: true, data: broadcasts });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const userId = req.user.userId;
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Broadcast name required' }, { status: 400 });
    }

    let content;
    try {
      content = normalizeBroadcastEmailContent(body.content || {});
    } catch (err) {
      if (err instanceof EmailContentError) return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      throw err;
    }

    const broadcast = await Broadcast.create({
      businessId,
      name: body.name.trim(),
      description: body.description,
      channel: body.channel || 'whatsapp',
      status: body.sendNow ? 'sending' : (body.scheduledAt ? 'scheduled' : 'draft'),
      audience: body.audience || { type: 'filter', filters: {} },
      content,
      scheduledAt: body.scheduledAt,
      testMode: body.testMode || false,
      testRecipients: body.testRecipients || [],
      createdBy: userId,
    });

    if (body.sendNow || body.testSend) {
      // Wrap send separately so a Meta/DB error never leaks as HTML — the
      // broadcast already exists, so we return it in a failed state instead.
      try {
        await sendBroadcast(broadcast._id);
      } catch (sendErr) {
        console.error('[Broadcast] send failed:', sendErr);
        await Broadcast.updateOne(
          { _id: broadcast._id },
          { $set: { status: 'failed', 'analytics.failed': 1 } }
        ).catch(() => {});
        const updated = await Broadcast.findById(broadcast._id).lean();
        return NextResponse.json(
          { success: false, error: sendErr.message || 'Send failed', data: updated },
          { status: 200 }, // 200 so frontend can read the body without .json() crashing on error pages
        );
      }
      const updated = await Broadcast.findById(broadcast._id).lean();
      return NextResponse.json({ success: true, data: updated }, { status: 201 });
    }

    return NextResponse.json({ success: true, data: broadcast }, { status: 201 });
  } catch (error) {
    console.error('[Broadcast POST] failed:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) || 'Server error' }, { status: 500 });
  }
});
