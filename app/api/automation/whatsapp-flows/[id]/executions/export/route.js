import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withPlanAccess } from '@/lib/accessControl';
import WhatsAppFlow from '@/models/automation/WhatsAppFlow';
import FlowExecution from '@/models/automation/FlowExecution';
import Lead from '@/models/automation/Lead';

function csvEscape(value) {
  const str = value == null ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * Export Workflow Responses — CSV of this flow's executions, one row per
 * run, with the variables collected during that run flattened into columns.
 */
export const GET = withPlanAccess('automation', async (req, { params }) => {
  try {
    await dbConnect();
    const { id } = await params;
    const businessId = req.user.businessId;

    const flow = await WhatsAppFlow.findOne({ _id: id, businessId }).lean();
    if (!flow) return NextResponse.json({ success: false, error: 'Flow not found' }, { status: 404 });

    const executions = await FlowExecution.find({ flowId: id, businessId })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const leadIds = [...new Set(executions.map((e) => String(e.leadId)).filter(Boolean))];
    const leads = leadIds.length
      ? await Lead.find({ _id: { $in: leadIds } }).select('name phone').lean()
      : [];
    const leadById = new Map(leads.map((l) => [String(l._id), l]));

    const variableKeys = [...new Set(executions.flatMap((e) => Object.keys(e.variables || {})))];
    const header = ['Started At', 'Status', 'Lead Name', 'Phone', 'Current Node', ...variableKeys];

    const rows = executions.map((e) => {
      const lead = leadById.get(String(e.leadId));
      return [
        e.startedAt ? new Date(e.startedAt).toISOString() : '',
        e.status,
        lead?.name || '',
        e.phone || lead?.phone || '',
        e.currentNodeKey || '',
        ...variableKeys.map((k) => e.variables?.[k] ?? ''),
      ];
    });

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const filename = `${(flow.name || 'flow').replace(/\s+/g, '-').toLowerCase()}-responses.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
