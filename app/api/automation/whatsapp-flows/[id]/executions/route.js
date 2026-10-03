import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import FlowExecution from '@/models/automation/FlowExecution';
import Lead from '@/models/automation/Lead';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const status = searchParams.get('status'); // active, completed, failed, waiting, test

    const query = { flowId: id, businessId };
    if (status) query.status = status;

    const execs = await FlowExecution.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await FlowExecution.countDocuments(query);

    // Enrich with lead names — one query for the whole page, scoped to this business.
    const leadIds = [...new Set(execs.map((e) => e.leadId).filter(Boolean).map(String))];
    const leads = leadIds.length
      ? await Lead.find({ _id: { $in: leadIds }, businessId }).select('name phone').lean()
      : [];
    const leadById = new Map(leads.map((l) => [String(l._id), l]));
    const enriched = execs.map((exec) => {
      const lead = exec.leadId ? leadById.get(String(exec.leadId)) : null;
      return {
        ...exec.toObject(),
        leadName: lead?.name,
        leadPhone: lead?.phone,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
