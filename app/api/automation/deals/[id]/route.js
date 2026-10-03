import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Deal from '@/models/automation/Deal';
import CrmNote from '@/models/automation/CrmNote';
import CrmAttachment from '@/models/automation/CrmAttachment';
import Task from '@/models/automation/Task';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { logTimelineEvent, getEntityTimeline } from '@/lib/crm/timeline';
import { ensureDefaultPipeline, getStageByKey } from '@/lib/crm/pipelines';
import { runDealStageAutomations } from '@/lib/crm/stageAutomations';
import { runDealStageCustomerMessages } from '@/lib/crm/dealCustomerMessages';
import { normalizeStageKey } from '@/lib/crm/stageKeys';
import { isStageClosed, isStageWon, getStageLabel } from '@/lib/crm/pipelineUtils';
import { normalizeLeadStatus } from '@/lib/crm/leadStages';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const deal = await Deal.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null })
      .populate('leadId', 'name email phone status')
      .populate('contactId', 'fullName emails phones')
      .populate('companyId', 'name domain')
      .populate('assignedTo', 'firstName lastName email')
      .populate('pipelineId', 'name stages')
      .lean();

    if (!deal) return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });

    const [timeline, tasks, notes, attachments] = await Promise.all([
      getEntityTimeline(tenant.business._id, 'deal', id, { limit: 50 }),
      Task.find({ businessId: tenant.business._id, dealId: id }).sort({ dueDate: 1 }).lean(),
      CrmNote.find({ businessId: tenant.business._id, entityType: 'deal', entityId: id, deletedAt: null }).sort({ pinned: -1, createdAt: -1 }).lean(),
      CrmAttachment.find({ businessId: tenant.business._id, entityType: 'deal', entityId: id, deletedAt: null }).lean(),
    ]);

    return NextResponse.json({ success: true, data: { ...deal, timeline: timeline.items, tasks, notes, attachments } });
  } catch (error) {
    console.error('[Deal GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const PUT = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    const body = await request.json();
    await dbConnect();

    const deal = await Deal.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null });
    if (!deal) return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });

    const oldStage = deal.stage;
    const stageChanging = body.stage && body.stage !== oldStage;

    const allowed = ['title', 'amount', 'currency', 'probability', 'stage', 'expectedCloseDate', 'assignedTo', 'leadId', 'contactId', 'companyId', 'pipelineId', 'products', 'tags', 'customFields', 'lostReason', 'wonReason', 'archived'];
    for (const key of allowed) {
      if (body[key] !== undefined) deal[key] = body[key];
    }

    // Resolved once and reused below (lead sync + won automations)
    let pipeline = null;
    let stageConfig = null;

    if (stageChanging) {
      pipeline = deal.pipelineId
        ? await (await import('@/models/automation/Pipeline')).default.findById(deal.pipelineId)
        : await ensureDefaultPipeline(tenant.business._id);

      stageConfig = getStageByKey(pipeline, body.stage);
      if (stageConfig) deal.probability = stageConfig.probability;

      try {
        await runDealStageAutomations({
          businessId: tenant.business._id,
          deal,
          oldStage,
          newStage: body.stage,
          stageConfig,
          userId: tenant.user._id,
          body,
        });
        runDealStageCustomerMessages({
          business: tenant.business,
          deal,
          newStage: body.stage,
          userId: tenant.user._id,
          body,
        }).catch((err) => console.error('[Deal] Customer message error:', err.message));
      } catch (autoErr) {
        if (autoErr.code === 'LOST_REASON_REQUIRED') {
          return NextResponse.json({ success: false, error: autoErr.message, code: autoErr.code }, { status: 400 });
        }
        throw autoErr;
      }

      if (!isStageClosed(body.stage, pipeline?.stages) && !stageConfig?.isWon && !stageConfig?.isLost) {
        await logTimelineEvent({
          businessId: tenant.business._id,
          entityType: 'deal',
          entityId: id,
          leadId: deal.leadId,
          type: 'deal_stage_changed',
          description: `Deal moved to ${getStageLabel(pipeline?.stages, body.stage)}`,
          performedBy: tenant.user._id,
          metadata: { oldStage, newStage: body.stage },
        });
      }
    } else if (Object.keys(body).some((k) => allowed.includes(k))) {
      await logTimelineEvent({
        businessId: tenant.business._id,
        entityType: 'deal',
        entityId: id,
        leadId: deal.leadId,
        type: 'deal_updated',
        description: 'Deal updated',
        performedBy: tenant.user._id,
      });
    }

    deal.updatedBy = tenant.user._id;
    await deal.save();

    if (stageChanging && deal.leadId) {
      const Lead = (await import('@/models/automation/Lead')).default;
      const normalizedStage = normalizeLeadStatus(normalizeStageKey(body.stage));
      const leadUpdates = { status: normalizedStage };
      if (normalizedStage === 'won' || normalizedStage === 'converted') {
        leadUpdates.convertedAt = new Date();
      }
      if (normalizedStage === 'lost') {
        leadUpdates.lostAt = new Date();
      }
      if (!isStageClosed(body.stage, pipeline?.stages) || normalizedStage === 'won' || normalizedStage === 'lost' || normalizedStage === 'converted') {
        await Lead.updateOne(
          { _id: deal.leadId, businessId: tenant.business._id },
          { $set: leadUpdates }
        );
      }
    }

    if (stageChanging && deal.leadId) {
      if (stageConfig?.isWon || isStageWon(body.stage, pipeline?.stages)) {
        try {
          const Lead = (await import('@/models/automation/Lead')).default;
          const lead = await Lead.findById(deal.leadId);
          if (lead) {
            const { dispatchAutomationEvent } = await import('@/lib/automation/triggerHub');
            const { attributeRevenueToWorkflows } = await import('@/lib/automation/revenueAttribution');
            await dispatchAutomationEvent(lead, 'deal_won', { dealId: deal._id, amount: deal.amount || deal.value });
            await attributeRevenueToWorkflows(lead._id, deal._id, deal.amount || deal.value);
          }
        } catch (autoErr) {
          console.error('[Deal] Revenue attribution error:', autoErr.message);
        }
      }
    }

    const populated = await Deal.findById(deal._id)
      .populate('leadId', 'name email phone status')
      .populate('contactId', 'fullName emails phones')
      .populate('companyId', 'name domain')
      .populate('assignedTo', 'firstName lastName email')
      .populate('pipelineId', 'name stages');

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error('[Deal PUT]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const deal = await Deal.findOne({ _id: id, businessId: tenant.business._id });
    if (!deal) return NextResponse.json({ success: false, error: 'Deal not found' }, { status: 404 });

    await deal.softDelete(tenant.user._id);
    return NextResponse.json({ success: true, message: 'Deal deleted' });
  } catch (error) {
    console.error('[Deal DELETE]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
