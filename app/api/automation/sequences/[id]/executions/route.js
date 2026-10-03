import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import SequenceExecution from '@/models/sequences/SequenceExecution';
import Lead from '@/models/automation/Lead';
import { withPlanAccess } from '@/lib/accessControl';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const sequence = await AutomationSequence.findOne({ _id: id, businessId });
    if (!sequence) {
      return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 });
    }

    const executions = await SequenceExecution.find({ sequenceId: id, businessId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const leadIds = executions.map((e) => e.leadId);
    const leads = await Lead.find({ _id: { $in: leadIds } }).select('name phone email status').lean();
    const leadMap = Object.fromEntries(leads.map((l) => [String(l._id), l]));

    const data = executions.map((ex) => ({
      ...ex,
      lead: leadMap[String(ex.leadId)] || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
