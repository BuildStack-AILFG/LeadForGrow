import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Pipeline from '@/models/automation/Pipeline';
import Deal from '@/models/automation/Deal';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { normalizePipelineStages } from '@/lib/crm/pipelineUtils';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const pipeline = await Pipeline.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null }).lean();
    if (!pipeline) return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });

    const analytics = await Deal.aggregate([
      { $match: { businessId: tenant.business._id, pipelineId: pipeline._id, archived: false } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' },
          weightedValue: { $sum: { $multiply: ['$amount', { $divide: ['$probability', 100] }] } },
        },
      },
    ]);

    return NextResponse.json({ success: true, data: { ...pipeline, analytics } });
  } catch (error) {
    console.error('[Pipeline GET]', error);
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

    const pipeline = await Pipeline.findOne({ _id: id, businessId: tenant.business._id, deletedAt: null });
    if (!pipeline) return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });

    if (body.isDefault) {
      await Pipeline.updateMany(
        { businessId: tenant.business._id, entityType: pipeline.entityType, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const allowed = ['name', 'description', 'stages', 'isDefault', 'archived'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'stages') {
          pipeline[key] = normalizePipelineStages(body.stages);
        } else {
          pipeline[key] = body[key];
        }
      }
    }
    pipeline.updatedBy = tenant.user._id;
    await pipeline.save();

    return NextResponse.json({ success: true, data: pipeline });
  } catch (error) {
    console.error('[Pipeline PUT]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const DELETE = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const pipeline = await Pipeline.findOne({ _id: id, businessId: tenant.business._id });
    if (!pipeline) return NextResponse.json({ success: false, error: 'Pipeline not found' }, { status: 404 });
    if (pipeline.isDefault) return NextResponse.json({ success: false, error: 'Cannot delete default pipeline' }, { status: 400 });

    pipeline.archived = true;
    pipeline.updatedBy = tenant.user._id;
    await pipeline.save();

    return NextResponse.json({ success: true, message: 'Pipeline archived' });
  } catch (error) {
    console.error('[Pipeline DELETE]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
