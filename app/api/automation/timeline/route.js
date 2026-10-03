import { NextResponse } from 'next/server';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { getEntityTimeline, getBusinessTimeline } from '@/lib/crm/timeline';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    let result;
    if (entityType && entityId) {
      result = await getEntityTimeline(tenant.business._id, entityType, entityId, { limit, skip });
    } else {
      result = await getBusinessTimeline(tenant.business._id, { limit, skip, entityType: searchParams.get('filterEntityType') });
    }

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: { total: result.total, page, limit, pages: Math.ceil(result.total / limit) || 1 },
    });
  } catch (error) {
    console.error('[Timeline GET]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
