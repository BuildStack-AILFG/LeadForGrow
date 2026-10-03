import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Business from '@/models/Business';
import { withTenantAuth, resolveTenant, invalidateBusinessPlanCache } from '@/lib/auth';

export const POST = withTenantAuth(async (req) => {
  try {
    const tenant = await resolveTenant(req);
    if (tenant.error) {
      return NextResponse.json({ success: false, error: tenant.error }, { status: tenant.status });
    }

    const { business } = tenant;

    if (business.plan !== 'free') {
      return NextResponse.json(
        { success: false, error: `Cannot activate trial. Current plan is ${business.plan}` },
        { status: 400 }
      );
    }

    business.plan = 'trial';
    await business.save();
    invalidateBusinessPlanCache(business._id);

    return NextResponse.json({ success: true, message: 'Trial activated successfully', plan: 'trial' });
  } catch (error) {
    console.error('Error activating trial:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
});
