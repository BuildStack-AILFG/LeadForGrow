import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SavedView from '@/models/automation/SavedView';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const query = {
      businessId: tenant.business._id,
      deletedAt: null,
      $or: [{ userId: tenant.user._id }, { isShared: true }],
    };
    if (entityType) query.entityType = entityType;

    const views = await SavedView.find(query).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, data: views });
  } catch (error) {
    console.error('[SavedViews GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const body = await request.json();
    if (!body.name || !body.entityType) {
      return NextResponse.json({ success: false, error: 'name and entityType required' }, { status: 400 });
    }

    await dbConnect();

    const view = await SavedView.create({
      businessId: tenant.business._id,
      userId: tenant.user._id,
      entityType: body.entityType,
      name: body.name,
      filters: body.filters || {},
      sortField: body.sortField || 'updatedAt',
      sortDir: body.sortDir || 'desc',
      columns: body.columns || [],
      isShared: body.isShared || false,
      createdBy: tenant.user._id,
    });

    return NextResponse.json({ success: true, data: view }, { status: 201 });
  } catch (error) {
    console.error('[SavedViews POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
