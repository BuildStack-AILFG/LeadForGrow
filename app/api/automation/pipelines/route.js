import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Pipeline from '@/models/automation/Pipeline';
import Deal from '@/models/automation/Deal';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { ensureDefaultPipeline } from '@/lib/crm/pipelines';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    await dbConnect();
    await ensureDefaultPipeline(tenant.business._id);

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') || 'deal';

    const pipelines = await Pipeline.find({
      businessId: tenant.business._id,
      entityType,
      archived: false,
      deletedAt: null,
    }).sort({ isDefault: -1, name: 1 }).lean();

    return NextResponse.json({ success: true, data: pipelines });
  } catch (error) {
    console.error('[Pipelines GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const body = await request.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'Pipeline name required' }, { status: 400 });

    await dbConnect();

    if (body.isDefault) {
      await Pipeline.updateMany(
        { businessId: tenant.business._id, entityType: body.entityType || 'deal', isDefault: true },
        { isDefault: false }
      );
    }

    const pipeline = await Pipeline.create({
      businessId: tenant.business._id,
      name: body.name,
      description: body.description,
      entityType: body.entityType || 'deal',
      stages: body.stages || [],
      isDefault: body.isDefault || false,
      createdBy: tenant.user._id,
    });

    return NextResponse.json({ success: true, data: pipeline }, { status: 201 });
  } catch (error) {
    console.error('[Pipelines POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
