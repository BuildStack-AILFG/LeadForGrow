import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import CrmCustomField from '@/models/automation/CrmCustomField';
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

    const query = { businessId: tenant.business._id, active: true, deletedAt: null };
    if (entityType) query.entityType = entityType;

    const fields = await CrmCustomField.find(query).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: fields });
  } catch (error) {
    console.error('[CustomFields GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});

export const POST = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const body = await request.json();
    if (!body.entityType || !body.key || !body.label) {
      return NextResponse.json({ success: false, error: 'entityType, key, and label required' }, { status: 400 });
    }

    await dbConnect();

    const field = await CrmCustomField.create({
      ...body,
      // Tenant/audit fields last so client payloads can never override them
      businessId: tenant.business._id,
      createdBy: tenant.user._id,
    });

    return NextResponse.json({ success: true, data: field }, { status: 201 });
  } catch (error) {
    console.error('[CustomFields POST]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
