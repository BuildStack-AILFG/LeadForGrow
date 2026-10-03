import { NextResponse } from 'next/server';
import { withTenantAuth, resolveTenant } from '@/lib/auth';
import { findDuplicateLeads } from '@/lib/crm/duplicateDetection';
import { serverErrorMessage } from '@/lib/api/serverError';

export const GET = withTenantAuth(async (request) => {
  try {
    const tenant = await resolveTenant(request);
    if (tenant.error) return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const excludeId = searchParams.get('excludeId');

    const duplicates = await findDuplicateLeads(tenant.business._id, { phone, email, excludeId });
    return NextResponse.json({ success: true, data: duplicates });
  } catch (error) {
    console.error('[Leads Duplicates]', error);
    return NextResponse.json({ success: false, error: serverErrorMessage(error) }, { status: 500 });
  }
});
