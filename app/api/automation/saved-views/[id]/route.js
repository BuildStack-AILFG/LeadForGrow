import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import SavedView from '@/models/automation/SavedView';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { serverErrorMessage } from '@/lib/api/serverError';

export const DELETE = withTenantAuth(async (request, { params }) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { id } = await params;
    await dbConnect();

    const view = await SavedView.findOne({ _id: id, businessId: tenant.business._id, userId: tenant.user._id });
    if (!view) return NextResponse.json({ success: false, error: 'View not found' }, { status: 404 });

    await view.softDelete(tenant.user._id);
    return NextResponse.json({ success: true, message: 'View deleted' });
  } catch (error) {
    console.error('[SavedView DELETE]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
