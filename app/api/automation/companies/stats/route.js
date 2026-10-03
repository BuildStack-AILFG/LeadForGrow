import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { buildCompaniesDashboardStats } from '@/lib/crm/companyService';
import { serverErrorMessage } from '@/lib/api/serverError';

export const dynamic = 'force-dynamic';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    await dbConnect();
    const stats = await buildCompaniesDashboardStats(tenant.business._id);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Companies Stats API]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
