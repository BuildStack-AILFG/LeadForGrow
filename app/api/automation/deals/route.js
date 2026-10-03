import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Deal from '@/models/automation/Deal';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { ensureDefaultPipeline, getStageByKey } from '@/lib/crm/pipelines';
import { getDefaultStageKey } from '@/lib/crm/pipelineUtils';
import Pipeline from '@/models/automation/Pipeline';
import { logTimelineEvent } from '@/lib/crm/timeline';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50', 10)), 100);
    const skip = (page - 1) * limit;

    const query = { businessId: tenant.business._id, archived: false };
    if (stage) query.stage = stage;

    const [deals, total, pipelineAgg, defaultPipeline] = await Promise.all([
      Deal.find(query)
        .populate('leadId', 'name email phone status')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Deal.countDocuments(query),
      Deal.aggregate([
        { $match: { businessId: tenant.business._id, archived: false } },
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            totalValue: { $sum: '$amount' },
            weightedValue: { $sum: { $multiply: ['$amount', { $divide: ['$probability', 100] }] } },
          },
        },
      ]),
      ensureDefaultPipeline(tenant.business._id),
    ]);

    return NextResponse.json({
      success: true,
      data: deals,
      pipeline: pipelineAgg,
      pipelineStages: defaultPipeline?.stages || [],
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error('[Deals API]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    await dbConnect();

    let pipelineDoc = null;
    if (body.pipelineId) {
      pipelineDoc = await Pipeline.findOne({ _id: body.pipelineId, businessId: tenant.business._id, deletedAt: null });
    }
    if (!pipelineDoc) {
      pipelineDoc = await ensureDefaultPipeline(tenant.business._id);
    }

    const stageKey = body.stage || getDefaultStageKey(pipelineDoc.stages);
    const stageConfig = getStageByKey(pipelineDoc, stageKey);

    const deal = await Deal.create({
      businessId: tenant.business._id,
      title: body.title,
      amount: body.amount || 0,
      currency: body.currency || 'INR',
      probability: body.probability ?? stageConfig?.probability ?? 10,
      stage: stageKey,
      pipelineId: pipelineDoc._id,
      expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : undefined,
      assignedTo: body.assignedTo || tenant.user._id,
      ownerId: tenant.user._id,
      leadId: body.leadId || undefined,
      contactId: body.contactId || undefined,
      companyId: body.companyId || undefined,
      products: body.products || [],
      tags: body.tags || [],
      source: body.source,
      createdBy: tenant.user._id,
    });

    await logTimelineEvent({
      businessId: tenant.business._id,
      entityType: 'deal',
      entityId: deal._id,
      leadId: body.leadId,
      type: 'deal_created',
      description: `Deal "${deal.title}" created`,
      performedBy: tenant.user._id,
    });

    if (body.companyId) {
      await logTimelineEvent({
        businessId: tenant.business._id,
        entityType: 'company',
        entityId: body.companyId,
        type: 'company_updated',
        description: `Deal "${deal.title}" linked to company`,
        performedBy: tenant.user._id,
        metadata: { dealId: deal._id },
      });
    }

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error) {
    console.error('[Deals API POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
