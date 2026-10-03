import { NextResponse } from 'next/server';
import { escapeRegex } from '@/lib/crm/queryBuilder';
import crypto from 'crypto';
import { dbConnect } from '@/lib/mongodb';
import AutomationSequence from '@/models/automation/AutomationSequence';
import { withPlanAccess } from '@/lib/accessControl';
import { syncSequenceRule } from '@/lib/sequences/ruleSync';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withPlanAccess('automation', async (req) => {
  try {
    await dbConnect();
    const businessId = req.user.businessId;
    const { searchParams } = new URL(req.url);
    const q = escapeRegex(searchParams.get('q')?.trim() || '').slice(0, 200) || null;
    const folderId = searchParams.get('folderId');
    const status = searchParams.get('status');

    const query = { businessId };
    if (folderId) query.folderId = folderId === 'none' ? null : folderId;
    if (status) query.status = status;
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    const sequences = await AutomationSequence.find(query)
      .sort({ updatedAt: -1 })
      .lean();
    return NextResponse.json({ success: true, data: sequences });
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

    const {
      name,
      description,
      category = 'custom',
      triggerType = 'new_lead',
      triggerConfig = {},
      nodes = [],
      edges = [],
      steps = [],
      status = 'draft',
      templateId,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Sequence name required' }, { status: 400 });
    }

    const workflowMode = nodes.length > 0 ? 'graph' : 'linear';
    const webhookSecret = triggerType === 'webhook' ? crypto.randomBytes(24).toString('hex') : undefined;

    const sequence = await AutomationSequence.create({
      businessId,
      name: name.trim(),
      description,
      category,
      triggerType,
      triggerConfig,
      workflowMode,
      nodes,
      edges,
      steps,
      status,
      createdBy: userId,
      tags: body.tags || [],
      folderId: body.folderId || null,
      abTest: body.abTest,
      ...(webhookSecret ? { webhookSecret } : {}),
    });

    await syncSequenceRule(sequence, userId);

    const populated = await AutomationSequence.findById(sequence._id).lean();
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    console.error('[Sequences API] POST error:', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
